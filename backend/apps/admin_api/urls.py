from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminDashboardView, AdminSellerViewSet, AdminCouponViewSet, AdminBannerViewSet, AdminBroadcastNotificationView

router = DefaultRouter()
router.register("dashboard", AdminDashboardView, basename="admin_dashboard")
router.register("sellers", AdminSellerViewSet, basename="admin_sellers")
router.register("coupons", AdminCouponViewSet, basename="admin_coupons")
router.register("banners", AdminBannerViewSet, basename="admin_banners")

urlpatterns = [
    path("", include(router.urls)),
    path("broadcast/", AdminBroadcastNotificationView.as_view(), name="admin_broadcast"),
]
