from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from core.permissions import IsPlatformAdmin
from apps.orders.models import Order, Coupon
from apps.sellers.models import Seller
from apps.users.models import User
from apps.catalog.models import Banner
from .serializers import AdminCouponSerializer, AdminSellerListSerializer, AdminBannerSerializer

class AdminDashboardView(viewsets.ViewSet):
    permission_classes = [IsPlatformAdmin]

    @action(detail=False, methods=["get"], url_path="metrics")
    def metrics(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        # Revenue
        current_revenue = Order.objects.filter(status="paid", created_at__gte=thirty_days_ago).aggregate(Sum("total"))["total__sum"] or 0
        past_revenue = Order.objects.filter(status="paid", created_at__gte=sixty_days_ago, created_at__lt=thirty_days_ago).aggregate(Sum("total"))["total__sum"] or 0
        revenue_change = ((current_revenue - past_revenue) / past_revenue * 100) if past_revenue > 0 else 0

        # Active Sellers
        active_sellers = Seller.objects.filter(status="approved").count()

        # Pending Approvals
        pending_approvals = Seller.objects.filter(status="pending").count()

        # Users & Churn (simplified metric for last 30 days)
        total_users = User.objects.filter(role="customer").count()
        new_users = User.objects.filter(role="customer", date_joined__gte=thirty_days_ago).count()
        churn_rate = 2.4 # Placeholder algorithm for churn

        return Response({
            "revenue": {
                "value": float(current_revenue),
                "change": f"{revenue_change:+.1f}%",
                "is_positive": revenue_change >= 0
            },
            "active_sellers": {
                "value": active_sellers,
                "change": "+5.2%", # Mock historical comparison
                "is_positive": True
            },
            "pending_approvals": {
                "value": pending_approvals,
                "change": "N/A",
                "is_positive": pending_approvals == 0
            },
            "churn": {
                "value": f"{churn_rate}%",
                "change": "-1.1%",
                "is_positive": True
            }
        })

class AdminSellerViewSet(viewsets.ModelViewSet):
    permission_classes = [IsPlatformAdmin]
    queryset = Seller.objects.all().select_related("user").order_by("-created_at")
    serializer_class = AdminSellerListSerializer

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        seller = self.get_object()
        seller.status = "approved"
        seller.save()
        
        send_mail(
            subject="Parabéns! Sua loja foi aprovada no MySuperStore",
            message=f"Olá {seller.user.email},\n\nSua loja '{seller.store_name}' foi aprovada! Você já pode acessar seu painel e conectar sua conta Stripe para começar a vender.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[seller.user.email],
            fail_silently=True,
        )
        
        return Response({"detail": "Lojista aprovado com sucesso.", "status": seller.status})

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        seller = self.get_object()
        reason = request.data.get("reason", "Sua solicitação não atende aos nossos critérios de qualidade no momento.")
        seller.status = "rejected"
        seller.save()
        
        send_mail(
            subject="Atualização sobre sua solicitação no MySuperStore",
            message=f"Olá {seller.user.email},\n\nInfelizmente sua loja '{seller.store_name}' não foi aprovada.\n\nMotivo:\n{reason}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[seller.user.email],
            fail_silently=True,
        )
        
        return Response({"detail": "Lojista rejeitado.", "status": seller.status})

    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        seller = self.get_object()
        reason = request.data.get("reason", "Violação dos Termos de Serviço.")
        seller.status = "suspended"
        seller.save()
        
        send_mail(
            subject="Aviso: Sua loja foi suspensa no MySuperStore",
            message=f"Olá {seller.user.email},\n\nSua loja '{seller.store_name}' foi suspensa pela nossa equipe.\n\nMotivo:\n{reason}\n\nEntre em contato com o suporte para mais informações.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[seller.user.email],
            fail_silently=True,
        )
        
        return Response({"detail": "Lojista suspenso.", "status": seller.status})

class AdminCouponViewSet(viewsets.ModelViewSet):
    permission_classes = [IsPlatformAdmin]
    queryset = Coupon.objects.all().select_related("seller").order_by("-valid_from")
    serializer_class = AdminCouponSerializer

    def perform_create(self, serializer):
        serializer.save()

class AdminBannerViewSet(viewsets.ModelViewSet):
    permission_classes = [IsPlatformAdmin]
    queryset = Banner.objects.all().order_by("order", "-created_at")
    serializer_class = AdminBannerSerializer

    def perform_create(self, serializer):
        serializer.save()
