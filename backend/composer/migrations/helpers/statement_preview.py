from composer.enums import Laterality
from composer.utils import join_entities
from django.apps import apps


def get_migration_prefix_for_statement_preview(cs) -> str:
    sex = cs.sex.name if cs.sex else None

    species_list = [
        specie.name for specie in cs.species.all()]
    species = join_entities(species_list)
    if not species:
        species = ""

    phenotype = cs.phenotype.name if cs.phenotype else ''
    if sex or species != "":
        statement = f"In {sex or ''} {species}, the {phenotype.lower()} connection goes"
    else:
        statement = f"A {phenotype.lower()} connection goes"
    return statement


def get_migration_suffix_for_statement_preview(cs):

    circuit_type = cs.get_circuit_type_display(
    ) if cs.circuit_type else None
    projection = cs.get_projection_display(
    ) if cs.projection else None
    projection_phenotype = str(
        cs.projection_phenotype) if cs.projection_phenotype else ''

    laterality_description = get_laterality_description(cs)
    apinatomy = cs.apinatomy_model if cs.apinatomy_model else ""

    origin_names = [
        get_name(origin) for origin in cs.origins.all()]
    origins = join_entities(origin_names)

    if not origins:
        origins = ""

    statement = f"This "
    if projection:
        statement += f"{projection.lower()} "
    if projection_phenotype:
        statement += f"{projection_phenotype.lower()} "
    if circuit_type:
        statement += f"{circuit_type.lower()} "

    statement += f"connection projects from the {origins}."
    if laterality_description:
        statement = statement[:-1] + \
            f" and is found {laterality_description}.\n"

    if apinatomy:
        statement += f" It is described in {apinatomy} model."
    return statement


def get_name(instance):
    if instance.simple_entity:
        return str(instance.simple_entity)
    if instance.region_layer:
        return str(instance.region_layer)
    return 'Unknown Anatomical Entity'

def get_laterality_description(instance):
    laterality_map = {
        Laterality.RIGHT.value: "on the right side of the body",
        Laterality.LEFT.value: "on the left side of the body",
    }
    return laterality_map.get(instance.laterality, None)
