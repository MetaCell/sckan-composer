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
