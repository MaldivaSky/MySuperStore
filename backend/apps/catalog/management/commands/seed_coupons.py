from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Coupon

class Command(BaseCommand):
    help = "Semeia cupons de desconto iniciais (ex: PRIMEIRACOMPRA)"

    def handle(self, *args, **options):
        now = timezone.now()
        
        coupon, created = Coupon.objects.get_or_create(
            code="PRIMEIRACOMPRA",
            defaults={
                "discount_percentage": 10.0,
                "valid_from": now,
                "valid_to": now + timedelta(days=365*5), # 5 anos
                "active": True,
                "is_first_purchase_only": True,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('Cupom PRIMEIRACOMPRA criado com sucesso.'))
        else:
            self.stdout.write(self.style.WARNING('Cupom PRIMEIRACOMPRA já existia.'))
