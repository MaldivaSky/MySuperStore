"""
Migra dados do banco SQLite legado (TCC) para o novo Postgres.

Uso:
  python manage.py shell < scripts/seed_from_legacy.py

O script lê db.sqlite3 na raiz do projeto, cria as categorias e produtos
no novo schema, e copia as imagens para o diretório media/ correto.
"""
import os
import sqlite3
from decimal import Decimal
from pathlib import Path

LEGACY_DB = Path(__file__).resolve().parent.parent / "db.sqlite3"
MEDIA_ROOT = Path(__file__).resolve().parent.parent / "backend" / "media"


def run():
    if not LEGACY_DB.exists():
        print(f"Banco legado não encontrado em {LEGACY_DB}")
        return

    conn = sqlite3.connect(str(LEGACY_DB))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Importar aqui para ter o Django configurado
    from apps.catalog.models import Category, Product, ProductVariant, ProductImage, Attribute, AttributeValue
    from apps.sellers.models import Seller

    # 1. Categorias
    cur.execute("SELECT * FROM categoria_categoria")
    for row in cur.fetchall():
        cat, created = Category.objects.get_or_create(
            slug=row["slug"],
            defaults={
                "name": row["categoria_nome"],
                "description": row["descricao"] or "",
            },
        )
        if created:
            print(f"  Categoria criada: {cat.name}")

    # 2. Produtos (requer ao menos um Seller para associar)
    default_seller = Seller.objects.filter(status="approved").first()
    if not default_seller:
        print("Nenhum vendedor aprovado encontrado. Crie um antes de importar produtos.")
        conn.close()
        return

    cur.execute("""
        SELECT p.*, c.slug AS cat_slug
        FROM store_produto p
        JOIN categoria_categoria c ON p.categoria_id = c.id
    """)
    for row in cur.fetchall():
        category = Category.objects.filter(slug=row["cat_slug"]).first()
        product, created = Product.objects.get_or_create(
            slug=row["slug"],
            defaults={
                "seller": default_seller,
                "category": category,
                "name": row["produto_nome"],
                "description": row["descricao"] or "",
                "base_price": Decimal(str(row["preco"])).quantize(Decimal("0.01")),
                "is_available": bool(row["avaliavel"]),
            },
        )
        if created:
            print(f"  Produto criado: {product.name}")
            # Variante padrão (sem atributos)
            ProductVariant.objects.create(
                product=product,
                sku=f"LEGACY-{row['id']}",
                stock=row["estoque"],
            )

    conn.close()
    print("\nImportação concluída.")


run()
