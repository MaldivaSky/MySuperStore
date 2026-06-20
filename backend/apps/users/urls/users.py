from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views.user_views import MeView, UserSurveyView, AddressViewSet

router = DefaultRouter()
router.register(r"addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("me/", MeView.as_view(), name="user-me"),
    path("me/survey/", UserSurveyView.as_view(), name="user-survey"),
    path("me/", include(router.urls)),
]

