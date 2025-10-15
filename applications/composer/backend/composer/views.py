
from django.http import HttpResponse, HttpResponseRedirect
from django.template import loader
from django.urls import reverse
from composer.services.workflows.export import run_export_workflow
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.core.management import call_command
import os
from django.conf import settings

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
    """
    user = request.user

    if not user.is_staff:
        return HttpResponse("Unauthorized", status=401)

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
        
        # Handle population file upload
        population_file_path = None
        if 'population_file' in request.FILES:
            uploaded_file = request.FILES['population_file']
            upload_dir = os.path.join(settings.MEDIA_ROOT, "ingestion_uploads")
            os.makedirs(upload_dir, exist_ok=True)
            population_file_path = os.path.join(upload_dir, uploaded_file.name)
            with open(population_file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
        
        # Build command arguments
        command_args = []
        if update_upstream:
            command_args.append('--update_upstream')
        if update_anatomical_entities:
            command_args.append('--update_anatomical_entities')
        if disable_overwrite:
            command_args.append('--disable_overwrite')
        if full_imports:
            command_args.extend(['--full_imports'] + full_imports)
        if label_imports:
            command_args.extend(['--label_imports'] + label_imports)
        if population_file_path:
            command_args.extend(['--population_file', population_file_path])
        
        # Call the management command
        # For now, run synchronously. Later this will be moved to a workflow
        call_command('ingest_statements', *command_args)
        
        messages.success(request, "Connectivity statements ingestion completed successfully.")
        return HttpResponse("Ingestion completed", status=200)
    
    except Exception as e:
        messages.error(request, f"Ingestion failed: {str(e)}")
        return HttpResponse(f"Ingestion failed: {str(e)}", status=500)
