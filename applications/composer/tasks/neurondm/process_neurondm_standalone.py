#!/usr/bin/env python3
"""
Standalone script to run neurondm processing without Django.
This script is designed to run in the composer-neurondm task container.
"""
import os
import sys
import json
import argparse
import logging

sys.path.insert(0, '/usr/src/app')
from composer.services.cs_ingestion.neurondm_script import main as get_statements_from_neurondm
from composer.services.cs_ingestion.logging_service import LoggerService
from composer.services.cs_ingestion.models import convert_statement_to_json_serializable

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description='Process NeuroDM neurons and save to file'
    )
    parser.add_argument(
        '--output_file',
        type=str,
        required=True,
        help='Path to output JSON file'
    )
    parser.add_argument(
        '--full_imports',
        nargs='*',
        default=[],
        help='List of full imports'
    )
    parser.add_argument(
        '--label_imports',
        nargs='*',
        default=[],
        help='List of label imports'
    )
    parser.add_argument(
        '--population_file',
        type=str,
        help='Path to population URIs file'
    )
    parser.add_argument(
        '--composer_data',
        type=str,
        required=True,
        help='Path to composer data JSON file (custom relationships and alert URIs)'
    )
    parser.add_argument(
        '--anomalies_log',
        type=str,
        help='Path to anomalies log JSON file (will be created/appended to)'
    )
    
    args = parser.parse_args()
    
    # Read population URIs if provided
    population_uris = None
    if args.population_file:
        try:
            with open(args.population_file, 'r', encoding='utf-8') as f:
                population_uris = set(line.strip() for line in f if line.strip())
            logger.info(f"Loaded {len(population_uris)} population URIs from {args.population_file}")
        except Exception as e:
            logger.error(f"Error reading population file: {e}")
            sys.exit(1)
    
    # Read composer data (custom relationships and alert URIs)
    try:
        with open(args.composer_data, 'r', encoding='utf-8') as f:
            composer_data = json.load(f)
        
        custom_relationships = composer_data.get('custom_relationships', [])
        statement_alert_uris = set(composer_data.get('statement_alert_uris', []))
        
        logger.info(
            f"Loaded {len(custom_relationships)} custom relationships and "
            f"{len(statement_alert_uris)} alert URIs from {args.composer_data}"
        )
    except Exception as e:
        logger.error(f"Error reading composer data file: {e}")
        sys.exit(1)
    
    # Initialize logger service with output path if anomalies_log provided
    if args.anomalies_log:
        logger_service = LoggerService(ingestion_anomalies_log_path=args.anomalies_log)
    else:
        logger_service = LoggerService()
    
    try:
        logger.info("Starting NeuroDM processing...")
        
        # Call neurondm_script directly
        statements_list = get_statements_from_neurondm(
            full_imports=args.full_imports,
            label_imports=args.label_imports,
            logger_service_param=logger_service,
            statement_alert_uris=statement_alert_uris,
            population_uris=population_uris,
            custom_relationships=custom_relationships,
        )
        
        logger.info(f"Processed {len(statements_list)} statements")
        
        # Convert statements to JSON-serializable format
        logger.info("Converting statements to JSON-serializable format...")
        json_statements = [convert_statement_to_json_serializable(stmt) for stmt in statements_list]
        
        # Save to JSON file
        with open(args.output_file, 'w', encoding='utf-8') as f:
            json.dump(json_statements, f, indent=2)
        
        logger.info(f"Successfully saved statements to {args.output_file}")
        

        logger_service.write_anomalies_to_file()
        logger.info(f"Saved {len(logger_service.anomalies)} anomalies to {logger_service.ingestion_anomalies_log_path}")
        
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"Processing failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
