from ..utils import join_entities
from django.apps import apps


def get_prefix_for_statement_preview(cs) -> str:
    connectivity_statement_obj = apps.get_model(
        'composer', 'ConnectivityStatement')
    connectivity_statement = connectivity_statement_obj.objects.get(
        id=cs.id)

    sex = connectivity_statement.sex.name if connectivity_statement.sex else None

    species_list = [
        specie.name for specie in connectivity_statement.species.all()]
    species = join_entities(species_list)
    if not species:
        species = ""

    phenotype = connectivity_statement.phenotype.name if connectivity_statement.phenotype else ''
    if sex or species != "":
        statement = f"In {sex or ''} {species}, the {phenotype.lower()} connection goes"
    else:
        statement = f"A {phenotype.lower()} connection goes"
    return statement


def get_suffix_for_statement_preview(cs):
    connectivity_statement_obj = apps.get_model(
        'composer', 'ConnectivityStatement')
    connectivity_statement = connectivity_statement_obj.objects.get(
        id=cs.id)

    circuit_type = connectivity_statement.get_circuit_type_display(
    ) if connectivity_statement.circuit_type else None
    projection = connectivity_statement.get_projection_display(
    ) if connectivity_statement.projection else None
    projection_phenotype = str(
        connectivity_statement.projection_phenotype) if connectivity_statement.projection_phenotype else ''

    laterality_description = connectivity_statement.get_laterality_description()
    apinatomy = connectivity_statement.apinatomy_model if connectivity_statement.apinatomy_model else ""

    origin_names = [
        origin.name for origin in connectivity_statement.origins.all()]
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


def create_statement_preview(cs, journey):
    prefix = cs.statement_prefix
    journey_sentence = ';  '.join(journey)
    suffix = cs.statement_suffix
    statement = f'{prefix} {journey_sentence}.\n{suffix}'
    return statement.strip().replace("  ", " ")
