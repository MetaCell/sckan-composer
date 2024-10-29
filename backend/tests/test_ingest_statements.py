from composer.services.cs_ingestion.cs_ingestion_services import ingest_statements
from composer.models import ConnectivityStatement
import unittest
from composer.services.cs_ingestion.neurondm_script import log_error
from composer.enums import CSState
from django.db.models import Q


class TestIngestStatements(unittest.TestCase):
    """
    NOTE:
    This test depends on the directory system of the Scicrunch neurondm - here - https://raw.githubusercontent.com/SciCrunch/NIF-Ontology/neurons/**/*.ttl
    Check more details in neurondm_script.py
    """

    def flush_connectivity_statements(self):
        ConnectivityStatement.objects.all().delete()

    def test_full_and_label_import(self):
        self.flush_connectivity_statements()

        # Check for invalid full and label imports
        self.assertEqual(ConnectivityStatement.objects.count(), 0)
        ingest_statements(full_imports=['full'], label_imports=['label'])
        self.assertEqual(ConnectivityStatement.objects.count(), 0)

        # check for invalid full imports and valid label imports
        ingest_statements(
            full_imports=['full'],
            label_imports=['apinatomy-neuron-populations']
        )
        self.assertEqual(ConnectivityStatement.objects.count(), 0)

        # Check for valid full imports and invalid label imports
        ingest_statements(full_imports=['sparc-nlp'], label_imports=['label'])
        self.assertNotEqual(ConnectivityStatement.objects.count(), 0)

        self.flush_connectivity_statements()

        # check for both valid full and label imports
        ingest_statements(
            full_imports=['sparc-nlp'],
            label_imports=['apinatomy-neuron-populations']
        )
        self.assertNotEqual(ConnectivityStatement.objects.count(), 0)

        # don't pass the full import and it will still work
        self.flush_connectivity_statements()
        ingest_statements(label_imports=['apinatomy-neuron-populations'])

        # don't pass the label import and it will still work
        self.flush_connectivity_statements()
        ingest_statements(full_imports=['sparc-nlp'])

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

        # The Knowledge statement will be the old statement (from neurodm after ingestion), if the disable_overwrite flag is disabled
        ingest_statements()
        statement_after_edit = ConnectivityStatement.objects.get(
            id=statement_to_edit.id)
        self.assertNotEqual(
            statement_after_edit.knowledge_statement,
            NEW_KNOWLEDGE_STATEMENT
        )
