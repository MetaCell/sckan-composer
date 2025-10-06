from unittest.mock import patch
from composer.services.cs_ingestion.cs_ingestion_services import ingest_statements
from composer.models import ConnectivityStatement
from composer.services.cs_ingestion.neurondm_script import log_error
from composer.services.cs_ingestion.models import NeuronDMOrigin, NeuronDMDestination, NeuronDMVia, ValidationErrors
from composer.enums import CSState
from django.db.models import Q
from django.test import TestCase


class TestIngestStatements(TestCase):
    def flush_connectivity_statements(self):
        ConnectivityStatement.objects.all().delete()

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_overwrite_functionality(self, mock_get_statements):
        """Test that statements with URIs in population_uris list are overwritten regardless of status"""
        self.flush_connectivity_statements()
        
        # Mock data for two statements
        statement_id_1 = 'http://uri.interlex.org/composer/uris/set/liver/131'
        statement_id_2 = 'http://uri.interlex.org/composer/uris/set/heart/42'
        
        mock_statements = [
            {
                'id': statement_id_1,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement for liver 131',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'liver',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            },
            {
                'id': statement_id_2,
                'label': 'neuron type heart 42',
                'pref_label': 'test connectivity statement for heart 42',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'heart',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Initial ingestion
        ingest_statements()
        
        # Verify statements were created
        self.assertEqual(ConnectivityStatement.objects.count(), 2)
        
        # Get the created statements and change their states to non-overwritable
        statement_1 = ConnectivityStatement.objects.get(reference_uri=statement_id_1)
        statement_2 = ConnectivityStatement.objects.get(reference_uri=statement_id_2)
        
        # Change to a state that normally wouldn't be overwritable using update() to bypass FSM
        ConnectivityStatement.objects.filter(id=statement_1.id).update(
            state=CSState.NPO_APPROVED,
            knowledge_statement="Original knowledge statement 1"
        )
        
        ConnectivityStatement.objects.filter(id=statement_2.id).update(
            state=CSState.NPO_APPROVED,
            knowledge_statement="Original knowledge statement 2"
        )
        
        # Update mock data with new knowledge statements
        mock_statements[0]['pref_label'] = "Updated knowledge statement 1"
        mock_statements[1]['pref_label'] = "Updated knowledge statement 2"
        
        # Test: Only statement_1 should be updated when using population_uris
        population_uris = {statement_id_1}
        ingest_statements(population_uris=population_uris)
        
        # Verify results
        updated_statement_1 = ConnectivityStatement.objects.get(reference_uri=statement_id_1)
        updated_statement_2 = ConnectivityStatement.objects.get(reference_uri=statement_id_2)
        
        # Statement 1 should be updated because it was in population_uris
        self.assertEqual(updated_statement_1.knowledge_statement, "Updated knowledge statement 1")
        
        # Statement 2 should NOT be updated because it wasn't in population_uris and has non-overwritable state (NPO_APPROVED)
        self.assertEqual(updated_statement_2.knowledge_statement, "Original knowledge statement 2")

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_with_disable_overwrite_true(self, mock_get_statements):
        """Test that disable_overwrite=True prevents all overwrites, even for population_uris"""
        self.flush_connectivity_statements()
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/liver/131'
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement for liver 131',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'liver',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Initial ingestion
        ingest_statements()
        
        # Verify statement was created
        self.assertEqual(ConnectivityStatement.objects.count(), 1)
        
        # Get the created statement and modify it
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        original_knowledge = "Original knowledge statement"
        statement.knowledge_statement = original_knowledge
        statement.save()
        
        # Update mock data
        mock_statements[0]['pref_label'] = "Updated knowledge statement"
        
        # Test: Even with population_uris, disable_overwrite=True should prevent updates
        population_uris = {statement_id}
        ingest_statements(disable_overwrite=True, population_uris=population_uris)
        
        # Verify the statement was NOT updated
        unchanged_statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(unchanged_statement.knowledge_statement, original_knowledge)

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_empty_set_filters_all(self, mock_get_statements):
        """Test that empty population_uris set filters out all statements"""
        self.flush_connectivity_statements()
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/liver/131'
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement for liver 131',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'liver',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Test with empty population_uris set (should filter everything)
        ingest_statements(population_uris=set())
        
        # Verify no statements were created (empty set = empty filter)
        self.assertEqual(ConnectivityStatement.objects.count(), 0)

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_none_parameter(self, mock_get_statements):
        """Test that population_uris=None works normally"""
        self.flush_connectivity_statements()
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/liver/131'
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement for liver 131',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'liver',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Test with None population_uris (default behavior)
        ingest_statements(population_uris=None)
        
        # Verify statement was created
        self.assertEqual(ConnectivityStatement.objects.count(), 1)
        
        # Verify the statement exists with correct data
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(statement.reference_uri, statement_id)

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_filtering_behavior(self, mock_get_statements):
        """Test that when population_uris is provided, only statements in the set are processed"""
        self.flush_connectivity_statements()
        
        # Mock data for three statements
        statement_id_1 = 'http://uri.interlex.org/composer/uris/set/liver/131'
        statement_id_2 = 'http://uri.interlex.org/composer/uris/set/heart/42'
        statement_id_3 = 'http://uri.interlex.org/composer/uris/set/brain/256'
        
        mock_statements = [
            {
                'id': statement_id_1,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement for liver 131',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'liver',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            },
            {
                'id': statement_id_2,
                'label': 'neuron type heart 42',
                'pref_label': 'test connectivity statement for heart 42',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'heart',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            },
            {
                'id': statement_id_3,
                'label': 'neuron type brain 256',
                'pref_label': 'test connectivity statement for brain 256',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'brain',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Test: Only statements in population_uris should be processed
        population_uris = {statement_id_1, statement_id_3}  # Only liver and brain, not heart
        ingest_statements(population_uris=population_uris)
        
        # Verify only 2 statements were created (liver and brain, but not heart)
        self.assertEqual(ConnectivityStatement.objects.count(), 2)
        
        # Verify the correct statements exist
        self.assertTrue(ConnectivityStatement.objects.filter(reference_uri=statement_id_1).exists())
        self.assertFalse(ConnectivityStatement.objects.filter(reference_uri=statement_id_2).exists())  # heart should not exist
        self.assertTrue(ConnectivityStatement.objects.filter(reference_uri=statement_id_3).exists())

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_none_processes_all(self, mock_get_statements):
        """Test that when population_uris is None, all statements are processed (normal behavior)"""
        self.flush_connectivity_statements()
        
        # Mock data for two statements
        statement_id_1 = 'http://uri.interlex.org/composer/uris/set/liver/131'
        statement_id_2 = 'http://uri.interlex.org/composer/uris/set/heart/42'
        
        mock_statements = [
            {
                'id': statement_id_1,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement for liver 131',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'liver',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            },
            {
                'id': statement_id_2,
                'label': 'neuron type heart 42',
                'pref_label': 'test connectivity statement for heart 42',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'heart',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Test: None population_uris should process all statements
        ingest_statements(population_uris=None)
        
        # Verify both statements were created
        self.assertEqual(ConnectivityStatement.objects.count(), 2)
        self.assertTrue(ConnectivityStatement.objects.filter(reference_uri=statement_id_1).exists())
        self.assertTrue(ConnectivityStatement.objects.filter(reference_uri=statement_id_2).exists())

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_none_vs_empty_set_behavior(self, mock_get_statements):
        """Test that None (no population file) and empty set (empty population file) behave differently"""
        self.flush_connectivity_statements()
        
        # Mock data for two statements
        statement_id_1 = 'http://uri.interlex.org/composer/uris/set/liver/131'
        statement_id_2 = 'http://uri.interlex.org/composer/uris/set/heart/42'
        
        mock_statements = [
            {
                'id': statement_id_1,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement for liver 131',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'liver',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            },
            {
                'id': statement_id_2,
                'label': 'neuron type heart 42',
                'pref_label': 'test connectivity statement for heart 42',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'heart',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Test 1: None means no population file was provided - process all statements
        ingest_statements(population_uris=None)
        self.assertEqual(ConnectivityStatement.objects.count(), 2, "None should process all statements")
        
        self.flush_connectivity_statements()
        
        # Test 2: Empty set means population file was provided but empty - process no statements  
        ingest_statements(population_uris=set())
        self.assertEqual(ConnectivityStatement.objects.count(), 0, "Empty set should process no statements")

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_state_transitions_skipped_with_population_file(self, mock_get_statements):
        """
        Test that statements can transition from any state to EXPORTED or INVALID during ingestion
        with population_uris (i.e., when using a population file).
        
        When population_uris is provided and disable_overwrite is False, statements in the population
        file can be overwritten and transitioned from any state (e.g., TO_BE_REVIEWED) to EXPORTED
        or INVALID based on validation results.
        """
        self.flush_connectivity_statements()
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/liver/131'
        
        # Create mock statement data with empty anatomical entities and species to avoid validation errors
        mock_statement = {
            'id': statement_id,
            'label': 'neuron type liver 131',
            'pref_label': 'test connectivity statement for liver 131',
            'origins': NeuronDMOrigin(set()),  # Empty set to avoid validation errors
            'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],  # Empty anatomical entities
            'populationset': 'liver',
            'vias': [],  # Empty to avoid validation errors
            'species': [],  # Empty to avoid validation errors
            'sex': [],
            'circuit_type': [],
            'circuit_role': [],
            'phenotype': [],
            'other_phenotypes': [],
            'forward_connection': [],  # Empty to avoid validation errors
            'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
            'sentence_number': [],
            'note_alert': [],
            'validation_errors': ValidationErrors(),
            'statement_alerts': []
        }
        
        mock_statements = [mock_statement]
        mock_get_statements.return_value = mock_statements
        
        # Initial ingestion without population_uris - should create statement in EXPORTED state
        ingest_statements(population_uris=None)
        
        # Verify statement was created in EXPORTED state
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        initial_state = statement.state
        self.assertEqual(initial_state, CSState.EXPORTED, "Statement should be in EXPORTED state initially")
        
        # Change the state to TO_BE_REVIEWED using update() to bypass FSM
        # This simulates a statement that was manually reviewed and is now awaiting approval
        ConnectivityStatement.objects.filter(id=statement.id).update(
            state=CSState.TO_BE_REVIEWED
        )
        
        # Re-fetch to verify state change
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(statement.state, CSState.TO_BE_REVIEWED, "Statement should be in TO_BE_REVIEWED state")
        
        # Update mock data with modified content
        mock_statements[0]['pref_label'] = "Updated knowledge statement for testing"
        
        # Test 1: Ingest with population_uris (simulating population file usage)
        # State should transition from TO_BE_REVIEWED to EXPORTED using system_exported transition
        population_uris = {statement_id}
        ingest_statements(population_uris=population_uris)
        
        # Verify state was transitioned to EXPORTED (using system_exported transition)
        updated_statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(
            updated_statement.state, 
            CSState.EXPORTED, 
            "State should transition to EXPORTED when population_uris is provided (using system_exported transition)"
        )
        
        # Verify the content was updated
        self.assertEqual(
            updated_statement.knowledge_statement,
            "Updated knowledge statement for testing",
            "Knowledge statement should be updated when using population file"
        )
        
        # Test 2: Test transition to INVALID with population file when validation errors exist
        # Add validation errors to the mock data
        validation_errors_with_errors = ValidationErrors()
        validation_errors_with_errors.entities.add("UBERON:9999999")
        mock_statements[0]['validation_errors'] = validation_errors_with_errors
        mock_statements[0]['pref_label'] = "Statement with validation errors"
        
        # Change state back to TO_BE_REVIEWED
        ConnectivityStatement.objects.filter(id=statement.id).update(
            state=CSState.TO_BE_REVIEWED
        )
        
        # Ingest with population_uris and validation errors
        ingest_statements(population_uris=population_uris)
        
        # Verify state transitioned to INVALID due to validation errors
        invalid_statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(
            invalid_statement.state,
            CSState.INVALID,
            "State should transition to INVALID when validation errors exist, even from TO_BE_REVIEWED state"
        )
        
        # Test 3: Verify normal ingestion (without population_uris) also works correctly
        # Remove validation errors
        mock_statements[0]['validation_errors'] = ValidationErrors()
        mock_statements[0]['pref_label'] = "Another update for normal ingestion"
        
        # Normal ingestion should also transition to EXPORTED
        ingest_statements(population_uris=None)
        
        # Verify state was transitioned to EXPORTED in normal ingestion
        final_statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(
            final_statement.state,
            CSState.EXPORTED,
            "State should transition to EXPORTED in normal ingestion (without population_uris)"
        )
        
        # Verify the content was updated
        self.assertEqual(
            final_statement.knowledge_statement,
            "Another update for normal ingestion",
            "Knowledge statement should be updated in normal ingestion"
        )

