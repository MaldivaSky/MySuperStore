from django.urls import path

from apps.users.views.user_views import MeView, UserSurveyView

urlpatterns = [
    path("me/", MeView.as_view(), name="user-me"),
    path("me/survey/", UserSurveyView.as_view(), name="user-survey"),
]

