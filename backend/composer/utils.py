def pmid_uri(pmid):
    return f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "."


def pmcid_uri(pmcid):
    return f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmcid}/" if pmcid else "."


def doi_uri(doi):
    return f"https://doi.org/{doi}" if doi else ""
