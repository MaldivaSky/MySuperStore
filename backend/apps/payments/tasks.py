import requests
from celery import shared_task
from django.conf import settings


@shared_task
def settle_pending_payouts_task():
    """
    Job periódico: liquida repasses PENDENTES via Pix Envio.
    Agende no Celery Beat (ex.: a cada 30 min). Envio idempotente (idEnvio = id do
    payout), então repetir é seguro.
    """
    from apps.payments.processing import settle_pending_payouts
    return settle_pending_payouts()


@shared_task(
    bind=True,
    default_retry_delay=60,  # Tenta novamente após 60 segundos
    max_retries=5,           # Limite máximo de retentativas
)
def dispatch_webhook_task(self, payload):
    """
    Tarefa assíncrona para despachar notificações de webhook para ERPs externos.
    Implementa retentativa automática em caso de falhas temporárias na rede ou servidor de destino.
    """
    # URL padrão de mock caso nenhuma URL oficial de ERP esteja configurada nas chaves
    webhook_url = getattr(settings, "EXTERNAL_ERP_WEBHOOK_URL", None) or "https://webhook.site/mock-erp-url"

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "MySuperStore-Webhook/1.0",
    }

    try:
        response = requests.post(webhook_url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as exc:
        try:
            # Re-enfileira a tarefa se falhar por erro HTTP (5xx, 408, etc.) ou Timeout
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            # Registra a falha definitiva (Sentry)
            return f"Falha definitiva ao enviar webhook para {webhook_url} após 5 tentativas."

    return f"Webhook enviado com sucesso para {webhook_url}"
