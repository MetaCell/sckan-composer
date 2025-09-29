import os
import re
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.conf import settings
from composer.models import Provenance


class Command(BaseCommand):
    help = 'Fix provenance URIs that were affected by the URL decoding bug (missing slash after protocol)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be fixed without making changes',
        )
        parser.add_argument(
            '--output-file',
            type=str,
            default=None,
            help='Output file for fixed provenance IDs (default: fixed_provenance_ids_YYYY-MM-DD_HH-MM-SS.txt)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Batch size for processing provenances (default: 1000)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        # Generate output filename with timestamp if not provided
        if options['output_file']:
            output_file = options['output_file']
        else:
            timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
            mode = "dry_run_" if dry_run else ""
            output_file = f'fixed_provenance_ids_{mode}{timestamp}.txt'
        
        self.stdout.write(self.style.SUCCESS('Starting provenance URI fix...'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Patterns to identify and fix broken URIs
        fix_patterns = [
            (r'^http:/([^/].+)$', r'http://\1'),      # http:/domain -> http://domain
            (r'^https:/([^/].+)$', r'https://\1'),    # https:/domain -> https://domain
        ]
        
        fixed_provenances = []
        total_checked = 0
        
        try:
            # Get total count for progress
            total_provenances = Provenance.objects.count()
            self.stdout.write(f'Found {total_provenances} provenances to check...')
            
            # Process in batches for efficiency
            with transaction.atomic():
                # Use iterator to avoid loading all objects into memory
                provenance_qs = Provenance.objects.select_related('connectivity_statement').all()
                
                for provenance in provenance_qs.iterator(chunk_size=batch_size):
                    total_checked += 1
                    original_uri = provenance.uri
                    fixed_uri = None
                    
                    # Try each pattern to find a fix
                    for pattern, replacement in fix_patterns:
                        if re.match(pattern, original_uri):
                            fixed_uri = re.sub(pattern, replacement, original_uri)
                            break
                    
                    # If we found a fix, validate and apply it
                    if fixed_uri and fixed_uri != original_uri:
                        if self.is_valid_fix(original_uri, fixed_uri):
                            fix_info = {
                                'id': provenance.id,
                                'original_uri': original_uri,
                                'fixed_uri': fixed_uri,
                                'connectivity_statement_id': provenance.connectivity_statement_id
                            }
                            
                            self.stdout.write(
                                f'ID {provenance.id}: {original_uri} -> {fixed_uri}'
                            )
                            
                            if not dry_run:
                                provenance.uri = fixed_uri
                                provenance.save(update_fields=['uri'])
                            
                            fixed_provenances.append(fix_info)
                        else:
                            self.stdout.write(
                                self.style.WARNING(
                                    f'Skipping ID {provenance.id}: Invalid fix pattern {original_uri} -> {fixed_uri}'
                                )
                            )
                    
                    # Progress indicator
                    if total_checked % batch_size == 0:
                        self.stdout.write(f'Processed {total_checked}/{total_provenances}...')
            
            # Write detailed results to file
            self.write_detailed_results_file(fixed_provenances, output_file, dry_run)
            
            # Summary
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nProcess completed!\n'
                    f'Total provenances checked: {total_checked}\n'
                    f'Provenances fixed: {len(fixed_provenances)}\n'
                    f'Results written to: {output_file}'
                )
            )
            
            if dry_run and fixed_provenances:
                self.stdout.write(
                    self.style.WARNING(
                        'Run without --dry-run to apply these fixes.'
                    )
                )
            elif not fixed_provenances:
                self.stdout.write(
                    self.style.SUCCESS(
                        'No broken URIs found! All provenances appear to be correct.'
                    )
                )
                
        except Exception as e:
            raise CommandError(f'Error processing provenances: {e}')

    def is_valid_fix(self, original, fixed):
        """
        Validate that the fix makes sense:
        - Should add exactly one slash after protocol
        - Result should be a reasonable URI pattern
        - Should not break valid URIs
        """
        # Check for http:/ -> http:// conversion
        if original.startswith('http:/') and not original.startswith('http://'):
            if fixed.startswith('http://') and len(fixed) == len(original) + 1:
                # Make sure we didn't break a valid URI like http://example.com
                if original.startswith('http://'):
                    return False
                return True
        
        # Check for https:/ -> https:// conversion  
        if original.startswith('https:/') and not original.startswith('https://'):
            if fixed.startswith('https://') and len(fixed) == len(original) + 1:
                # Make sure we didn't break a valid URI like https://example.com
                if original.startswith('https://'):
                    return False
                return True
        
        return False

    def write_detailed_results_file(self, fixed_provenances, filename, dry_run):
        """Write detailed results including IDs and URI changes to a text file"""
        mode_text = "DRY RUN - " if dry_run else ""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                # Header
                f.write(f"# {mode_text}Fixed Provenance URIs Report\n")
                f.write(f"# Generated: {timestamp}\n")
                f.write(f"# Total fixed: {len(fixed_provenances)}\n")
                f.write(f"# Format: ID | Original URI | Fixed URI | Connectivity Statement ID\n")
                f.write("#" + "="*80 + "\n\n")
                
                if not fixed_provenances:
                    f.write("No broken URIs found.\n")
                else:
                    # Write summary of IDs only (for easy scripting)
                    f.write("# Fixed Provenance IDs (one per line):\n")
                    for item in fixed_provenances:
                        f.write(f"{item['id']}\n")
                    
                    f.write(f"\n# Detailed Changes:\n")
                    
                    # Write detailed changes
                    for item in fixed_provenances:
                        f.write(f"ID: {item['id']}\n")
                        f.write(f"  Connectivity Statement: {item['connectivity_statement_id']}\n")
                        f.write(f"  Original: {item['original_uri']}\n")
                        f.write(f"  Fixed:    {item['fixed_uri']}\n")
                        f.write(f"  Change:   Added missing slash after protocol\n")
                        f.write("-" * 60 + "\n")
                    
            self.stdout.write(f'Detailed results written to {filename}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to write results file: {e}')
            )