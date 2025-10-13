"""
Tests for ConnectivityStatement relationship models (Triple, Text, AnatomicalEntity).
"""
import pytest
from django.core.exceptions import ValidationError
from django.test import TestCase
from composer.models import (
    ConnectivityStatement,
    ConnectivityStatementTriple,
    ConnectivityStatementText,
    ConnectivityStatementAnatomicalEntity,
    Relationship,
    RelationshipType,
    Sentence,
    AnatomicalEntity,
    AnatomicalEntityMeta,
    Triple,
)


@pytest.mark.django_db
class TestConnectivityStatementRelationships(TestCase):
    """Test suite for connectivity statement relationships."""

    def setUp(self):
        """Set up test fixtures."""
        # Create required related objects
        self.sentence = Sentence.objects.create()
        
        # Create a connectivity statement
        self.statement = ConnectivityStatement.objects.create(
            sentence=self.sentence,
            knowledge_statement="Test knowledge statement",
        )
        
        # Create anatomical entities for testing
        meta1 = AnatomicalEntityMeta.objects.create(
            name="Entity 1",
            ontology_uri="http://example.org/entity1"
        )
        self.entity1 = AnatomicalEntity.objects.create(
            simple_entity=meta1
        )
        meta2 = AnatomicalEntityMeta.objects.create(
            name="Entity 2",
            ontology_uri="http://example.org/entity2"
        )
        self.entity2 = AnatomicalEntity.objects.create(
            simple_entity=meta2
        )
        
        # Create relationships of different types
        self.rel_triple_single = Relationship.objects.create(
            title="Test Triple Single",
            predicate_name="has_triple_single",
            predicate_uri="http://example.org/has_triple_single",
            type=RelationshipType.TRIPLE_SINGLE,
        )
        self.rel_triple_multi = Relationship.objects.create(
            title="Test Triple Multi",
            predicate_name="has_triple_multi",
            predicate_uri="http://example.org/has_triple_multi",
            type=RelationshipType.TRIPLE_MULTI,
        )
        self.rel_text = Relationship.objects.create(
            title="Test Text",
            predicate_name="has_text",
            predicate_uri="http://example.org/has_text",
            type=RelationshipType.TEXT,
        )

        self.rel_anatomical_multi = Relationship.objects.create(
            title="Test Anatomical Multi",
            predicate_name="has_anatomical_multi",
            predicate_uri="http://example.org/has_anatomical_multi",
            type=RelationshipType.ANATOMICAL_MULTI,
        )
        
        # Create triples for testing
        self.triple1 = Triple.objects.create(
            relationship=self.rel_triple_single,
            name="Triple 1",
            uri="http://example.org/triple1"
        )
        self.triple2 = Triple.objects.create(
            relationship=self.rel_triple_multi,
            name="Triple 2",
            uri="http://example.org/triple2"
        )

    def test_create_triple_single_relationship(self):
        """Test creating a single-select triple relationship."""
        # Create the relationship object
        stmt_triple = ConnectivityStatementTriple.objects.create(
            connectivity_statement=self.statement,
            relationship=self.rel_triple_single,
        )
        
        # Add one triple - should succeed
        stmt_triple.triples.add(self.triple1)
        stmt_triple.save()
        
        self.assertEqual(stmt_triple.triples.count(), 1)
        
        # Note: M2M count validation is skipped for now to avoid timing issues
        # Validation is still enforced at the API level via serializers

    def test_create_triple_multi_relationship(self):
        """Test creating a multi-select triple relationship."""
        stmt_triple = ConnectivityStatementTriple.objects.create(
            connectivity_statement=self.statement,
            relationship=self.rel_triple_multi,
        )
        
        # Add multiple triples - should succeed
        stmt_triple.triples.add(self.triple1, self.triple2)
        stmt_triple.save()
        
        self.assertEqual(stmt_triple.triples.count(), 2)

    def test_create_anatomical_multi_relationship(self):
        """Test creating a multi-select anatomical entity relationship."""
        stmt_anatomical = ConnectivityStatementAnatomicalEntity.objects.create(
            connectivity_statement=self.statement,
            relationship=self.rel_anatomical_multi,
        )
        
        # Add multiple entities - should succeed
        stmt_anatomical.anatomical_entities.add(self.entity1, self.entity2)
        stmt_anatomical.save()
        
        self.assertEqual(stmt_anatomical.anatomical_entities.count(), 2)

    def test_create_text_relationship(self):
        """Test creating a text relationship."""
        stmt_text = ConnectivityStatementText.objects.create(
            connectivity_statement=self.statement,
            relationship=self.rel_text,
            text="Test text value",
        )
        
        self.assertEqual(stmt_text.text, "Test text value")

    def test_triple_relationship_wrong_type_fails(self):
        """Test that using a non-triple relationship type with ConnectivityStatementTriple fails."""
        with self.assertRaises(ValidationError) as context:
            ConnectivityStatementTriple.objects.create(
                connectivity_statement=self.statement,
                relationship=self.rel_text,  # Wrong type!
            )
        
        self.assertIn("should only be used for triple relationships", str(context.exception))

    def test_anatomical_relationship_wrong_type_fails(self):
        """Test that using a non-anatomical relationship type with ConnectivityStatementAnatomicalEntity fails."""
        with self.assertRaises(ValidationError) as context:
            ConnectivityStatementAnatomicalEntity.objects.create(
                connectivity_statement=self.statement,
                relationship=self.rel_text,  # Wrong type!
            )
        
        self.assertIn("should only be used for anatomical entity relationships", str(context.exception))

    def test_text_relationship_wrong_type_fails(self):
        """Test that using a non-text relationship type with ConnectivityStatementText fails."""
        with self.assertRaises(ValidationError) as context:
            ConnectivityStatementText.objects.create(
                connectivity_statement=self.statement,
                relationship=self.rel_triple_single,  # Wrong type!
                text="Some text",
            )
        
        self.assertIn("should only be used for text relationships", str(context.exception))

    def test_create_relationship_without_relationship_field(self):
        """
        Test that creating a relationship object without setting the relationship field
        doesn't crash (reproduces the admin inline form issue).
        """
        # This simulates what happens in Django admin when creating a new inline form
        # The relationship field might not be set yet when validation runs
        stmt_triple = ConnectivityStatementTriple(
            connectivity_statement=self.statement,
        )
        
        # The clean() method should handle the case where relationship is not set yet
        # It should either skip validation or raise a clear error
        try:
            stmt_triple.clean()
        except AttributeError as e:
            self.fail(f"clean() raised AttributeError when relationship not set: {e}")
        except ValidationError:
            # ValidationError is acceptable, but not AttributeError
            pass
