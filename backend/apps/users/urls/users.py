from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.users.views.user_views import MeView, UserSurveyView, AddressViewSet, BuyerRecapView, NotificationViewSet

router = DefaultRouter()
router.register(r"addresses", AddressViewSet, basename="address")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("me/", MeView.as_view(), name="user-me"),
    path("me/survey/", UserSurveyView.as_view(), name="user-survey"),
    path("me/recap/", BuyerRecapView.as_view(), name="user-recap"),
    path("me/", include(router.urls)),
]

