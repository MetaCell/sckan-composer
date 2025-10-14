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
    def test_state_transitions_with_population_file(self, mock_get_statements):
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

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_transition_error_handling_creates_note(self, mock_get_statements):
        """
        Test that when a statement with validation errors is ingested with population_uris,
        it transitions to INVALID and a note is created explaining the failure.
        
        This verifies the error handling path when validation errors prevent export.
        """
        from composer.models import Note
        
        self.flush_connectivity_statements()
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/liver/131'
        
        # Create a statement with validation errors
        validation_errors = ValidationErrors()
        validation_errors.entities.add("UBERON:9999999")  # Invalid entity
        
        mock_statement = {
            'id': statement_id,
            'label': 'neuron type liver 131',
            'pref_label': 'test connectivity statement with errors',
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
            'validation_errors': validation_errors,
            'statement_alerts': []
        }
        
        mock_statements = [mock_statement]
        mock_get_statements.return_value = mock_statements
        
        # Ingest with population_uris - statement should go to INVALID due to validation errors
        population_uris = {statement_id}
        ingest_statements(population_uris=population_uris)
        
        # Verify statement was created in INVALID state
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(
            statement.state,
            CSState.INVALID,
            "Statement with validation errors should be in INVALID state"
        )
        
        # Verify notes were created explaining the validation errors
        notes = Note.objects.filter(
            connectivity_statement=statement
        )
        
        self.assertGreater(
            notes.count(),
            0,
            "Notes should be created explaining validation errors"
        )
        
        # Check that at least one note mentions the validation issue
        note_texts = [note.note for note in notes]
        has_validation_note = any(
            "UBERON:9999999" in text or "Invalidated" in text 
            for text in note_texts
        )
        self.assertTrue(
            has_validation_note,
            "At least one note should mention the validation error or invalidation"
        )

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_statement_moves_to_invalid_when_export_fails_with_population_file(self, mock_get_statements):
        """
        Test that when a statement cannot transition to EXPORTED during ingestion with
        population_uris (e.g., due to failing FSM conditions like is_valid), 
        it transitions to INVALID state with a note explaining the failure.
        
        This scenario can occur when a statement has forward_connection validation issues.
        """
        from composer.models import Note
        
        self.flush_connectivity_statements()
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/liver/131'
        forward_conn_id = 'http://uri.interlex.org/composer/uris/set/liver/999'
        
        # Create two mock statements - the second one will be referenced by the first
        # but won't have matching anatomical entities, causing is_valid to fail
        mock_statements = [
            {
                'id': statement_id,
                'label': 'neuron type liver 131',
                'pref_label': 'test connectivity statement',
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
                'forward_connection': [forward_conn_id],  # References the second statement
                'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': []
            },
            {
                'id': forward_conn_id,
                'label': 'neuron type liver 999',
                'pref_label': 'forward connectivity statement',
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
        
        # Initial ingestion to create both statements
        ingest_statements(population_uris=None)
        
        # Verify both statements were created in EXPORTED state
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        forward_statement = ConnectivityStatement.objects.get(reference_uri=forward_conn_id)
        self.assertEqual(statement.state, CSState.EXPORTED)
        self.assertEqual(forward_statement.state, CSState.EXPORTED)
        
        # Change the first statement to TO_BE_REVIEWED state
        ConnectivityStatement.objects.filter(id=statement.id).update(
            state=CSState.TO_BE_REVIEWED
        )
        
        # Clear any existing notes from the first ingestion
        Note.objects.filter(connectivity_statement=statement).delete()
        
        # Re-ingest using population_uris (simulating population file ingestion)
        # The statement with forward_connection will fail is_valid condition
        # and should transition to INVALID
        population_uris = {statement_id}
        ingest_statements(population_uris=population_uris)
        
        # Verify the statement transitioned to INVALID
        result_stmt = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertEqual(
            result_stmt.state,
            CSState.INVALID,
            "Statement should transition to INVALID when export fails due to is_valid condition"
        )
        
        # Verify notes were created
        notes = Note.objects.filter(
            connectivity_statement=result_stmt,
            note__icontains="Could not transition to EXPORTED"
        )
        
        self.assertGreater(
            notes.count(),
            0,
            "A note should be created explaining the transition failure"
        )
        
        # Also check for invalidation note
        invalidated_notes = Note.objects.filter(
            connectivity_statement=result_stmt,
            note__icontains="Invalidated"
        )
        
        self.assertGreater(
            invalidated_notes.count(),
            0,
            "An 'Invalidated' note should be created when statement moves to INVALID"
        )


class TestDynamicRelationships(TestCase):
    """Test custom ingestion code for dynamic relationships"""
    
    def flush_connectivity_statements(self):
        ConnectivityStatement.objects.all().delete()
    
    def create_mock_neuron(self):
        """Create a simple mock neuron object with core_graph"""
        from unittest.mock import MagicMock
        from rdflib import Graph, Namespace, URIRef, Literal
        
        # Create a mock neuron with core_graph
        neuron = MagicMock()
        neuron.identifier = URIRef('http://uri.interlex.org/composer/neuron/123')
        neuron.id_ = 'http://uri.interlex.org/composer/neuron/123'
        
        # Create a simple RDF graph with some test data
        graph = Graph()
        ilxtr = Namespace('http://uri.interlex.org/tgbugs/uris/readable/')
        
        # Add some test triples
        neuron_uri = URIRef(str(neuron.identifier))
        graph.add((neuron_uri, ilxtr.hasCustomProperty, Literal('test_value')))
        graph.add((neuron_uri, ilxtr.hasCustomProperty, Literal('another_value')))
        
        neuron.core_graph = graph
        
        return neuron
    
    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_triple_relationship_with_custom_code(self, mock_get_statements):
        """Test TRIPLE relationship type with custom ingestion code"""
        from composer.models import Relationship, Triple, ConnectivityStatementTriple
        from composer.enums import RelationshipType
        
        self.flush_connectivity_statements()
        
        # Create a relationship with custom code that returns triples
        relationship = Relationship.objects.create(
            title="Custom Triple Relationship",
            predicate_name="hasCustomTriple",
            predicate_uri="http://uri.interlex.org/test/hasCustomTriple",
            type=RelationshipType.TRIPLE_MULTI,
            order=1,
            custom_ingestion_code="""
# Simple example that creates triples from fc data
result = [
    {'name': 'Triple 1', 'uri': 'http://uri.interlex.org/test/triple1'},
    {'name': 'Triple 2', 'uri': 'http://uri.interlex.org/test/triple2'}
]
"""
        )
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/test/1'
        
        # Create mock neuron
        mock_neuron = self.create_mock_neuron()
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'test neuron type',
                'pref_label': 'test connectivity statement',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'test',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/test'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': [],
                '_neuron': mock_neuron,
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Run ingestion
        ingest_statements()
        
        # Verify statement was created
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertIsNotNone(statement)
        
        # Verify triples were created
        self.assertEqual(Triple.objects.filter(relationship=relationship).count(), 2)
        
        # Verify ConnectivityStatementTriple was created and linked
        cs_triple = ConnectivityStatementTriple.objects.get(
            connectivity_statement=statement,
            relationship=relationship
        )
        self.assertEqual(cs_triple.triples.count(), 2)
        
        # Verify triple content
        triple_names = set(cs_triple.triples.values_list('name', flat=True))
        self.assertEqual(triple_names, {'Triple 1', 'Triple 2'})
    
    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_text_relationship_with_custom_code(self, mock_get_statements):
        """Test TEXT relationship type with custom ingestion code"""
        from composer.models import Relationship, ConnectivityStatementText
        from composer.enums import RelationshipType
        
        self.flush_connectivity_statements()
        
        # Create a relationship with custom code that returns text
        relationship = Relationship.objects.create(
            title="Custom Text Relationship",
            predicate_name="hasCustomText",
            predicate_uri="http://uri.interlex.org/test/hasCustomText",
            type=RelationshipType.TEXT,
            order=1,
            custom_ingestion_code="""
# Example that uses fc dict to generate text
result = f"Neuron ID: {fc['id']}, Label: {fc['label']}"
"""
        )
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/test/2'
        
        # Create mock neuron
        mock_neuron = self.create_mock_neuron()
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'test neuron label',
                'pref_label': 'test connectivity statement',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'test',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/test'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': [],
                '_neuron': mock_neuron,
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Run ingestion
        ingest_statements()
        
        # Verify statement was created
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertIsNotNone(statement)
        
        # Verify text relationship was created
        cs_text = ConnectivityStatementText.objects.get(
            connectivity_statement=statement,
            relationship=relationship
        )
        
        # Verify text content includes data from fc dict
        self.assertIn('test neuron label', cs_text.text)
        self.assertIn(statement_id, cs_text.text)
    
    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_anatomical_relationship_with_custom_code(self, mock_get_statements):
        """Test ANATOMICAL_ENTITY relationship type with custom ingestion code"""
        from composer.models import Relationship, AnatomicalEntity, AnatomicalEntityMeta, ConnectivityStatementAnatomicalEntity
        from composer.enums import RelationshipType
        
        self.flush_connectivity_statements()
        
        # Create some anatomical entities to reference
        meta1 = AnatomicalEntityMeta.objects.create(
            name="Test Entity 1",
            ontology_uri='http://purl.obolibrary.org/obo/UBERON_0001234'
        )
        ae1 = AnatomicalEntity.objects.create(
            simple_entity=meta1
        )
        meta2 = AnatomicalEntityMeta.objects.create(
            name="Test Entity 2",
            ontology_uri='http://purl.obolibrary.org/obo/UBERON_0005678'
        )
        ae2 = AnatomicalEntity.objects.create(
            simple_entity=meta2
        )
        
        # Create a relationship with custom code that returns anatomical entity URIs
        relationship = Relationship.objects.create(
            title="Custom Anatomical Relationship",
            predicate_name="hasCustomAnatomy",
            predicate_uri="http://uri.interlex.org/test/hasCustomAnatomy",
            type=RelationshipType.ANATOMICAL_MULTI,
            order=1,
            custom_ingestion_code="""
# Example that returns anatomical entity URIs
result = [
    'http://purl.obolibrary.org/obo/UBERON_0001234',
    'http://purl.obolibrary.org/obo/UBERON_0005678'
]
"""
        )
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/test/3'
        
        # Create mock neuron
        mock_neuron = self.create_mock_neuron()
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'test neuron type',
                'pref_label': 'test connectivity statement',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'test',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/test'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': [],
                '_neuron': mock_neuron,
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Run ingestion
        ingest_statements()
        
        # Verify statement was created
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertIsNotNone(statement)
        
        # Verify anatomical relationship was created
        cs_ae = ConnectivityStatementAnatomicalEntity.objects.get(
            connectivity_statement=statement,
            relationship=relationship
        )
        
        # Verify anatomical entities were linked
        self.assertEqual(cs_ae.anatomical_entities.count(), 2)
        linked_entities = set(cs_ae.anatomical_entities.values_list('simple_entity__ontology_uri', flat=True))
        self.assertEqual(linked_entities, {
            'http://purl.obolibrary.org/obo/UBERON_0001234',
            'http://purl.obolibrary.org/obo/UBERON_0005678'
        })
    
    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_custom_code_with_neuron_access(self, mock_get_statements):
        """Test that custom code can access the _neuron object from fc dict"""
        from composer.models import Relationship, ConnectivityStatementText
        from composer.enums import RelationshipType
        
        self.flush_connectivity_statements()
        
        # Create a relationship with custom code that accesses the neuron object
        relationship = Relationship.objects.create(
            title="Neuron Access Relationship",
            predicate_name="hasNeuronData",
            predicate_uri="http://uri.interlex.org/test/hasNeuronData",
            type=RelationshipType.TEXT,
            order=1,
            custom_ingestion_code="""
# Example that accesses the neuron object
neuron = fc['_neuron']
# Access neuron properties
result = f"Neuron ID: {neuron.identifier}, Has core_graph: {hasattr(neuron, 'core_graph')}"
"""
        )
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/test/4'
        
        # Create mock neuron with RDF data
        mock_neuron = self.create_mock_neuron()
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'test neuron type',
                'pref_label': 'test connectivity statement',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'test',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/test'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': [],
                '_neuron': mock_neuron,
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Run ingestion
        ingest_statements()
        
        # Verify statement was created
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertIsNotNone(statement)
        
        # Verify text relationship was created with neuron data
        cs_text = ConnectivityStatementText.objects.get(
            connectivity_statement=statement,
            relationship=relationship
        )
        
        # Verify the custom code accessed the neuron object
        self.assertIn('Neuron ID:', cs_text.text)
        self.assertIn('Has core_graph: True', cs_text.text)
    
    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_custom_code_error_handling(self, mock_get_statements):
        """Test that errors in custom code are logged and don't break ingestion"""
        from composer.models import Relationship
        from composer.enums import RelationshipType
        
        self.flush_connectivity_statements()
        
        # Create a relationship with custom code that will raise an error
        relationship = Relationship.objects.create(
            title="Error Relationship",
            predicate_name="hasError",
            predicate_uri="http://uri.interlex.org/test/hasError",
            type=RelationshipType.TEXT,
            order=1,
            custom_ingestion_code="""
# This code will raise an error
raise ValueError("Test error in custom code")
result = "This won't be reached"
"""
        )
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/test/5'
        
        # Create mock neuron
        mock_neuron = self.create_mock_neuron()
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'test neuron type',
                'pref_label': 'test connectivity statement',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'test',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/test'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': [],
                '_neuron': mock_neuron,
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Run ingestion - should not crash despite error in custom code
        ingest_statements()
        
        # Verify statement was still created
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertIsNotNone(statement)
        
        # The relationship should not be created due to error
        from composer.models import ConnectivityStatementText
        cs_texts = ConnectivityStatementText.objects.filter(
            connectivity_statement=statement,
            relationship=relationship
        )
        self.assertEqual(cs_texts.count(), 0, "No text relationship should be created when custom code fails")
    
    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_custom_code_missing_result_variable(self, mock_get_statements):
        """Test that custom code without 'result' variable is handled gracefully"""
        from composer.models import Relationship, ConnectivityStatementText
        from composer.enums import RelationshipType
        
        self.flush_connectivity_statements()
        
        # Create a relationship with custom code that doesn't define 'result'
        relationship = Relationship.objects.create(
            title="Missing Result Relationship",
            predicate_name="hasMissingResult",
            predicate_uri="http://uri.interlex.org/test/hasMissingResult",
            type=RelationshipType.TEXT,
            order=1,
            custom_ingestion_code="""
# This code doesn't define 'result' variable
some_value = "This is not named 'result'"
"""
        )
        
        statement_id = 'http://uri.interlex.org/composer/uris/set/test/6'
        
        # Create mock neuron
        mock_neuron = self.create_mock_neuron()
        
        mock_statements = [
            {
                'id': statement_id,
                'label': 'test neuron type',
                'pref_label': 'test connectivity statement',
                'origins': NeuronDMOrigin(set()),
                'destinations': [NeuronDMDestination(set(), set(), 'AXON-T')],
                'populationset': 'test',
                'vias': [],
                'species': [],
                'sex': [],
                'circuit_type': [],
                'circuit_role': [],
                'phenotype': [],
                'other_phenotypes': [],
                'forward_connection': [],
                'provenance': ['http://dx.doi.org/10.1126/test'],
                'sentence_number': [],
                'note_alert': [],
                'validation_errors': ValidationErrors(),
                'statement_alerts': [],
                '_neuron': mock_neuron,
            }
        ]
        mock_get_statements.return_value = mock_statements
        
        # Run ingestion
        ingest_statements()
        
        # Verify statement was created
        statement = ConnectivityStatement.objects.get(reference_uri=statement_id)
        self.assertIsNotNone(statement)
        
        # The relationship should not be created due to missing 'result'
        cs_texts = ConnectivityStatementText.objects.filter(
            connectivity_statement=statement,
            relationship=relationship
        )
        self.assertEqual(cs_texts.count(), 0, "No text relationship should be created when 'result' is not defined")


