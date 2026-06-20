from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminDashboardView, AdminSellerViewSet, AdminCouponViewSet

router = DefaultRouter()
router.register("dashboard", AdminDashboardView, basename="admin_dashboard")
router.register("sellers", AdminSellerViewSet, basename="admin_sellers")
router.register("coupons", AdminCouponViewSet, basename="admin_coupons")

urlpatterns = [
    path("", include(router.urls)),
]
