from django.urls import path

from .views import user_login, user_logout

# The API URLs are now determined automatically by the router.
app_name = "metacell-auth-api"
urlpatterns = [
    path("login/", user_login, name="login"),
    path("logout/", user_logout, name="logout"),
]
