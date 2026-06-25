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
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <h2 style="color:#B38F25">Confirme seu e-mail</h2>
      <p>Olá, <strong>{first_name}</strong>! Falta só um passo para ativar sua conta na
      <strong>MySuperStore</strong>.</p>
      <p>
        <a href="{link}"
           style="display:inline-block;background:#E6B53C;color:#000;font-weight:bold;
                  padding:14px 28px;border-radius:10px;text-decoration:none">
          Confirmar meu e-mail
        </a>
      </p>
      <p style="font-size:12px;color:#666">O link expira em 48 horas. Se o botão não funcionar,
      copie e cole no navegador:<br><span style="word-break:break-all">{link}</span></p>
      <p style="font-size:12px;color:#666">Se você não criou esta conta, ignore esta mensagem.</p>
    </div>
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
