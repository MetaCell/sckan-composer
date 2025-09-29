from unittest.mock import patch
from composer.services.cs_ingestion.cs_ingestion_services import ingest_statements
from composer.models import ConnectivityStatement
from composer.services.cs_ingestion.neurondm_script import log_error
from composer.services.cs_ingestion.models import NeuronDMOrigin, NeuronDMDestination, NeuronDMVia, ValidationErrors
from composer.enums import CSState
from django.db.models import Q
from django.test import TestCase


class TestIngestStatements(TestCase):
    """
    NOTE:
    This test depends on the directory system of the Scicrunch neurondm - here - https://raw.githubusercontent.com/SciCrunch/NIF-Ontology/neurons/**/*.ttl
    Check more details in neurondm_script.py
    """

    def flush_connectivity_statements(self):
        ConnectivityStatement.objects.all().delete()

    def create_mock_statement_data(self, statement_id, population_set='liver', label_suffix='131'):
        """Helper method to create mock statement data"""
        return {
            'id': statement_id,
            'label': f'neuron type {population_set} {label_suffix}',
            'pref_label': f'test connectivity statement for {population_set} {label_suffix}',
            'origins': NeuronDMOrigin({'http://purl.obolibrary.org/obo/UBERON_0001234'}),
            'destinations': [NeuronDMDestination({'http://purl.obolibrary.org/obo/UBERON_0005678'}, set(), 'AXON-T')],
            'populationset': population_set,
            'vias': [NeuronDMVia({'http://purl.obolibrary.org/obo/UBERON_0009012'}, set(), 0, 'AXON')],
            'species': ['http://purl.obolibrary.org/obo/NCBITaxon_10090'],
            'sex': [],
            'circuit_type': [],
            'circuit_role': [],
            'phenotype': ['http://uri.interlex.org/tgbugs/uris/readable/neuron-phenotype-sym-post'],
            'other_phenotypes': [],
            'forward_connection': ['http://uri.interlex.org/base/ilx_0795017'],
            'provenance': ['http://dx.doi.org/10.1126/sciadv.abg5733'],
            'sentence_number': [],
            'note_alert': [],
            'validation_errors': ValidationErrors(),
            'statement_alerts': []
        }

    def test_ingestion_with_invalid_imports(self):
        self.flush_connectivity_statements()
        self.assertEqual(ConnectivityStatement.objects.count(), 0)
        ingest_statements(full_imports=['full'], label_imports=['label'])
        self.assertEqual(ConnectivityStatement.objects.count(), 0)

    def test_ingestion_with_valid_label_and_invalid_full_imports(self):
        ingest_statements(
            full_imports=['full'],
            label_imports=['apinatomy-neuron-populations']
        )
        self.assertEqual(ConnectivityStatement.objects.count(), 0)
        self.flush_connectivity_statements()

    def test_ingestion_with_valid_full_and_invalid_label_imports(self):
        ingest_statements(full_imports=['sparc-nlp'], label_imports=['label'])
        self.assertNotEqual(ConnectivityStatement.objects.count(), 0)
        self.flush_connectivity_statements()

    def test_ingestion_with_valid_imports(self):
        ingest_statements(
            full_imports=['sparc-nlp'],
            label_imports=['apinatomy-neuron-populations']
        )
        self.assertNotEqual(ConnectivityStatement.objects.count(), 0)
        self.flush_connectivity_statements()

    def test_ingestion_without_passing_full_imports(self):
        # don't pass the full import and it will still work - by utilizing the defaults
        self.flush_connectivity_statements()
        ingest_statements(label_imports=['apinatomy-neuron-populations'])
        self.assertNotEqual(ConnectivityStatement.objects.count(), 0)

    def test_ingestion_without_passing_label_imports(self):
        # don't pass the label import and it will still work - by utilizing the defaults
        self.flush_connectivity_statements()
        ingest_statements(full_imports=['sparc-nlp'])
        self.assertNotEqual(ConnectivityStatement.objects.count(), 0)

    def test_disable_overwrite_for_statements(self):
        self.flush_connectivity_statements()
        ingest_statements(full_imports=['sparc-nlp'])

        NEW_KNOWLEDGE_STATEMENT = "This is a new knowledge statement"

        # Edit the statement that is in EXPORTED or in INVALID state to check if that is overwritten
        # Other states are not overwritable anyway
        statement_to_edit = ConnectivityStatement.objects.filter(
            Q(state=CSState.EXPORTED) | Q(state=CSState.INVALID)).first()

        if not statement_to_edit:
            log_error(
                "No statement found in EXPORTED or INVALID state to test disable_overwrite")
            return

        statement_to_edit.knowledge_statement = NEW_KNOWLEDGE_STATEMENT
        statement_to_edit.save()

        # The Knowledge statement will be new updated statement, if the disable_overwrite flag is enabled
        ingest_statements(disable_overwrite=True)
        statement_after_edit = ConnectivityStatement.objects.get(
            id=statement_to_edit.id)
        self.assertEqual(
            statement_after_edit.knowledge_statement,
            NEW_KNOWLEDGE_STATEMENT
        )

        # The Knowledge statement will be the old statement (from neurondm after ingestion), if the disable_overwrite flag is disabled
        ingest_statements()
        statement_after_edit = ConnectivityStatement.objects.get(
            id=statement_to_edit.id)
        self.assertNotEqual(
            statement_after_edit.knowledge_statement,
            NEW_KNOWLEDGE_STATEMENT
        )

    @patch('composer.services.cs_ingestion.cs_ingestion_services.get_statements_from_neurondm')
    def test_population_uris_overwrite_functionality(self, mock_get_statements):
        """Test that statements with URIs in population_uris list are overwritten regardless of status"""
        self.flush_connectivity_statements()
        
        # Mock data for two statements
        statement_id_1 = 'http://uri.interlex.org/composer/uris/set/liver/131'
        statement_id_2 = 'http://uri.interlex.org/composer/uris/set/heart/42'
        
        mock_statements = [
            self.create_mock_statement_data(statement_id_1, 'liver', '131'),
            self.create_mock_statement_data(statement_id_2, 'heart', '42')
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
            self.create_mock_statement_data(statement_id, 'liver', '131')
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
            self.create_mock_statement_data(statement_id, 'liver', '131')
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
            self.create_mock_statement_data(statement_id, 'liver', '131')
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
            self.create_mock_statement_data(statement_id_1, 'liver', '131'),
            self.create_mock_statement_data(statement_id_2, 'heart', '42'),
            self.create_mock_statement_data(statement_id_3, 'brain', '256')
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
            self.create_mock_statement_data(statement_id_1, 'liver', '131'),
            self.create_mock_statement_data(statement_id_2, 'heart', '42')
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
            self.create_mock_statement_data(statement_id_1, 'liver', '131'),
            self.create_mock_statement_data(statement_id_2, 'heart', '42')
        ]
        mock_get_statements.return_value = mock_statements
        
        # Test 1: None means no population file was provided - process all statements
        ingest_statements(population_uris=None)
        self.assertEqual(ConnectivityStatement.objects.count(), 2, "None should process all statements")
        
        self.flush_connectivity_statements()
        
        # Test 2: Empty set means population file was provided but empty - process no statements  
        ingest_statements(population_uris=set())
        self.assertEqual(ConnectivityStatement.objects.count(), 0, "Empty set should process no statements")
