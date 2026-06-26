from decimal import Decimal

from django.db import migrations


def set_default_commission_to_12(apps, schema_editor):
    """
    Alinha lojistas que ainda estão no antigo default de 15% para os novos 12%.
    Só toca quem está EXATAMENTE em 0.1500 — preserva taxas customizadas/negociadas.
    """
    Seller = apps.get_model("sellers", "Seller")
    Seller.objects.filter(commission_rate=Decimal("0.1500")).update(
        commission_rate=Decimal("0.1200")
    )


def revert(apps, schema_editor):
    Seller = apps.get_model("sellers", "Seller")
    Seller.objects.filter(commission_rate=Decimal("0.1200")).update(
        commission_rate=Decimal("0.1500")
    )


class Migration(migrations.Migration):

    dependencies = [
        ("sellers", "0015_alter_seller_commission_rate"),
    ]

    operations = [
        migrations.RunPython(set_default_commission_to_12, revert),
    ]
