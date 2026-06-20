from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from .models import Cart

@shared_task
def send_abandoned_cart_emails_task():
    # Carrinhos modificados entre 30 minutos e 24 horas atrás que têm itens e usuário associado
    cutoff_start = timezone.now() - timedelta(minutes=30)
    cutoff_end = timezone.now() - timedelta(hours=24)
    
    abandoned_carts = Cart.objects.filter(
        user__isnull=False,
        updated_at__lte=cutoff_start,
        updated_at__gte=cutoff_end,
        items__isnull=False
    ).distinct()
    
    emails_sent = 0
    for cart in abandoned_carts:
        user = cart.user
        recipient_email = user.email
        recipient_name = user.first_name or "Cliente"
        
        items_html = ""
        for item in cart.items.all():
            items_html += f"<li>{item.quantity}x {item.variant.product.name} - R$ {item.variant.effective_price}</li>"
            
        subject = "Esqueceu algo no seu carrinho? 🛒"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #FF5722;">Seu carrinho está te esperando!</h2>
                    <p>Olá, <strong>{recipient_name}</strong>,</p>
                    <p>Notamos que você adicionou alguns produtos incríveis ao seu carrinho, mas não concluiu a compra. Eles ainda estão reservados para você, mas por tempo limitado!</p>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    
                    <h3 style="margin-top: 0;">Itens no seu Carrinho</h3>
                    <ul>
                        {items_html}
                    </ul>
                    
                    <p>Não perca tempo e garanta seus produtos antes que o estoque acabe!</p>
                    
                    <a href="http://localhost:3000/cart" style="display: inline-block; padding: 12px 24px; background: #FF5722; color: white; text-decoration: none; font-weight: bold; border-radius: 6px; margin: 20px 0;">Finalizar Minha Compra</a>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                    
                    <p style="font-size: 0.9em; color: #666;">
                        Se precisar de alguma ajuda, responda a este e-mail.
                    </p>
                    <p>Atenciosamente,<br /><strong>Equipe MySuperStore</strong></p>
                </div>
            </body>
        </html>
        """
        
        send_mail(
            subject=subject,
            message=f"Olá {recipient_name}, você deixou itens no seu carrinho! Acesse http://localhost:3000/cart para finalizar.",
            from_email=None,
            recipient_list=[recipient_email],
            html_message=html_content,
            fail_silently=False,
        )
        emails_sent += 1
        
    return f"E-mails de carrinho abandonado enviados: {emails_sent}"
