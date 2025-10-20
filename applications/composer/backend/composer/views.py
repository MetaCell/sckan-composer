
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.urls import reverse
from composer.services.workflows.export import run_export_workflow
from composer.services.workflows.ingestion import run_ingestion_workflow
from composer.services.workflows.ingestion_utils import (
    get_ingestion_timestamp,
    get_timestamped_population_filename,
)
from composer.constants import INGESTION_TEMP_DIR
from django.contrib import messages
from django.views.decorators.http import require_http_methods
import os

def index(request):
    if not hasattr(request, "user") or not request.user.is_authenticated:
        return HttpResponseRedirect(
            reverse("social:begin", kwargs={"backend": "orcid"})
            + f"?next={request.path}"
        )
    return HttpResponseRedirect(reverse("admin:index"))


def logout_landing(request):
    if hasattr(request, "user") and request.user.is_authenticated:
        # user is still logged in, so we need to log them out
        return HttpResponseRedirect(reverse("rest_framework:logout"))

    template = loader.get_template("composer/logout_landing.html")
    context = {}
    return HttpResponse(template.render(context, request))


def admin_login(request):
    """
    Assuming the name of the external system's login url is "login"
    """
    return index(request)


def export(request):
    """
    Initiates an Argo workflow to export all connectivity statements.
    The export will run asynchronously and notify the user by email upon completion.
    """
    user = request.user

    if not user.is_staff:
        return HttpResponse("Unauthorized", status=401)

    if not user.email:
        messages.error(request, "Export failed: your account does not have an email address configured.")
        return HttpResponse("Missing user email", status=400)

    run_export_workflow(user=user, scheme=request.scheme)

    messages.success(request, "Export process started. You will receive an email when it is complete.")
    return HttpResponse("Export started", status=202)


@require_http_methods(["POST"])
def ingest_statements(request):
    """
    Triggers the ingestion of connectivity statements from neurondm.
    Accepts parameters to configure the ingestion process.
    The ingestion runs asynchronously via Argo workflow and notifies the user by email upon completion.
    """
    user = request.user

    if not user.is_staff:
        return HttpResponse("Unauthorized", status=401)

    if not user.email:
        messages.error(request, "Ingestion failed: your account does not have an email address configured.")
        return HttpResponse("Missing user email", status=400)

    try:
        # Parse form data
        data = request.POST
        
        # Get boolean flags
        update_upstream = data.get('update_upstream') == 'on'
        update_anatomical_entities = data.get('update_anatomical_entities') == 'on'
        disable_overwrite = data.get('disable_overwrite') == 'on'
        
        # Get list fields and parse them
        full_imports = None
        full_imports_raw = data.get('full_imports', '').strip()
        if full_imports_raw:
            # Split by commas or newlines and filter empty strings
            full_imports = [x.strip() for x in full_imports_raw.replace('\n', ',').split(',') if x.strip()]
        
        label_imports = None
        label_imports_raw = data.get('label_imports', '').strip()
        if label_imports_raw:
            # Split by commas or newlines and filter empty strings
            label_imports = [x.strip() for x in label_imports_raw.replace('\n', ',').split(',') if x.strip()]
        
        # Generate timestamp for this ingestion workflow
        timestamp = get_ingestion_timestamp()
        
        # Handle population file upload
        population_file_path = None
        if 'population_file' in request.FILES:
            uploaded_file = request.FILES['population_file']
            os.makedirs(INGESTION_TEMP_DIR, exist_ok=True)
            
            population_file_path = get_timestamped_population_filename(
                uploaded_file.name,
                timestamp
            )
            
            with open(population_file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
        
        # Run the ingestion workflow asynchronously
        run_ingestion_workflow(
            user=user,
            update_upstream=update_upstream,
            update_anatomical_entities=update_anatomical_entities,
            disable_overwrite=disable_overwrite,
            full_imports=full_imports,
            label_imports=label_imports,
            population_file_path=population_file_path,
            timestamp=timestamp,
        )
        
        messages.success(request, "Ingestion process started. You will receive an email when it is complete.")
        return HttpResponse("Ingestion started", status=202)
    
    except Exception as e:
        messages.error(request, f"Failed to start ingestion: {str(e)}")
        return HttpResponse(f"Failed to start ingestion: {str(e)}", status=500)
