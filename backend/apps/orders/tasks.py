from celery import shared_task
from django.core.mail import send_mail
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

    # Monta a mensagem de e-mail formatada em HTML
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #4CAF50;">Seu pagamento foi confirmado!</h2>
                <p>Olá, <strong>{recipient_name}</strong>,</p>
                <p>Recebemos a confirmação de pagamento para o seu pedido. Ele já está sendo preparado pelos nossos vendedores.</p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                
                <h3 style="margin-top: 0;">Resumo do Pedido #{order.order_number}</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 5px 0;"><strong>Subtotal:</strong></td>
                        <td style="text-align: right;">R$ {order.subtotal}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0;"><strong>Frete:</strong></td>
                        <td style="text-align: right;">R$ {order.shipping}</td>
                    </tr>
                    <tr style="border-top: 1px solid #ddd; font-size: 1.1em; font-weight: bold;">
                        <td style="padding: 10px 0;"><strong>Total Pago:</strong></td>
                        <td style="text-align: right; padding: 10px 0; color: #4CAF50;">R$ {order.total}</td>
                    </tr>
                </table>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                
                <p style="font-size: 0.9em; color: #666;">
                    Se você tiver alguma dúvida, entre em contato com nosso suporte.
                </p>
                <p>Atenciosamente,<br /><strong>Equipe MySuperStore</strong></p>
            </div>
        </body>
    </html>
    """

    send_mail(
        subject=subject,
        message=f"Seu pagamento foi confirmado para o pedido #{order.order_number}. Total: R$ {order.total}",
        from_email=None,  # Utiliza o DEFAULT_FROM_EMAIL padrão do settings
        recipient_list=[recipient_email],
        html_message=html_content,
        fail_silently=False,
    )

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

        items_html = ""
        for item in sub_order.items.all():
            items_html += f"<li>{item.quantity}x {item.product_name} - R$ {item.unit_price}</li>"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #2196F3;">Você realizou uma nova venda!</h2>
                    <p>Olá, <strong>{seller_name}</strong>,</p>
                    <p>Temos o prazer de informar que um cliente comprou produtos da sua loja <strong>{sub_order.seller.store_name}</strong> no pedido #{order.order_number}.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    
                    <h3 style="margin-top: 0;">Itens Vendidos</h3>
                    <ul>
                        {items_html}
                    </ul>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 5px 0;"><strong>Valor a Receber (líquido):</strong></td>
                            <td style="text-align: right; font-weight: bold; color: #2196F3;">R$ {sub_order.seller_amount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Comissão da Plataforma:</strong></td>
                            <td style="text-align: right;">R$ {sub_order.commission}</td>
                        </tr>
                    </table>
                    
                    <p>Por favor, acesse a Central do Lojista para preparar os itens e efetuar o envio.</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    
                    <p style="font-size: 0.9em; color: #666;">
                        Parabéns pela venda!
                    </p>
                    <p>Atenciosamente,<br /><strong>Equipe MySuperStore</strong></p>
                </div>
            </body>
        </html>
        """
        send_mail(
            subject=subject,
            message=f"Você vendeu novos itens no pedido #{order.order_number}! Valor líquido: R$ {sub_order.seller_amount}",
            from_email=None,
            recipient_list=[seller_email],
            html_message=html_content,
            fail_silently=False,
        )

    return f"E-mails de notificação de venda enviados para os vendedores do pedido #{order.order_number}"

