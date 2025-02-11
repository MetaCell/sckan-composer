from django.utils import timezone
import re
from django.core.exceptions import ValidationError

def pmid_uri(pmid):
    return f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "."


def pmcid_uri(pmcid):
    return f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/" if pmcid else "."


def doi_uri(doi):
    return f"https://doi.org/{doi}" if doi else ""


def create_reference_uri(id):
    return f"http://uri.interlex.org/tgbugs/uris/readable/sparc-nlp/composer/{id}"


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
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]{7,19}$", name):
        raise ValidationError(
            "Name must be between 8 and 20 characters, start with a letter, and contain only letters and numbers."
        )
