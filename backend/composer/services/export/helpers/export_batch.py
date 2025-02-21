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

def create_export_batch(user: User) -> ExportBatch:
    """
    Creates an empty export batch. Statements will be added after successful transition.
    """
    return ExportBatch.objects.create(user=user)


def transition_statements_to_exported(export_batch: ExportBatch, qs: QuerySet, user: User):
    """Transitions only eligible ConnectivityStatements"""
    system_user = User.objects.get(username="system")

    transitioned_statements = []

    for cs in qs:
        service = ConnectivityStatementStateService(cs)
        try:
            service.do_transition(
                CSState.EXPORTED, system_user, user
            )
            transitioned_statements.append(cs)
        except Exception as exc:
            # Handle or log the exception as needed. Here we simply print an error.
            print(f"Failed to transition ConnectivityStatement {cs.pk}: {exc}")

    # Add successfully transitioned statements to the export batch
    export_batch.connectivity_statements.set(transitioned_statements)
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
