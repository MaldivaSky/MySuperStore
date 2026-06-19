from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, SellerSubOrderViewSet, ReturnRequestViewSet

app_name = "orders"

router = DefaultRouter()
router.register(r"returns", ReturnRequestViewSet, basename="return")
router.register(r"seller", SellerSubOrderViewSet, basename="seller-order")
router.register(r"", OrderViewSet, basename="order")

urlpatterns = [
    path("", include(router.urls)),
]
