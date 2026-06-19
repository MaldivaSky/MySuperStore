"""
Management command: seed_from_legacy

Importa categorias e produtos do banco SQLite legado (TCC) para o Postgres.

Uso:
    python manage.py seed_from_legacy
    python manage.py seed_from_legacy --db /caminho/para/db.sqlite3
    python manage.py seed_from_legacy --dry-run
"""
import sqlite3
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify


class Command(BaseCommand):
    help = "Importa dados do banco SQLite legado para o novo Postgres"

    def add_arguments(self, parser):
        parser.add_argument(
            "--db",
            type=str,
            default=None,
            help="Caminho para o db.sqlite3 legado (padrão: raiz do projeto)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula a importação sem salvar no banco",
        )

    def handle(self, *args, **options):
        from apps.catalog.models import Category, Product, ProductVariant
        from apps.sellers.models import Seller

        db_path = Path(options["db"]) if options["db"] else settings.BASE_DIR.parent / "db.sqlite3"

        if not db_path.exists():
            raise CommandError(f"Banco legado não encontrado em: {db_path}")

        dry_run = options["dry_run"]
        if dry_run:
            self.stdout.write(self.style.WARNING("⚠  Modo dry-run — nada será salvo.\n"))

        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        # ── 1. Categorias ─────────────────────────────────────────────────────
        self.stdout.write("Importando categorias...")
        cat_count = 0
        try:
            cur.execute("SELECT * FROM categoria_categoria")
            for row in cur.fetchall():
                slug = row["slug"] if "slug" in row.keys() else slugify(row["categoria_nome"])
                if not dry_run:
                    _, created = Category.objects.get_or_create(
                        slug=slug,
                        defaults={
                            "name": row["categoria_nome"],
                            "description": row["descricao"] or "",
                        },
                    )
                    if created:
                        cat_count += 1
                else:
                    cat_count += 1
        except sqlite3.OperationalError as e:
            self.stdout.write(self.style.WARNING(f"  Tabela categoria_categoria não encontrada: {e}"))

        self.stdout.write(self.style.SUCCESS(f"  {cat_count} categorias {'encontradas' if dry_run else 'criadas'}."))

        # ── 2. Produtos ───────────────────────────────────────────────────────
        self.stdout.write("Importando produtos...")

        default_seller = Seller.objects.filter(status="approved").first()
        if not default_seller and not dry_run:
            self.stdout.write(
                self.style.ERROR(
                    "Nenhum vendedor com status=approved encontrado.\n"
                    "Crie um vendedor aprovado primeiro:\n"
                    "  make superuser  →  acesse /admin  →  crie Seller com status=approved"
                )
            )
            conn.close()
            return

        prod_count = 0
        try:
            cur.execute("""
                SELECT p.*, c.slug AS cat_slug
                FROM store_produto p
                JOIN categoria_categoria c ON p.categoria_id = c.id
            """)
            for row in cur.fetchall():
                slug = row["slug"] if "slug" in row.keys() else slugify(row["produto_nome"])
                price = Decimal(str(row["preco"])).quantize(Decimal("0.01"))

                if not dry_run:
                    category = Category.objects.filter(slug=row["cat_slug"]).first()
                    product, created = Product.objects.get_or_create(
                        slug=slug,
                        defaults={
                            "seller": default_seller,
                            "category": category,
                            "name": row["produto_nome"],
                            "description": row["descricao"] or "",
                            "base_price": price,
                            "is_available": bool(row["avaliavel"]) if "avaliavel" in row.keys() else True,
                        },
                    )
                    if created:
                        sku = f"LEGACY-{row['id']}"
                        stock = row["estoque"] if "estoque" in row.keys() else 0
                        ProductVariant.objects.create(product=product, sku=sku, stock=stock)
                        prod_count += 1
                else:
                    self.stdout.write(f"  [dry-run] {row['produto_nome']} — R$ {price}")
                    prod_count += 1

        except sqlite3.OperationalError as e:
            self.stdout.write(self.style.WARNING(f"  Tabela store_produto não encontrada: {e}"))

        self.stdout.write(self.style.SUCCESS(f"  {prod_count} produtos {'encontrados' if dry_run else 'criados'}."))
        conn.close()

        self.stdout.write(self.style.SUCCESS("\n✓ Importação concluída."))
