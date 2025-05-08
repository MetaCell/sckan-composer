from django.utils import timezone
import re
from django.core.exceptions import ValidationError

def pmid_uri(pmid):
    return f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "."


def pmcid_uri(pmcid):
    return f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/" if pmcid else "."


def doi_uri(doi):
    return f"https://doi.org/{doi}" if doi else ""


def create_reference_uri(population_name, population_index):
    return f"https://uri.interlex.org/composer/uris/set/{population_name}/{population_index}"

def join_entities(entities):
    # Joins entity names with commas, and 'and' before the last name
    entities_list = [str(entity) for entity in entities]
    if len(entities_list) > 1:
        return ', '.join(entities_list[:-1]) + ' and ' + entities_list[-1]
    elif entities_list:
        return entities_list[0]
    return ''

def update_modified_date(instance):
    instance.modified_date = timezone.now()
    instance.save(update_fields=["modified_date"])


def is_valid_population_name(name):
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]{4,14}$", name):
        raise ValidationError(
            "Name must be between 5 and 15 characters, start with a letter, and contain only letters and numbers."
        )


def generate_connectivity_statement_curie_id_for_composer_statements(statement):
    """
    Generate a short name for a connectivity statement based on its population and index.
    """
    if statement.population:
        return f"neuron type {statement.population.name} {statement.population_index}"
    return None
