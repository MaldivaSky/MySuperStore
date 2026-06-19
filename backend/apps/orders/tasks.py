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
