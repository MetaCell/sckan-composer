from django.apps import AppConfig


class ComposerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "composer"

    def ready(self) -> None:
        # activate the signals
        from .signals import post_transition_callback
        return super().ready()
