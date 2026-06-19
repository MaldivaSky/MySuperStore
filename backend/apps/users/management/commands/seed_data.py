"""
Management command: seed_data

Popula o banco com dados iniciais de desenvolvimento:
  - Superusuário admin
  - Seller padrão vinculado ao admin

Uso:
    python manage.py seed_data
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.text import slugify

User = get_user_model()


class Command(BaseCommand):
    help = "Cria dados iniciais de desenvolvimento (admin + seller padrão)"

    def handle(self, *args, **options):
        from apps.sellers.models import Seller, SellerStatus

        # ── Admin ─────────────────────────────────────────────────────────────
        admin, created = User.objects.get_or_create(
            email="admin@mysuperstore.com",
            defaults={
                "first_name": "Admin",
                "last_name": "MySuperStore",
                "role": "admin",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        if created:
            admin.set_password("admin123")
            admin.save(update_fields=["password"])
            self.stdout.write(self.style.SUCCESS("✓ Admin criado: admin@mysuperstore.com / admin123"))
        else:
            self.stdout.write("  Admin já existe.")

        # ── Seller padrão ────────────────────────────────────────────────────
        seller, created = Seller.objects.get_or_create(
            user=admin,
            defaults={
                "store_name": "MySuperStore Oficial",
                "slug": slugify("MySuperStore Oficial"),
                "description": "Loja oficial do marketplace.",
                "status": SellerStatus.APPROVED,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS("✓ Seller padrão criado: MySuperStore Oficial"))
        else:
            self.stdout.write("  Seller padrão já existe.")

        self.stdout.write(self.style.SUCCESS("\n✓ seed_data concluído."))
        self.stdout.write(
            "\nPróximos passos:\n"
            "  make seed-legacy   →  importar produtos do SQLite\n"
            "  make shell         →  explorar dados\n"
        )
