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
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&display=swap');
            body {{ font-family: 'Outfit', sans-serif; background-color: #050510; color: #f5f5f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
            .container {{ max-width: 600px; margin: 40px auto; background: #0A0A15; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8); border: 1px solid rgba(230, 181, 60, 0.15); }}
            .header {{ background: linear-gradient(135deg, #050510 0%, #100A05 100%); padding: 50px 40px; text-align: center; border-bottom: 1px solid rgba(230, 181, 60, 0.2); position: relative; overflow: hidden; }}
            .header::before {{ content: ''; position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(230, 181, 60, 0.1); filter: blur(40px); border-radius: 50%; }}
            .header h1 {{ margin: 0; color: #E6B53C; font-size: 32px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; }}
            .content {{ padding: 50px 40px; }}
            .content h2 {{ color: #ffffff; font-size: 24px; margin-top: 0; font-weight: 800; line-height: 1.3; }}
            .content p {{ color: #a3a3a3; font-size: 16px; line-height: 1.7; margin-bottom: 30px; font-weight: 300; }}
            .cta-button {{ display: inline-block; background: linear-gradient(90deg, #E6B53C 0%, #B38F25 100%); color: #000000 !important; text-decoration: none; padding: 18px 40px; border-radius: 14px; font-weight: 800; font-size: 16px; text-align: center; transition: all 0.3s ease; box-shadow: 0 10px 25px rgba(230, 181, 60, 0.25); text-transform: uppercase; letter-spacing: 0.5px; }}
            .cta-button:hover {{ transform: translateY(-2px); box-shadow: 0 15px 30px rgba(230, 181, 60, 0.4); }}
            .benefits {{ background: #0e0e1a; padding: 30px; border-radius: 16px; margin-bottom: 40px; border: 1px solid rgba(255,255,255,0.03); }}
            .benefits p.title {{ color: #E6B53C; font-weight: 800; margin-bottom: 20px; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }}
            .benefits ul {{ list-style: none; padding: 0; margin: 0; }}
            .benefits li {{ color: #d4d4d4; margin-bottom: 16px; font-size: 15px; display: flex; align-items: flex-start; line-height: 1.5; font-weight: 400; }}
            .benefits li::before {{ content: '✦'; color: #E6B53C; font-weight: 900; margin-right: 12px; font-size: 16px; }}
            .benefits li strong {{ color: #ffffff; font-weight: 600; }}
            .footer {{ background: #050510; padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); }}
            .footer p {{ color: #525252; font-size: 12px; margin: 5px 0; font-weight: 300; }}
            .footer a {{ color: #E6B53C; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>MySuperStore</h1>
            </div>
            <div class="content">
                <h2>O futuro do seu E-commerce começa agora, {first_name}. 🚀</h2>
                <p>Nós não criamos apenas um marketplace; construímos uma máquina de vendas de alta performance. Estamos prontos para escalar o seu negócio de forma segura, inteligente e sem fricções.</p>
                
                <div class="benefits">
                    <p class="title">O que aguarda você</p>
                    <ul>
                        <li><strong>Split Nativo Efí Bank:</strong> Divisão automática no PIX e Cartão. Receba exatamente o que é seu na hora da venda, direto na sua conta.</li>
                        <li><strong>Booster Algorítmico:</strong> Ferramentas nativas de Ofertas Relâmpago e ranqueamento inteligente para explodir suas conversões.</li>
                        <li><strong>Painel Lojista:</strong> Controle financeiro, métricas avançadas e gestão de produtos com UI imersiva e responsiva.</li>
                    </ul>
                </div>

                <p style="text-align: center; margin-bottom: 40px; color: #e5e5e5; font-weight: 600;">
                    Para validar sua identidade e destravar todas as ferramentas, confirme seu e-mail:
                </p>
                
                <div style="text-align: center; margin-bottom: 40px;">
                    <a href="{link}" class="cta-button">Ativar Minha Conta Agora</a>
                </div>

                <p style="font-size: 13px; color: #737373; text-align: center;">
                    Se o botão não funcionar, copie este link:<br>
                    <a href="{link}" style="color: #E6B53C; word-break: break-all; margin-top: 5px; display: inline-block;">{link}</a>
                </p>
            </div>
            <div class="footer">
                <p>Este link é exclusivo para você e expira em 48 horas.</p>
                <p>Se você não solicitou acesso, por favor desconsidere este e-mail.</p>
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
