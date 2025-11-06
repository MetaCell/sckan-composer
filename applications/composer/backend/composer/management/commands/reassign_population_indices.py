import re
from datetime import datetime
from collections import defaultdict
from django.core.management.base import BaseCommand
from django.db import transaction
from composer.models import PopulationSet, ConnectivityStatement


class Command(BaseCommand):
    help = 'Reassign population indices based on curie_id patterns for exported statements'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )
        parser.add_argument(
            '--output-file',
            type=str,
            default=None,
            help='Output log file (default: population_index_reassignment_YYYY-MM-DD_HH-MM-SS.log)',
        )
        parser.add_argument(
            '--population',
            type=str,
            default=None,
            help='Process only a specific population set by name',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        population_filter = options['population']
        
        # Generate output filename with timestamp if not provided
        if options['output_file']:
            output_file = options['output_file']
        else:
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            mode = "dry_run_" if dry_run else ""
            output_file = f'population_index_reassignment_{mode}{timestamp}.log'
        
        self.stdout.write(self.style.SUCCESS('Starting population index reassignment...'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        try:
            with open(output_file, 'w', encoding='utf-8') as log_file:
                self.log(log_file, f"Population Index Reassignment Report")
                self.log(log_file, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                self.log(log_file, f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
                self.log(log_file, "=" * 80)
                self.log(log_file, "")
                
                # Get population sets to process
                population_sets = PopulationSet.objects.all()
                if population_filter:
                    population_sets = population_sets.filter(name=population_filter.lower())
                    if not population_sets.exists():
                        raise ValueError(f"Population set '{population_filter}' not found")
                
                total_populations = population_sets.count()
                self.log(log_file, f"Processing {total_populations} population set(s)...")
                self.log(log_file, "")
                
                total_statements_processed = 0
                total_statements_reassigned = 0
                total_conflicts = 0
                
                for population in population_sets:
                    result = self.process_population(population, log_file, dry_run)
                    total_statements_processed += result['processed']
                    total_statements_reassigned += result['reassigned']
                    total_conflicts += result['conflicts']
                
                # Summary
                self.log(log_file, "")
                self.log(log_file, "=" * 80)
                self.log(log_file, "SUMMARY")
                self.log(log_file, "=" * 80)
                self.log(log_file, f"Total population sets processed: {total_populations}")
                self.log(log_file, f"Total statements processed: {total_statements_processed}")
                self.log(log_file, f"Total statements reassigned: {total_statements_reassigned}")
                self.log(log_file, f"Total conflicts resolved: {total_conflicts}")
                
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nProcess completed!\n'
                    f'Population sets processed: {total_populations}\n'
                    f'Statements processed: {total_statements_processed}\n'
                    f'Statements reassigned: {total_statements_reassigned}\n'
                    f'Conflicts resolved: {total_conflicts}\n'
                    f'Log written to: {output_file}'
                )
            )
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        'Run without --dry-run to apply these changes.'
                    )
                )
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
            raise

    def process_population(self, population, log_file, dry_run):
        """Process all exported statements for a given population set"""
        self.log(log_file, f"Processing Population Set: {population.name}")
        self.log(log_file, "-" * 80)
        
        # Get all exported statements for this population
        statements = ConnectivityStatement.objects.filter(
            population=population,
            has_statement_been_exported=True
        ).order_by('id')
        
        statement_count = statements.count()
        self.log(log_file, f"Found {statement_count} exported statement(s)")
        
        if statement_count == 0:
            self.log(log_file, "No exported statements to process")
            self.log(log_file, "")
            return {'processed': 0, 'reassigned': 0, 'conflicts': 0}
        
        # Maps to track population indices
        hypothesis_index_map = {}  # hypothesis_index -> list of statement objects
        statement_assignments = {}  # statement_id -> assigned index
        bag = []  # Statements that couldn't get hypothesis index or have conflicts
        special_cases = []  # Track cases where hypothesis index couldn't be retrieved
        
        # Create a dictionary for fast statement lookup by id
        statements_dict = {s.id: s for s in statements}
        
        # Pattern to extract population index from curie_id
        # Expected format: "neuron type {population_name} {population_index}"
        pattern = rf"neuron type {re.escape(population.name)}\s+(\d+)"
        compiled_pattern = re.compile(pattern, re.IGNORECASE)
        
        # First pass: Extract hypothesis indices and detect conflicts
        self.log(log_file, "")
        self.log(log_file, "Phase 1: Analyzing curie_id patterns...")
        
        for statement in statements:
            hypothesis_index = None
            
            if statement.curie_id:
                match = compiled_pattern.search(statement.curie_id)
                if match:
                    hypothesis_index = int(match.group(1))
                    self.log(log_file, f"  Statement {statement.curie_id}: Found hypothesis index {hypothesis_index} from curie_id")
                else:
                    self.log(log_file, f"  WARNING - Could not extract index from curie_id: '{statement.curie_id}'")
                    special_cases.append({
                        'statement_id': statement.id,
                        'curie_id': statement.curie_id,
                        'reason': 'Pattern not matched'
                    })
            else:
                self.log(log_file, f"  Statement {statement.id}: WARNING - No curie_id present")
                special_cases.append({
                    'statement_id': statement.id,
                    'curie_id': None,
                    'reason': 'Missing curie_id'
                })
            
            if hypothesis_index is not None:
                if hypothesis_index not in hypothesis_index_map:
                    hypothesis_index_map[hypothesis_index] = []
                hypothesis_index_map[hypothesis_index].append(statement)
            else:
                bag.append(statement)
        
        # Second pass: Assign indices, handling conflicts
        self.log(log_file, "")
        self.log(log_file, "Phase 2: Assigning population indices...")
        
        conflicts_resolved = 0
        used_indices = set()
        
        # Process statements with hypothesis indices
        for hypothesis_index in sorted(hypothesis_index_map.keys()):
            statements_list = hypothesis_index_map[hypothesis_index]
            
            if len(statements_list) == 1:
                # No conflict - assign directly
                statement = statements_list[0]
                statement_assignments[statement.id] = hypothesis_index
                used_indices.add(hypothesis_index)
                self.log(log_file, f"  Statement {statement.curie_id}: Assigned index {hypothesis_index}")
            else:
                # Conflict - earliest statement (smallest id) gets the index
                statements_list.sort(key=lambda s: s.id)
                winner = statements_list[0]
                losers = statements_list[1:]
                
                statement_assignments[winner.id] = hypothesis_index
                used_indices.add(hypothesis_index)
                conflicts_resolved += len(losers)
                
                self.log(log_file, f"  Statement {winner.curie_id}: Assigned index {hypothesis_index} (conflict winner)")
                for loser in losers:
                    self.log(log_file, f"  Statement {loser.curie_id}: Moved to bag (conflict loser, had same hypothesis index {hypothesis_index})")
                    bag.append(loser)
        
        # Third pass: Assign indices to bag statements sequentially
        if bag:
            self.log(log_file, "")
            self.log(log_file, f"Phase 3: Assigning indices to {len(bag)} statement(s) in bag...")
            
            # Find the next available index
            if used_indices:
                next_index = max(used_indices) + 1
            else:
                next_index = 1
            
            # Sort bag by statement id to maintain consistent ordering
            bag.sort(key=lambda s: s.id)
            
            for statement in bag:
                # Find next unused index
                while next_index in used_indices:
                    next_index += 1
                
                statement_assignments[statement.id] = next_index
                used_indices.add(next_index)
                self.log(log_file, f"  Statement {statement.curie_id}: Assigned index {next_index} (from bag)")
                next_index += 1
        
        # Apply changes to database
        statements_reassigned = 0
        
        if not dry_run:
            self.log(log_file, "")
            self.log(log_file, "Phase 4: Updating database...")
            
            with transaction.atomic():
                for statement_id, new_index in statement_assignments.items():
                    statement = statements_dict[statement_id]
                    old_index = statement.population_index
                    
                    if old_index != new_index:
                        statement.population_index = new_index
                        statement.save(update_fields=['population_index'])
                        statements_reassigned += 1
                        self.log(log_file, f"  Statement {statement.curie_id}: Updated from {old_index} to {new_index}")
                    else:
                        self.log(log_file, f"  Statement {statement.curie_id}: No change needed (already {new_index})")

                # Update population's last_used_index
                if used_indices:
                    new_last_index = max(used_indices)
                    old_last_index = population.last_used_index
                    population.last_used_index = new_last_index
                    population.save(update_fields=['last_used_index'])
                    self.log(log_file, f"  Population {population.name}: Updated last_used_index from {old_last_index} to {new_last_index}")
        else:
            # In dry run, just report what would change
            self.log(log_file, "")
            self.log(log_file, "Phase 4: Database changes (DRY RUN - not applied)...")
            
            for statement_id, new_index in statement_assignments.items():
                statement = statements_dict[statement_id]
                old_index = statement.population_index
                
                if old_index != new_index:
                    statements_reassigned += 1
                    self.log(log_file, f"  Statement {statement_id}: Would update from {old_index} to {new_index}")
                else:
                    self.log(log_file, f"  Statement {statement_id}: No change needed (already {new_index})")
            
            if used_indices:
                new_last_index = max(used_indices)
                self.log(log_file, f"  Population {population.name}: Would update last_used_index to {new_last_index}")
        
        # Report special cases
        if special_cases:
            self.log(log_file, "")
            self.log(log_file, "Special Cases (curie_id issues):")
            for case in special_cases:
                self.log(log_file, f"  Statement {case['statement_id']}: {case['reason']}")
                if case['curie_id']:
                    self.log(log_file, f"    curie_id: '{case['curie_id']}'")
        
        self.log(log_file, "")
        self.log(log_file, f"Completed population '{population.name}':")
        self.log(log_file, f"  - Statements processed: {statement_count}")
        self.log(log_file, f"  - Statements reassigned: {statements_reassigned}")
        self.log(log_file, f"  - Conflicts resolved: {conflicts_resolved}")
        self.log(log_file, f"  - Special cases: {len(special_cases)}")
        self.log(log_file, "")
        
        return {
            'processed': statement_count,
            'reassigned': statements_reassigned,
            'conflicts': conflicts_resolved
        }

    def log(self, file_handle, message):
        """Write to both log file and stdout"""
        file_handle.write(message + '\n')
        self.stdout.write(message)
