from corsheaders.signals import check_request_enabled


def cors_allow_knowledge_statement_request(sender, request, **kwargs):
    """Allow API requests to be made for the knowledge statement."""
    return request.path == '/api/composer/knowledge-statement/'


check_request_enabled.connect(cors_allow_knowledge_statement_request)
