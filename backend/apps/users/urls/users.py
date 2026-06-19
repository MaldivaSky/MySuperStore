from django.urls import path

from apps.users.views.user_views import MeView

urlpatterns = [
    path("me/", MeView.as_view(), name="user-me"),
]
