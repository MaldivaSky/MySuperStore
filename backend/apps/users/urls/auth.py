from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.views.auth_views import ChangePasswordView, LoginView, LogoutView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
]
