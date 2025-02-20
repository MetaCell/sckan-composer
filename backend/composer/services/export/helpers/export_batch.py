from django.db.models import Count, QuerySet
from django.contrib.auth.models import User
from django.db import transaction

from composer.services.state_services import ConnectivityStatementStateService
from composer.enums import (
    CSState,
    MetricEntity,
    SentenceState,
)
from composer.models import (
    ConnectivityStatement,
    ExportBatch,
    ExportMetrics,
    Sentence,
)

def create_export_batch(qs: QuerySet, user: User) -> ExportBatch:
    export_batch = ExportBatch.objects.create(user=user)
    export_batch.connectivity_statements.set(qs)
    export_batch.save()
    return export_batch


def compute_metrics(export_batch: ExportBatch):
    last_export_batch = (
        ExportBatch.objects.exclude(id=export_batch.id).order_by("-created_at").first()
    )
    if last_export_batch:
        last_export_batch_created_at = last_export_batch.created_at
    else:
        last_export_batch_created_at = None

    # Compute the metrics for this export
    if last_export_batch_created_at:
        sentences_created_qs = Sentence.objects.filter(
            created_date__gt=last_export_batch_created_at,
        )
    else:
        sentences_created_qs = Sentence.objects.all()
    export_batch.sentences_created = sentences_created_qs.count()

    if last_export_batch_created_at:
        connectivity_statements_created_qs = ConnectivityStatement.objects.filter(
            created_date__gt=last_export_batch_created_at,
        )
    else:
        connectivity_statements_created_qs = ConnectivityStatement.objects.all()
    connectivity_statements_created_qs = connectivity_statements_created_qs.exclude(
        state=CSState.DRAFT
    )  # skip draft statements
    export_batch.connectivity_statements_created = connectivity_statements_created_qs.count()

    # Compute the state metrics for this export
    connectivity_statement_metrics = list(
        ConnectivityStatement.objects.values("state").annotate(count=Count("state"))
    )
    for state in CSState:
        metric = next(
            (x for x in connectivity_statement_metrics if x.get("state") == state),
            {"state": state.value, "count": 0},
        )
        ExportMetrics.objects.create(
            export_batch=export_batch,
            entity=MetricEntity.CONNECTIVITY_STATEMENT,
            state=CSState(metric["state"]),
            count=metric["count"],
        )
    sentence_metrics = list(Sentence.objects.values("state").annotate(count=Count("state")))
    for state in SentenceState:
        metric = next(
            (x for x in sentence_metrics if x.get("state") == state),
            {"state": state.value, "count": 0},
        )
        ExportMetrics.objects.create(
            export_batch=export_batch,
            entity=MetricEntity.SENTENCE,
            state=SentenceState(metric["state"]),
            count=metric["count"],
        )
    return export_batch


def filter_statements_with_exported_transition(qs: QuerySet, user: User) -> QuerySet:
    system_user = User.objects.get(username="system")
    filtered_qs = qs.filter(
        id__in=[
            cs.id
            for cs in qs
            if CSState.EXPORTED
            in [
                available_state.target
                for available_state in cs.get_available_user_state_transitions(
                    system_user
                )
            ]
        ]
    )
    return filtered_qs


def transition_statements_to_exported(export_batch: ExportBatch, user: User):
    system_user = User.objects.get(username="system")
    connectivity_statements = export_batch.connectivity_statements.all()
    for connectivity_statement in connectivity_statements:
        ConnectivityStatementStateService(connectivity_statement).do_transition(
            CSState.EXPORTED, system_user, user
        ).save()

    return export_batch



def generate_and_save_compr_uri(connectivity_statements):
    for connectivity_statement in connectivity_statements.order_by('id'):
        populationset = connectivity_statement.population
        COMPR_URI_PREFIX = "https://uri.interlex.org/composer/uris/set/"
        if connectivity_statement.population:
            compr_uri_population_label = connectivity_statement.population.name
        else:
            """All Exported ConnectivityStatements should have a PopulationSet"""
            raise ValueError("PopulationSet is required")
        
        if connectivity_statement.has_statement_been_exported:
            return 
    
        with transaction.atomic():
            if populationset.cs_exported_from_this_populationset_incremental_index != populationset.connectivitystatement_set.filter(has_statement_been_exported=True).count():
                raise ValueError("Incremental index does not match the number of exported statements")
            
            # increment the index - only if has_statement_been_exported is False
            incremental_index = populationset.cs_exported_from_this_populationset_incremental_index + 1
            populationset.cs_exported_from_this_populationset_incremental_index = incremental_index
            populationset.save()

            # generate compr_uri
            compr_uri = f"{COMPR_URI_PREFIX}{compr_uri_population_label}/{incremental_index}"
            
            connectivity_statement.compr_uri = compr_uri
            connectivity_statement.save()
