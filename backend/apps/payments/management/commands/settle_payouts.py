"""
Liquida os repasses (Payouts) PENDENTES enviando PIX (Pix Envio) do caixa master
para a chave PIX de cada lojista.

Uso:
  python manage.py settle_payouts          # tenta liquidar todos os pendentes
  python manage.py settle_payouts --dry    # só lista o que está pendente

Pré-requisito no Efí (painel → API → sua aplicação):
  escopo "Enviar PIX" (gn.pix.send) habilitado. Sem ele a API responde
  insufficient_scope e os repasses permanecem PENDENTES (sem erro fatal).
"""
from django.core.management.base import BaseCommand

from apps.payments.models import Payout, PayoutStatus
from apps.payments.processing import settle_pending_payouts


class Command(BaseCommand):
    help = "Liquida repasses pendentes via Pix Envio para a chave do lojista."

    def add_arguments(self, parser):
        parser.add_argument("--dry", action="store_true", help="Apenas lista os pendentes, sem enviar.")

    def handle(self, *args, **opts):
        pendentes = Payout.objects.filter(status=PayoutStatus.PENDING).select_related("seller")
        total = pendentes.count()
        self.stdout.write(f"Repasses pendentes: {total}")

        if opts["dry"]:
            for p in pendentes:
                chave = p.seller.pix_key if p.seller else "(sem lojista)"
                self.stdout.write(f"  - {p.id} | R$ {p.amount} → {chave}")
            return

        if total == 0:
            return

        resumo = settle_pending_payouts()
        self.stdout.write(self.style.SUCCESS(
            f"Processados: {resumo['processados']} | "
            f"Liquidados: {resumo['liquidados']} | Falhas: {resumo['falhas']}"
        ))
        if resumo["falhas"]:
            self.stdout.write(self.style.WARNING(
                "Há falhas. Causa comum: escopo 'Enviar PIX' (gn.pix.send) não "
                "habilitado na aplicação do Efí. Os repasses seguem PENDENTES e "
                "serão reprocessados na próxima execução (envio idempotente)."
            ))
