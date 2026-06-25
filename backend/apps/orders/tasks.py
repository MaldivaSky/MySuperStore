from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from .models import Order


@shared_task
def send_order_confirmation_email_task(order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return f"Pedido {order_id} não encontrado."

    from apps.users.notifications import notify_order_confirmed_customer
    notify_order_confirmed_customer(order)
    return f"Notificações de confirmação enviadas para o pedido #{order.order_number}"


@shared_task
def send_seller_sale_notification_email_task(order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return f"Pedido {order_id} não encontrado."

    from apps.users.notifications import notify_new_sale_seller
    for sub_order in order.sub_orders.select_related("seller__user"):
        if sub_order.seller and sub_order.seller.user.email:
            notify_new_sale_seller(sub_order)

    return f"Notificações de nova venda enviadas para os vendedores do pedido #{order.order_number}"

