from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.serializers import UserProfileSerializer, UserProfileUpdateSerializer


class MeView(APIView):
    """GET/PATCH /api/v1/users/me/ — perfil do usuário autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            UserProfileSerializer(request.user, context={"request": request}).data
        )


from apps.users.models import UserSurvey
from apps.users.serializers import UserSurveySerializer

class UserSurveyView(APIView):
    """GET/POST /api/v1/users/me/survey/ — questionário de interesses do usuário."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        survey, _ = UserSurvey.objects.get_or_create(user=request.user)
        serializer = UserSurveySerializer(survey)
        return Response(serializer.data)

    def post(self, request):
        survey, _ = UserSurvey.objects.get_or_create(user=request.user)
        serializer = UserSurveySerializer(survey, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        try:
            from apps.crm.models import Lead
            lead = Lead.objects.filter(email=request.user.email).first()
            if lead:
                notes = lead.notes + "\n\n--- Pesquisa de Perfil (Atualizada) ---\n"
                for key, value in serializer.validated_data.items():
                    if value:
                        notes += f"- {key}: {value}\n"
                        
                # Define o Funnel Type com base na intenção
                intent = serializer.validated_data.get("primary_intent")
                if intent == "comprar":
                    lead.funnel_type = "comprador"
                elif intent in ["vender", "ambos"]:
                    lead.funnel_type = "lojista"
                    
                lead.notes = notes.strip()
                lead.save(update_fields=["notes", "funnel_type", "updated_at"])
        except Exception as e:
            print(f"Erro ao sincronizar pesquisa com CRM: {e}")

        return Response(serializer.data)


from rest_framework import viewsets
from apps.users.models import Address
from apps.users.serializers import AddressSerializer

class AddressViewSet(viewsets.ModelViewSet):
    """CRUD para endereços do usuário autenticado."""
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


from django.db.models import Sum, Count
from apps.orders.models import Order, OrderItem, OrderStatus

class BuyerRecapView(APIView):
    """GET /api/v1/users/me/recap/ — Gera o 'Spotify Recap' das compras do usuário."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Filtra apenas pedidos pagos/confirmados/entregues
        valid_statuses = [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
        orders = Order.objects.filter(user=user, status__in=valid_statuses)
        
        total_orders = orders.count()
        total_spent = orders.aggregate(total=Sum("total"))["total"] or 0
        
        # Pega todos os itens comprados nesses pedidos
        items = OrderItem.objects.filter(sub_order__order__in=orders)
        total_items = items.aggregate(qtd=Sum("quantity"))["qtd"] or 0
        
        # Descobre a categoria favorita
        # Como o nome da categoria fica salvo no histórico (ou usando o relacional se quisermos)
        # Vamos pegar os produtos dos OrderItems e agrupar pela categoria do produto (que está salva no histórico de preço, ou podemos navegar para variante)
        favorite_category = "Explorador"
        
        # Agrupa pelo nome do produto, pois não replicamos o nome da categoria direto no OrderItem,
        # mas podemos extrair navegando `variant__product__category__name`
        category_stats = items.values("variant__product__category__name").annotate(
            count=Count("id")
        ).order_by("-count")
        
        if category_stats and category_stats[0]["variant__product__category__name"]:
            favorite_category = category_stats[0]["variant__product__category__name"]

        first_order = orders.order_by("created_at").first()
        first_purchase_date = first_order.created_at.isoformat() if first_order else None

        return Response({
            "member_since": user.date_joined.isoformat(),
            "first_purchase_date": first_purchase_date,
            "total_spent": total_spent,
            "total_orders": total_orders,
            "total_items": total_items,
            "favorite_category": favorite_category
        })


from apps.users.models import Notification
from apps.users.serializers import NotificationSerializer
from rest_framework.decorators import action

class NotificationViewSet(viewsets.ModelViewSet):
    """CRUD para Notificações do usuário autenticado."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"status": "success"})

