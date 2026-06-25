"""
Verificação de e-mail de conta.

Usa tokens assinados (django.core.signing) — sem campo extra no banco. O token
carrega o id do usuário e expira em VERIFY_MAX_AGE. A confirmação marca
`email_verified_at`, que é o gate para o usuário abrir uma loja.
"""
import logging

from django.conf import settings
from django.core import signing
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

VERIFY_SALT = "mss-email-verify"
VERIFY_MAX_AGE = 60 * 60 * 48  # 48 horas


def generate_verification_token(user) -> str:
    return signing.dumps({"uid": str(user.pk)}, salt=VERIFY_SALT)


def verify_token(token: str) -> str:
    """
    Retorna o uid do usuário se o token for válido.
    Levanta signing.SignatureExpired ou signing.BadSignature caso contrário.
    """
    data = signing.loads(token, salt=VERIFY_SALT, max_age=VERIFY_MAX_AGE)
    return data["uid"]


def send_verification_email(user) -> bool:
    """Envia o e-mail com o link de confirmação. Retorna True se enviou."""
    token = generate_verification_token(user)
    link = f"{settings.FRONTEND_URL.rstrip('/')}/verificar-email?token={token}"
    first_name = (getattr(user, "first_name", "") or "").strip() or "vendedor(a)"

    subject = "Confirme seu e-mail — MySuperStore"
    text_body = (
        f"Olá, {first_name}!\n\n"
        "Falta só um passo para ativar sua conta na MySuperStore.\n"
        f"Confirme seu e-mail clicando no link abaixo (válido por 48 horas):\n\n"
        f"{link}\n\n"
        "Se você não criou esta conta, ignore esta mensagem.\n\n"
        "Equipe MySuperStore"
    )
    html_body = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ative sua Conta - MySuperStore</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body {{ font-family: 'Inter', Arial, sans-serif; background-color: #0e0e1a; color: #ffffff; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); }}
            .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }}
            .header h1 {{ margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }}
            .content {{ padding: 40px 30px; }}
            .content h2 {{ color: #ffffff; font-size: 22px; margin-top: 0; font-weight: 600; }}
            .content p {{ color: #94a3b8; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }}
            .cta-button {{ display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }}
            .cta-button:hover {{ background: #059669; transform: translateY(-2px); }}
            .benefits {{ background: #0f172a; padding: 24px; border-radius: 12px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.05); }}
            .benefits ul {{ list-style: none; padding: 0; margin: 0; }}
            .benefits li {{ color: #cbd5e1; margin-bottom: 12px; font-size: 15px; display: flex; align-items: center; }}
            .benefits li::before {{ content: '✓'; color: #10b981; font-weight: bold; margin-right: 10px; font-size: 18px; }}
            .footer {{ background: #0b0f19; padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }}
            .footer p {{ color: #64748b; font-size: 13px; margin: 5px 0; }}
            .footer a {{ color: #10b981; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MySuperStore</h1>
            </div>
            <div class="content">
                <h2>Seja bem-vindo(a) ao Futuro do E-commerce, {first_name}! 🚀</h2>
                <p>Estamos muito felizes em ter você conosco. Você acaba de dar o primeiro passo para escalar suas vendas e fazer parte de um marketplace robusto, seguro e inovador.</p>
                
                <div class="benefits">
                    <p style="color: #ffffff; font-weight: 600; margin-bottom: 16px; margin-top: 0;">Por que vender na MySuperStore?</p>
                    <ul>
                        <li><strong>Split de Pagamento Nativo:</strong> Receba sua parte automaticamente no momento da venda (via PIX ou Cartão).</li>
                        <li><strong>Taxas Transparentes:</strong> Sem surpresas. Você sabe exatamente o que paga e o que recebe.</li>
                        <li><strong>Dashboard Poderoso:</strong> Controle total sobre seu estoque, pedidos e relatórios de vendas.</li>
                        <li><strong>Tecnologia de Ponta:</strong> Plataforma ultrarrápida projetada para maximizar sua conversão.</li>
                    </ul>
                </div>

                <p>Para ativar sua conta e desbloquear a criação da sua loja, clique no botão abaixo:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{link}" class="cta-button">Ativar Minha Conta</a>
                </div>

                <p style="font-size: 14px; color: #64748b;">Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                <a href="{link}" style="color: #10b981; word-break: break-all;">{link}</a></p>
                
                <p>Prepare-se para transformar seu negócio.<br><strong>Equipe MySuperStore</strong></p>
            </div>
            <div class="footer">
                <p>Este link expira em 48 horas por questões de segurança.</p>
                <p>Se você não se cadastrou em nossa plataforma, por favor ignore este e-mail.</p>
                <p>&copy; 2026 MySuperStore. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        from_email = settings.DEFAULT_FROM_EMAIL or None
        msg = EmailMultiAlternatives(subject, text_body, from_email, [user.email])
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        return True
    except Exception as exc:  # noqa: BLE001
        logger.error("Falha ao enviar e-mail de verificação para %s: %s", user.email, exc)
        return False
