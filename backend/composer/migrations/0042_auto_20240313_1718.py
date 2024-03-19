from django.db import migrations
from django.db.models import Min


def bulk_replace_entities(ThroughModel, source_field, target_field, source_qs, primary_entity_id, duplicate_entity_id):

    # Delete old relationships
    ThroughModel.objects.filter(**{target_field: duplicate_entity_id}).delete()

    # Prepare new relationships
    new_relations = [
        ThroughModel(**{
            source_field: getattr(obj, 'id'),
            target_field: primary_entity_id
        })
        for obj in source_qs
    ]

    # Bulk create new relationships
    ThroughModel.objects.bulk_create(new_relations)


def deduplicate_anatomical_entities(apps, schema_editor):
    AnatomicalEntity = apps.get_model('composer', 'AnatomicalEntity')
    Synonym = apps.get_model('composer', 'Synonym')
    ConnectivityStatement = apps.get_model('composer', 'ConnectivityStatement')
    Destination = apps.get_model('composer', 'Destination')
    Via = apps.get_model('composer', 'Via')

    primary_anatomical_entities = AnatomicalEntity.objects.all().order_by("ontology_uri").values(
        "ontology_uri").annotate(min_id=Min("id"))

    for primary in primary_anatomical_entities:
        primary_entity_id = primary['min_id']
        primary_entity = AnatomicalEntity.objects.get(id=primary_entity_id)
        duplicate_entities = AnatomicalEntity.objects.filter(ontology_uri=primary['ontology_uri']).exclude(
            id=primary_entity_id)

        for duplicate_entity in duplicate_entities:
            Synonym.objects.create(anatomical_entity=primary_entity, name=duplicate_entity.name)

            # Update ConnectivityStatement origins
            bulk_replace_entities(
                ConnectivityStatement.origins.through,
                'connectivitystatement_id',
                'anatomicalentity_id',
                ConnectivityStatement.objects.filter(origins=duplicate_entity),
                primary_entity_id,
                duplicate_entity.id
            )

            # Update Destination anatomical_entities
            bulk_replace_entities(
                Destination.anatomical_entities.through,
                'destination_id',
                'anatomicalentity_id',
                Destination.objects.filter(anatomical_entities=duplicate_entity),
                primary_entity_id,
                duplicate_entity.id
            )

            # Update Destination from_entities
            bulk_replace_entities(
                Destination.from_entities.through,
                'destination_id',
                'anatomicalentity_id',
                Destination.objects.filter(from_entities=duplicate_entity),
                primary_entity_id,
                duplicate_entity.id
            )

            # Update Via anatomical_entities
            bulk_replace_entities(
                Via.anatomical_entities.through,
                'via_id',
                'anatomicalentity_id',
                Via.objects.filter(anatomical_entities=duplicate_entity),
                primary_entity_id,
                duplicate_entity.id
            )

            # Update Via from_entities
            bulk_replace_entities(
                Via.from_entities.through,
                'via_id',
                'anatomicalentity_id',
                Via.objects.filter(from_entities=duplicate_entity),
                primary_entity_id,
                duplicate_entity.id
            )

            # Delete the duplicate entity
            duplicate_entity.delete()


class Migration(migrations.Migration):
    dependencies = [
        ("composer", "0041_synonym"),
    ]

    operations = [
        migrations.RunPython(deduplicate_anatomical_entities),
    ]
