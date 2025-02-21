from django.db.models import Count, QuerySet
from django.contrib.auth.models import User


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



def create_export_batch(user: User) -> ExportBatch:
    """
    Creates an empty export batch. Statements will be added after successful transition.
    """
    return ExportBatch.objects.create(user=user)


def transition_statements_to_exported(export_batch: ExportBatch, qs: QuerySet):
    """Transitions only eligible ConnectivityStatements and updates them in bulk."""
    system_user = User.objects.filter(username="system").first()
    if not system_user:
        raise ValueError("System user not found.")

    # Prepare successful statement list
    successful_statements = []
    for cs in qs:
        if ConnectivityStatementStateService(cs).is_transition_available(CSState.EXPORTED, system_user):
            successful_statements.append(cs)

    ## This is equivalent to do_transition from NPO_APPROVED to EXPORTED but optimized for bulk.
    ## Changes on the transition logic should be reflected here.
    
    # Perform bulk state update
    ConnectivityStatement.objects.filter(id__in=[cs.id for cs in successful_statements]).update(state=CSState.EXPORTED)

    # Update has_statement_been_exported flag
    ConnectivityStatement.objects.filter(id__in=[cs.id for cs in successful_statements]).update(
        has_statement_been_exported=True
    )

    # Add only successfully transitioned statements to the export batch
    export_batch.connectivity_statements.set(successful_statements)
    
    return export_batch