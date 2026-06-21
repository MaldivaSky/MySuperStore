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

    subject = f"Confirmação de Pagamento — Pedido #{order.order_number}"
    recipient_email = order.user.email
    recipient_name = order.user.first_name or "Cliente"

    # Assume total is order.total, but discount could be calculated as subtotal + shipping - total
    discount = (order.subtotal + order.shipping) - order.total

    context = {
        "recipient_name": recipient_name,
        "order_number": order.order_number,
        "subtotal": order.subtotal,
        "shipping": order.shipping,
        "discount": discount,
        "total": order.total,
        "orders_url": f"{settings.FRONTEND_URL}/dashboard/orders"
    }

    html_content = render_to_string("emails/order_confirmation.html", context)
    text_content = f"Seu pagamento foi confirmado para o pedido #{order.order_number}. Total: R$ {order.total}"

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=None,
        to=[recipient_email]
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)

    return f"E-mail de confirmação enviado para {recipient_email} (Pedido #{order.order_number})"


@shared_task
def send_seller_sale_notification_email_task(order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return f"Pedido {order_id} não encontrado."

    for sub_order in order.sub_orders.select_related("seller__user"):
        if not sub_order.seller or not sub_order.seller.user.email:
            continue

        seller_email = sub_order.seller.user.email
        seller_name = sub_order.seller.user.first_name or sub_order.seller.store_name

        subject = f"Nova Venda Realizada! — Pedido #{order.order_number}"

        context = {
            "seller_name": seller_name,
            "store_name": sub_order.seller.store_name,
            "order_number": order.order_number,
            "items": [{"quantity": i.quantity, "product_name": i.product_name, "unit_price": i.unit_price} for i in sub_order.items.all()],
            "commission": sub_order.commission,
            "seller_amount": sub_order.seller_amount,
            "dashboard_url": f"{settings.FRONTEND_URL}/seller/dashboard"
        }

        html_content = render_to_string("emails/seller_notification.html", context)
        text_content = f"Você vendeu novos itens no pedido #{order.order_number}! Valor líquido a receber: R$ {sub_order.seller_amount}. Acesse o painel para processar o envio."
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=None,
            to=[seller_email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)

    return f"E-mails de notificação de venda enviados para os vendedores do pedido #{order.order_number}"

