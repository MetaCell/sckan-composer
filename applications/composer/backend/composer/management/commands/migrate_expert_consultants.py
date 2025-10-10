from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Prefetch
from composer.models import ConnectivityStatement, StatementAlert, AlertType, ExpertConsultant


class Command(BaseCommand):
    help = 'Migrate expert consultant data from statement alerts to ExpertConsultant model'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be migrated without making changes',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Batch size for processing statement alerts (default: 100)',
        )
        parser.add_argument(
            '--predicate',
            type=str,
            default='expertConsultant',
            help='Alert type predicate to look for (default: expertConsultant)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        predicate = options['predicate']
        
        self.stdout.write(self.style.SUCCESS('Starting expert consultant migration...'))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        
        # Statistics
        total_alerts_found = 0
        total_created = 0
        total_failed = 0
        total_alerts_deleted = 0
        failed_migrations = []
        
        try:
            # First, check if the alert type exists
            try:
                alert_type = AlertType.objects.get(predicate=predicate)
                self.stdout.write(f'Found alert type: {alert_type.name} (predicate: {predicate})')
            except AlertType.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(
                        f'No alert type found with predicate "{predicate}". Nothing to migrate.'
                    )
                )
                return
            
            # Get all statement alerts with the expert consultant predicate
            # Use select_related to minimize database queries
            alerts_queryset = StatementAlert.objects.filter(
                alert_type=alert_type
            ).select_related(
                'connectivity_statement',
                'alert_type'
            ).order_by('connectivity_statement_id')
            
            total_alerts_found = alerts_queryset.count()
            self.stdout.write(f'Found {total_alerts_found} expert consultant alerts to migrate...')
            
            if total_alerts_found == 0:
                self.stdout.write(
                    self.style.SUCCESS('No expert consultant alerts found. Migration complete!')
                )
                return
            
            # Process alerts in batches
            processed_count = 0
            
            # Group alerts by connectivity statement for efficient processing
            current_batch = []
            
            for alert in alerts_queryset.iterator(chunk_size=batch_size):
                current_batch.append(alert)
                processed_count += 1
                
                # Process batch when it reaches the batch size or at the end
                if len(current_batch) >= batch_size or processed_count == total_alerts_found:
                    batch_results = self._process_batch(current_batch, dry_run)
                    
                    total_created += batch_results['created']
                    total_failed += batch_results['failed']
                    total_alerts_deleted += batch_results['deleted']
                    failed_migrations.extend(batch_results['failures'])
                    
                    # Clear the batch
                    current_batch = []
                    
                    # Progress indicator
                    self.stdout.write(f'Processed {processed_count}/{total_alerts_found} alerts...')
            
            # Summary
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nMigration completed!\n'
                    f'Total alerts found: {total_alerts_found}\n'
                    f'Expert consultants created: {total_created}\n'
                    f'Alerts deleted: {total_alerts_deleted}\n'
                    f'Failed migrations: {total_failed}'
                )
            )
            
            if failed_migrations:
                self.stdout.write(self.style.ERROR('\nFailed migrations:'))
                for failure in failed_migrations:
                    self.stdout.write(
                        f"  Alert ID {failure['alert_id']}: {failure['error']}"
                    )
            
            if dry_run and total_created > 0:
                self.stdout.write(
                    self.style.WARNING(
                        '\nRun without --dry-run to apply these changes.'
                    )
                )
                
        except Exception as e:
            raise CommandError(f'Error during migration: {e}')

    def _process_batch(self, alerts, dry_run):
        """Process a batch of alerts and create ExpertConsultant entries"""
        results = {
            'created': 0,
            'failed': 0,
            'deleted': 0,
            'failures': []
        }
        
        for alert in alerts:
            try:
                # Validate that we have a URI in the text field
                if not alert.text or not alert.text.strip():
                    results['failed'] += 1
                    results['failures'].append({
                        'alert_id': alert.id,
                        'error': 'Alert has no URI text'
                    })
                    continue
                
                uri = alert.text.strip()
                
                # Check if this expert consultant already exists to avoid duplicates
                existing = ExpertConsultant.objects.filter(
                    connectivity_statement=alert.connectivity_statement,
                    uri=uri
                ).exists()
                
                if existing:
                    self.stdout.write(
                        self.style.WARNING(
                            f'ExpertConsultant already exists for CS {alert.connectivity_statement.id} '
                            f'with URI "{uri}". Skipping creation but will delete alert.'
                        )
                    )
                    # Delete the alert since the data is already in the new model
                    if not dry_run:
                        alert.delete()
                        results['deleted'] += 1
                    continue
                
                # Create the ExpertConsultant entry
                if not dry_run:
                    with transaction.atomic():
                        expert_consultant = ExpertConsultant.objects.create(
                            connectivity_statement=alert.connectivity_statement,
                            uri=uri
                        )
                        
                        self.stdout.write(
                            f'Created ExpertConsultant ID {expert_consultant.id} for '
                            f'CS {alert.connectivity_statement.id} with URI: {uri}'
                        )
                        
                        # Delete the alert only after successful creation
                        alert.delete()
                        
                        results['created'] += 1
                        results['deleted'] += 1
                else:
                    # In dry-run mode, just log what would happen
                    self.stdout.write(
                        f'Would create ExpertConsultant for CS {alert.connectivity_statement.id} '
                        f'with URI: {uri}'
                    )
                    results['created'] += 1
                    results['deleted'] += 1
                    
            except Exception as e:
                results['failed'] += 1
                results['failures'].append({
                    'alert_id': alert.id,
                    'error': str(e)
                })
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to migrate alert ID {alert.id}: {e}'
                    )
                )
        
        return results
