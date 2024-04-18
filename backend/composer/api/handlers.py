from corsheaders.signals import check_request_enabled


def cors_allow_api_to_origins(sender, request, **kwargs):
    """
    Allow API requests to be made from the specified origins.
	"""
    return request.path == '/api/composer/knowledge-statement/'

check_request_enabled.connect(cors_allow_api_to_origins)
