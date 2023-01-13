from django import template
from django.template.defaultfilters import stringfilter

from composer.utils import doi_uri, pmcid_uri, pmid_uri


register = template.Library()


@register.filter
@stringfilter
def to_doi_uri(value):
    """Transforms a DOI into a URI"""
    return doi_uri(value)


@register.filter
@stringfilter
def to_pmcid_uri(value):
    """Transforms a PMCID into a URI"""
    return pmcid_uri(value)


@register.filter
@stringfilter
def to_pmid_uri(value):
    """Transforms a PMID into a URI"""
    return pmid_uri(value)
