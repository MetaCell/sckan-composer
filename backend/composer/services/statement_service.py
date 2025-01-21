from ..utils import join_entities


def get_prefix_for_statement_preview(cs) -> str:
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


def get_suffix_for_statement_preview(cs):

    circuit_type = cs.get_circuit_type_display(
    ) if cs.circuit_type else None
    projection = cs.get_projection_display(
    ) if cs.projection else None
    projection_phenotype = str(
        cs.projection_phenotype) if cs.projection_phenotype else ''

    laterality_description = cs.get_laterality_description()
    apinatomy = cs.apinatomy_model if cs.apinatomy_model else ""

    origin_names = [
        origin.name for origin in cs.origins.all()]
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


def get_statement_preview(cs, journey):
    prefix = cs.statement_prefix
    journey_sentence = ';  '.join(journey)
    suffix = cs.statement_suffix
    statement = f'{prefix} {journey_sentence}.\n{suffix}'
    return statement.strip().replace("  ", " ")
