import json
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

# --- WEB PUSH CORE ---

def send_web_push(user, title, message, url="/"):
    """
    Envia uma Notificação Push nativa para todas as subscrições (aparelhos) do usuário.
    """
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning("pywebpush não instalado. Ignorando web push.")
        return

    # VAPID Keys: Devem ser geradas com `npx web-push generate-vapid-keys`
    # Se não houver VAPID keys no settings, não manda
    vapid_private_key = getattr(settings, "VAPID_PRIVATE_KEY", None)
    vapid_admin_email = getattr(settings, "VAPID_ADMIN_EMAIL", "mailto:admin@mysuperstore.com")

    if not vapid_private_key:
        logger.warning("VAPID_PRIVATE_KEY não configurada. Ignorando web push.")
        return

    subscriptions = user.push_subscriptions.all()
    payload = json.dumps({
        "title": title,
        "body": message,
        "url": url,
        "icon": f"{settings.FRONTEND_URL.rstrip('/')}/icon-192x192.png",
        "badge": f"{settings.FRONTEND_URL.rstrip('/')}/badge-72x72.png",
    })

    for sub in subscriptions:
        sub_info = {
            "endpoint": sub.endpoint,
            "keys": {
                "p256dh": sub.p256dh,
                "auth": sub.auth
            }
        }
        try:
            webpush(
                subscription_info=sub_info,
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims={"sub": vapid_admin_email}
            )
        except WebPushException as ex:
            logger.error("Web Push Error: %s", repr(ex))
            # Se for erro 410 (Gone) ou 404, o usuário cancelou a inscrição. Removemos do DB.
            if ex.response and ex.response.status_code in (410, 404):
                sub.delete()

# --- E-MAIL TEMPLATES COMUNS ---

def get_base_html_template(title, content):
    """Retorna o HTML base premium para e-mails."""
    return f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');
            body {{ font-family: 'Outfit', sans-serif; background-color: #050510; color: #f5f5f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #0A0A15; border-radius: 24px; overflow: hidden; border: 1px solid rgba(230, 181, 60, 0.15); }}
            .header {{ background: linear-gradient(135deg, #050510 0%, #100A05 100%); padding: 40px; text-align: center; border-bottom: 1px solid rgba(230, 181, 60, 0.2); }}
            .header h1 {{ margin: 0; color: #E6B53C; font-size: 28px; font-weight: 900; text-transform: uppercase; }}
            .content {{ padding: 40px; }}
            .content h2 {{ color: #ffffff; font-size: 20px; font-weight: 800; }}
            .content p {{ color: #a3a3a3; font-size: 15px; line-height: 1.6; font-weight: 300; }}
            .cta-button {{ display: inline-block; background: linear-gradient(90deg, #E6B53C 0%, #B38F25 100%); color: #000000 !important; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; text-transform: uppercase; margin-top: 20px; }}
            .footer {{ background: #050510; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); color: #525252; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MySuperStore</h1>
            </div>
            <div class="content">
                <h2>{title}</h2>
                {content}
            </div>
            <div class="footer">
                <p>&copy; 2026 MySuperStore. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """

def send_transactional_email(to_email, subject, title, html_content):
    """Função genérica de disparo de e-mail."""
    from_email = settings.DEFAULT_FROM_EMAIL or "no-reply@mysuperstore.com"
    html_body = get_base_html_template(title, html_content)
    text_body = f"{title}\n\nAcesse sua conta para ver os detalhes."
    
    try:
        msg = EmailMultiAlternatives(subject, text_body, from_email, [to_email])
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
    except Exception as exc:
        logger.error("Falha ao enviar e-mail para %s: %s", to_email, exc)


# --- EVENTOS DE NEGÓCIO ---

def notify_order_confirmed_customer(order):
    """Dispara Notificação + E-mail para o COMPRADOR quando o pagamento é aprovado."""
    user = order.user
    title = f"Pagamento Aprovado - Pedido #{order.order_number[-6:]}"
    message = "Seu pagamento foi confirmado! Seus itens já estão sendo preparados."
    
    # 1. E-mail
    html = f"""
        <p>Olá, {user.first_name}!</p>
        <p>O pagamento do seu pedido <strong>#{order.order_number}</strong> foi confirmado com sucesso.</p>
        <p>Acompanhe o status do envio diretamente no seu painel:</p>
        <a href="{settings.FRONTEND_URL.rstrip('/')}/orders" class="cta-button">Ver Meus Pedidos</a>
    """
    send_transactional_email(user.email, title, title, html)
    
    # 2. Push App
    send_web_push(user, "Pagamento Aprovado! 💳", message, url="/orders")


def notify_new_sale_seller(sub_order):
    """Dispara Notificação + E-mail para o LOJISTA quando ele tem uma nova venda."""
    seller_user = sub_order.seller.user
    order_num = sub_order.order.order_number[-6:]
    title = f"Nova Venda! Pedido #{order_num}"
    message = f"Você acabou de vender R$ {sub_order.subtotal}. Separe os produtos!"
    
    # 1. E-mail
    html = f"""
        <p>Parabéns, {sub_order.seller.store_name}!</p>
        <p>Você acaba de receber uma nova venda (Pedido #{sub_order.order.order_number}).</p>
        <p>Total do Lojista: <strong>R$ {sub_order.seller_amount}</strong></p>
        <p>Acesse o painel do lojista para aceitar e enviar os itens:</p>
        <a href="{settings.FRONTEND_URL.rstrip('/')}/seller/dashboard/orders" class="cta-button">Gerenciar Venda</a>
    """
    send_transactional_email(seller_user.email, title, "🎉 " + title, html)
    
    # 2. Push App
    send_web_push(seller_user, "Nova Venda! 🎉", message, url="/seller/dashboard/orders")


def notify_order_status_update(sub_order):
    """Dispara E-mail + Push para o COMPRADOR sobre a mudança de status."""
    user = sub_order.order.user
    order_num = sub_order.order.order_number[-6:]
    
    status_map = {
        "processing": "Separado em Loja",
        "shipped": "Em Rota de Entrega",
        "delivered": "Entregue"
    }
    
    status_str = status_map.get(sub_order.status, sub_order.status)
    title = f"Atualização: Pedido #{order_num}"
    message = f"Seus itens da loja {sub_order.seller.store_name} mudaram para: {status_str}!"
    
    html = f"""
        <p>Olá, {user.first_name}!</p>
        <p>Boas notícias sobre o seu pedido <strong>#{sub_order.order.order_number}</strong>.</p>
        <p>A loja <strong>{sub_order.seller.store_name}</strong> atualizou o status da entrega para: <strong style="color:#E6B53C;">{status_str}</strong>.</p>
        <a href="{settings.FRONTEND_URL.rstrip('/')}/orders" class="cta-button">Acompanhar Entrega</a>
    """
    send_transactional_email(user.email, title, title, html)
    send_web_push(user, f"Pedido {status_str} 📦", message, url="/orders")


def notify_invoice_available(sub_order):
    """Dispara E-mail + Push para o COMPRADOR quando a NF é anexada."""
    user = sub_order.order.user
    order_num = sub_order.order.order_number[-6:]
    title = f"Nota Fiscal Emitida - Pedido #{order_num}"
    message = f"A loja {sub_order.seller.store_name} enviou a Nota Fiscal."
    
    html = f"""
        <p>Olá, {user.first_name}!</p>
        <p>A loja <strong>{sub_order.seller.store_name}</strong> anexou a sua Nota Fiscal para o pedido #{sub_order.order.order_number}.</p>
        <a href="{sub_order.invoice_link}" target="_blank" class="cta-button">Baixar Nota Fiscal (PDF)</a>
    """
    send_transactional_email(user.email, title, title, html)
    send_web_push(user, "Nota Fiscal Disponível 📄", message, url="/orders")
