"""
Registra (ou consulta) a URL do webhook PIX no Efí para a chave recebedora.

Uso:
  python manage.py register_efi_webhook --url https://SEU-BACKEND/api/v1/payments/efi-webhook/
  python manage.py register_efi_webhook --show      # só consulta o que está configurado

Pré-requisitos no Efí (painel → API → sua aplicação de Produção):
  escopos "Alterar Webhooks" (webhook.write) e "Consultar cobranças" (cob.read).
"""
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from apps.payments.services import EfiPixService


class Command(BaseCommand):
    help = "Registra a URL do webhook PIX do Efí na chave recebedora."

    def add_arguments(self, parser):
        parser.add_argument("--url", help="URL pública do endpoint efi-webhook/ do backend.")
        parser.add_argument("--show", action="store_true", help="Apenas mostra o webhook atual.")

    def handle(self, *args, **opts):
        if not EfiPixService.is_configured():
            raise CommandError(
                "Efí PIX não configurado. Verifique EFI_ENV, EFI_PIX_CLIENT_ID/SECRET, "
                "EFI_PIX_CERT_BASE64 (ou _CERT_PATH) e EFI_PIX_KEY."
            )

        self.stdout.write(f"Ambiente: {'PRODUÇÃO' if not settings.EFI_SANDBOX else 'sandbox'}")
        self.stdout.write(f"Chave PIX: {settings.EFI_PIX_KEY}")

        if opts["show"]:
            try:
                resp = EfiPixService.detail_webhook()
                self.stdout.write(self.style.SUCCESS(f"Webhook atual: {resp}"))
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f"Nenhum webhook ou erro ao consultar: {exc}"))
            return

        url = opts["url"]
        if not url:
            raise CommandError("Informe --url https://SEU-BACKEND/api/v1/payments/efi-webhook/")

        self.stdout.write(f"Registrando webhook: {url}")
        try:
            resp = EfiPixService.config_webhook(url)
        except Exception as exc:
            raise CommandError(f"Falha ao registrar webhook: {exc}")

        # O Efí responde com o objeto do webhook (ou vazio + 200/201) em caso de sucesso.
        self.stdout.write(self.style.SUCCESS(f"OK! Resposta do Efí: {resp}"))
        self.stdout.write(
            "Pronto. Faça um PIX real de teste — o pedido deve confirmar sozinho "
            "e o extrato sai por e-mail."
        )
