from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
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
            
        subject = "Seu carrinho está te esperando! 🛒 | MySuperStore"
        
        context = {
            "recipient_name": recipient_name,
            "items": [{"quantity": i.quantity, "product_name": i.variant.product.name, "price": i.variant.effective_price} for i in cart.items.all()],
            "checkout_url": "http://localhost:3000/checkout"
        }
        
        html_content = render_to_string("emails/abandoned_cart.html", context)
        text_content = f"Olá {recipient_name}, você deixou itens no seu carrinho! Use o cupom VOLTA10 e ganhe 10% de desconto. Acesse http://localhost:3000/checkout para finalizar."
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=None,
            to=[recipient_email]
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        emails_sent += 1
        
    return f"E-mails de carrinho abandonado enviados: {emails_sent}"
