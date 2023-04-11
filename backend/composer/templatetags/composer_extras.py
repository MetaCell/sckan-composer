from typing import Optional, Dict
from django import template
from django.db.models import Sum
from django.template.defaultfilters import stringfilter

from composer.models import ExportBatch
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


@register.simple_tag(takes_context=True)
def get_last_export(context: template.Context, using: str = "available_apps"):
    """
    Returns the last export batch
    """
    user = context["request"].user
    if user.is_authenticated:
        last_export_batch = ExportBatch.objects.all().order_by("-created_at").first()
        if last_export_batch:
            return {
                "created_at": last_export_batch.created_at,
                "user": last_export_batch.user,
                "count_connectivity_statements_in_this_export": last_export_batch.get_count_connectivity_statements_in_this_export,
                "count_connectivity_statements_modified_since": last_export_batch.get_count_connectivity_statements_modified_since_this_export,
                "count_connectivity_statements_created_since": last_export_batch.get_count_connectivity_statements_created_since_this_export,
                "count_sentences_created_since": last_export_batch.get_count_sentences_created_since_this_export                
            }
    return {}

@register.filter
def count_entity(qs_exportmetrics, entity):
    return qs_exportmetrics.filter(entity=entity).aggregate(Sum("count"))["count__sum"]

@register.filter
def filter_entity(qs_exportmetrics, entity):
    return [{"count":row.count,"state":row.state.replace("_"," ")} for row in qs_exportmetrics.filter(entity=entity)]

@register.filter(name='split')
def split(value, key):
    """
        Returns the value turned into a list.
    """
    return value.split(key)

@register.filter
def pct( value, arg ):
    '''
    Divides the value; argument is the divisor.
    Returns empty string on any error.
    '''
    try:
        value = int( value )
        arg = int( arg )
        if arg: return max((value / arg) * 100, 1)
    except: pass
    return ''
