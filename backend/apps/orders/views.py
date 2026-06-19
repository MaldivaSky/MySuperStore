from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_number"
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        # Otimiza o carregamento de sub-pedidos, itens e vendedores em uma consulta reduzida
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related(
                "sub_orders__items",
                "sub_orders__seller",
            )
        )

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """POST /api/v1/orders/ — Cria um pedido a partir do carrinho do usuário."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        
        # Retorna o pedido completo serializado
        response_serializer = OrderSerializer(order, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

class SellerSubOrderViewSet(viewsets.ModelViewSet):
    """Endpoint exclusivo para lojistas gerenciarem o status dos pedidos (SubOrders)"""
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "options"]
    
    def get_queryset(self):
        from .models import SubOrder
        if not hasattr(self.request.user, "seller_profile"):
            return SubOrder.objects.none()
        return SubOrder.objects.filter(seller=self.request.user.seller_profile).order_by("-created_at")
        
    def get_serializer_class(self):
        from .serializers import SubOrderSerializer
        return SubOrderSerializer

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        sub_order = self.get_object()
        new_status = request.data.get("status")
        
        # Validar se o status está nas escolhas
        from .models import SubOrderStatus
        valid_statuses = [choice[0] for choice in SubOrderStatus.choices]
        
        if new_status not in valid_statuses:
            return Response({"error": "Status inválido."}, status=status.HTTP_400_BAD_REQUEST)
            
        sub_order.status = new_status
        sub_order.save()
        
        serializer = self.get_serializer(sub_order)
        return Response(serializer.data)


class ReturnRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "options"]
    
    def get_queryset(self):
        from .models import ReturnRequest
        user = self.request.user
        if hasattr(user, "seller_profile"):
            # Lojista vê os pedidos de devolução das vendas dele
            return ReturnRequest.objects.filter(order_item__sub_order__seller=user.seller_profile).order_by("-created_at")
        else:
            # Cliente vê as próprias devoluções
            return ReturnRequest.objects.filter(order_item__sub_order__order__user=user).order_by("-created_at")
            
    def get_serializer_class(self):
        from .serializers import ReturnRequestSerializer
        return ReturnRequestSerializer

    def create(self, request, *args, **kwargs):
        """Cliente solicita devolução"""
        from .models import OrderItem, ReturnRequest
        order_item_id = request.data.get("order_item_id")
        reason = request.data.get("reason")
        customer_notes = request.data.get("customer_notes", "")
        
        try:
            order_item = OrderItem.objects.get(id=order_item_id, sub_order__order__user=request.user)
        except OrderItem.DoesNotExist:
            return Response({"error": "Item não encontrado no seu histórico de compras."}, status=404)
            
        if hasattr(order_item, 'return_request'):
            return Response({"error": "Este item já possui uma solicitação de devolução em andamento."}, status=400)
            
        if order_item.sub_order.status not in ["delivered", "shipped"]:
            return Response({"error": "Só é possível devolver itens enviados ou entregues."}, status=400)

        # Usar um serializer manual ou save direto
        rr = ReturnRequest.objects.create(
            order_item=order_item,
            reason=reason,
            customer_notes=customer_notes,
            status="requested"
        )
        
        serializer = self.get_serializer(rr)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        """Lojista atualiza o status da devolução"""
        from .models import ReturnStatus
        rr = self.get_object()
        
        if not hasattr(request.user, "seller_profile") or rr.order_item.sub_order.seller != request.user.seller_profile:
            return Response({"error": "Acesso negado. Apenas o lojista deste item pode atualizar o status."}, status=403)
            
        new_status = request.data.get("status")
        seller_notes = request.data.get("seller_notes")
        
        valid_statuses = [choice[0] for choice in ReturnStatus.choices]
        if new_status and new_status not in valid_statuses:
            return Response({"error": "Status inválido."}, status=400)
            
        if new_status:
            rr.status = new_status
            
            # Se a devolução foi aprovada e reembolsada, aqui deve-se ligar com a Stripe no futuro
            if new_status == "refunded":
                rr.order_item.sub_order.status = "refunded"
                rr.order_item.sub_order.save()
                
        if seller_notes is not None:
            rr.seller_notes = seller_notes
            
        rr.save()
        return Response(self.get_serializer(rr).data)
