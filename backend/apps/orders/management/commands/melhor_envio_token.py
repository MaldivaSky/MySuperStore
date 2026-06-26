"""
Obtém/renova o token OAuth do Melhor Envio (Modelo 1 — conta única da plataforma).

Fluxo em 2 passos:

  1) Gera a URL de autorização (você abre no navegador e autoriza):
       python manage.py melhor_envio_token --auth-url

     Após autorizar, o Melhor Envio redireciona para o seu redirect_uri com
     ?code=XXXX na barra de endereço. Copie esse code.

  2) Troca o code por access_token + refresh_token:
       python manage.py melhor_envio_token --code XXXX

Renovação (quando o token expirar, ~30 dias):
       python manage.py melhor_envio_token --refresh <refresh_token>

Pré-requisitos (settings/env):
  MELHOR_ENVIO_ENVIRONMENT (sandbox|production), MELHOR_ENVIO_CLIENT_ID,
  MELHOR_ENVIO_CLIENT_SECRET, MELHOR_ENVIO_REDIRECT_URI.

O token retornado deve ir para a env MELHOR_ENVIO_TOKEN (Railway).
"""
import requests
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

# Escopos necessários para cotar e gerar etiquetas.
SCOPES = "shipping-calculate shipping-checkout shipping-generate shipping-print shipping-tracking cart-read cart-write"


def _base_url():
    if settings.MELHOR_ENVIO_ENVIRONMENT == "sandbox":
        return "https://sandbox.melhorenvio.com.br"
    return "https://www.melhorenvio.com.br"


class Command(BaseCommand):
    help = "Obtém/renova o token OAuth do Melhor Envio (conta única da plataforma)."

    def add_arguments(self, parser):
        parser.add_argument("--auth-url", action="store_true", help="Mostra a URL de autorização para abrir no navegador.")
        parser.add_argument("--code", help="Troca o code (recebido no redirect) por access_token.")
        parser.add_argument("--refresh", help="Renova usando um refresh_token existente.")

    def handle(self, *args, **opts):
        client_id = settings.MELHOR_ENVIO_CLIENT_ID
        client_secret = settings.MELHOR_ENVIO_CLIENT_SECRET
        redirect_uri = settings.MELHOR_ENVIO_REDIRECT_URI
        base = _base_url()

        self.stdout.write(f"Ambiente: {settings.MELHOR_ENVIO_ENVIRONMENT} ({base})")

        if opts["auth_url"]:
            if not (client_id and redirect_uri):
                raise CommandError("Defina MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_REDIRECT_URI.")
            from urllib.parse import urlencode
            qs = urlencode({
                "client_id": client_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": SCOPES,
            })
            self.stdout.write(self.style.SUCCESS("\nAbra esta URL no navegador, autorize, e copie o ?code= do redirect:\n"))
            self.stdout.write(f"{base}/oauth/authorize?{qs}\n")
            return

        if opts["code"] or opts["refresh"]:
            if not (client_id and client_secret):
                raise CommandError("Defina MELHOR_ENVIO_CLIENT_ID e MELHOR_ENVIO_CLIENT_SECRET.")
            if opts["refresh"]:
                payload = {
                    "grant_type": "refresh_token",
                    "refresh_token": opts["refresh"],
                    "client_id": client_id,
                    "client_secret": client_secret,
                }
            else:
                payload = {
                    "grant_type": "authorization_code",
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "code": opts["code"],
                }
            resp = requests.post(
                f"{base}/oauth/token",
                json=payload,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                timeout=30,
            )
            if resp.status_code != 200:
                raise CommandError(f"Falha ({resp.status_code}): {resp.text}")
            data = resp.json()
            self.stdout.write(self.style.SUCCESS("\nToken obtido com sucesso!\n"))
            self.stdout.write(f"  expires_in   : {data.get('expires_in')} s")
            self.stdout.write(self.style.WARNING("\nColoque no Railway:\n"))
            self.stdout.write(f"  MELHOR_ENVIO_TOKEN={data.get('access_token')}\n")
            self.stdout.write(f"\n  Guarde o refresh_token para renovar depois:\n  {data.get('refresh_token')}\n")
            return

        raise CommandError("Use --auth-url, depois --code XXXX (ou --refresh <token>).")
