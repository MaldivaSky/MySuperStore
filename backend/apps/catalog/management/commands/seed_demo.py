"""
Seed completo do MySuperStore.

  docker compose exec api python manage.py seed_demo
  docker compose exec api python manage.py seed_demo --reset          # recria tudo
  docker compose exec api python manage.py seed_demo --skip-images    # sem download
"""
import random
import tempfile
import uuid
from decimal import Decimal
from datetime import timedelta

import requests
from django.core.files import File
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

# ---------------------------------------------------------------------------
# Dados fixos
# ---------------------------------------------------------------------------

DUMMYJSON_URL = "https://dummyjson.com/products?limit=100"

CATEGORY_MAP = {
    "smartphones":        ("Eletronicos",       "eletronicos",       "smartphones"),
    "laptops":            ("Eletronicos",       "eletronicos",       "notebooks-laptops"),
    "tablets":            ("Eletronicos",       "eletronicos",       "tablets"),
    "mobile-accessories": ("Eletronicos",       "eletronicos",       "acessorios-mobile"),
    "mens-shirts":        ("Moda Masculina",    "moda-masculina",    "camisas-masc"),
    "mens-shoes":         ("Moda Masculina",    "moda-masculina",    "calcados-masc"),
    "mens-watches":       ("Moda Masculina",    "moda-masculina",    "relogios-masc"),
    "sunglasses":         ("Moda Masculina",    "moda-masculina",    "oculos-sol"),
    "womens-dresses":     ("Moda Feminina",     "moda-feminina",     "vestidos"),
    "tops":               ("Moda Feminina",     "moda-feminina",     "blusas-tops"),
    "womens-bags":        ("Moda Feminina",     "moda-feminina",     "bolsas"),
    "womens-shoes":       ("Moda Feminina",     "moda-feminina",     "calcados-fem"),
    "womens-watches":     ("Moda Feminina",     "moda-feminina",     "relogios-fem"),
    "womens-jewellery":   ("Moda Feminina",     "moda-feminina",     "joias"),
    "beauty":             ("Beleza e Saude",    "beleza-saude",      "maquiagem"),
    "fragrances":         ("Beleza e Saude",    "beleza-saude",      "perfumes"),
    "skin-care":          ("Beleza e Saude",    "beleza-saude",      "cuidados-pele"),
    "furniture":          ("Casa e Decoracao",  "casa-decoracao",    "moveis"),
    "home-decoration":    ("Casa e Decoracao",  "casa-decoracao",    "decoracao"),
    "kitchen-accessories":("Casa e Decoracao",  "casa-decoracao",    "cozinha"),
    "sports-accessories": ("Esporte e Lazer",   "esporte-lazer",     "acessorios-esporte"),
    "motorcycle":         ("Esporte e Lazer",   "esporte-lazer",     "motos"),
    "vehicle":            ("Esporte e Lazer",   "esporte-lazer",     "veiculos"),
    "groceries":          ("Mercado",           "mercado",           "alimentos"),
}

SELLERS = [
    dict(email="tech_seller@mysuperstore.com", first_name="Ricardo", last_name="Alves",
         phone="11987654321", store_name="TechStore Brasil", slug="techstore-brasil",
         description="Os melhores eletronicos e gadgets com garantia e suporte tecnico.",
         pix_key="tech@mysuperstore.com", commission_rate="0.1000",
         cats={"eletronicos"}),
    dict(email="fashion_seller@mysuperstore.com", first_name="Camila", last_name="Rocha",
         phone="21976543210", store_name="Moda by Camila", slug="moda-by-camila",
         description="Tendencias da moda nacional e internacional com muito estilo.",
         pix_key="fashion@mysuperstore.com", commission_rate="0.1200",
         cats={"moda-masculina", "moda-feminina"}),
    dict(email="home_seller@mysuperstore.com", first_name="Fernando", last_name="Souza",
         phone="31965432109", store_name="Casa e Cia", slug="casa-e-cia",
         description="Tudo para sua casa ficar ainda mais bonita e funcional.",
         pix_key="casaecia@pix.com", commission_rate="0.1500",
         cats={"casa-decoracao", "beleza-saude", "mercado", "esporte-lazer"}),
]

CUSTOMERS = [
    dict(email="joao.silva@gmail.com", first_name="Joao", last_name="Silva",
         phone="11912345678", cep="01310100", logradouro="Av. Paulista",
         numero="1578", bairro="Bela Vista", cidade="Sao Paulo", uf="SP"),
    dict(email="maria.santos@hotmail.com", first_name="Maria", last_name="Santos",
         phone="21923456789", cep="20040020", logradouro="Av. Rio Branco",
         numero="200", bairro="Centro", cidade="Rio de Janeiro", uf="RJ"),
    dict(email="pedro.costa@outlook.com", first_name="Pedro", last_name="Costa",
         phone="31934567890", cep="30112000", logradouro="Av. Afonso Pena",
         numero="4000", bairro="Funcionarios", cidade="Belo Horizonte", uf="MG"),
    dict(email="ana.oliveira@yahoo.com", first_name="Ana", last_name="Oliveira",
         phone="41945678901", cep="80010040", logradouro="R. XV de Novembro",
         numero="700", bairro="Centro", cidade="Curitiba", uf="PR"),
    dict(email="lucas.ferreira@gmail.com", first_name="Lucas", last_name="Ferreira",
         phone="51956789012", cep="90010280", logradouro="Av. Borges de Medeiros",
         numero="500", bairro="Centro Historico", cidade="Porto Alegre", uf="RS"),
]

REVIEWS = [
    ("Produto incrivel, superou expectativas!", "Comprei ha 2 semanas e estou muito satisfeito. Recomendo!"),
    ("Excelente custo-beneficio", "Qualidade acima do esperado pelo preco. Entrega super rapida."),
    ("Chegou antes do prazo!", "Embalagem perfeita, produto identico a foto. Nota maxima."),
    ("Recomendo muito", "Segundo produto que compro desta loja. Nunca decepciona."),
    ("Material de qualidade", "Usou e aprovou. Resistente e com acabamento impecavel."),
    ("Perfeito para presentear", "Comprei para presente e a pessoa adorou. Voltarei a comprar."),
    ("Satisfeito com a compra", "Produto conforme anunciado. Vendedor atencioso."),
]

CLOTHING = {"mens-shirts", "tops", "womens-dresses", "womens-bags"}

# ---------------------------------------------------------------------------

class Command(BaseCommand):
    help = "Seed completo: admin, vendedores, clientes, produtos, pedidos, cupons"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true",
                            help="Remove dados demo e recria do zero")
        parser.add_argument("--skip-images", action="store_true",
                            help="Pula download de imagens (mais rapido)")

    def handle(self, *args, **options):
        self.skip_images = options["skip_images"]

        if options["reset"]:
            self._reset()

        self.ok("Usuarios e sellers...")
        admin = self._upsert_admin()
        sellers = self._upsert_sellers()

        self.ok("Clientes com telefone e endereco...")
        customers = self._upsert_customers()

        self.ok("Hierarquia de categorias...")
        cat_map = self._build_categories()

        self.ok("Banners da vitrine...")
        self._build_banners()

        self.ok("Produtos DummyJSON + variantes + reviews + flash sales...")
        products, variants = self._import_products(sellers, cat_map, customers)

        self.ok("Cupons de desconto...")
        self._build_coupons(sellers)

        self.ok("Pedidos de demonstracao...")
        self._build_orders(customers, variants)

        self._print_summary()

    # -----------------------------------------------------------------------
    # Utils
    # -----------------------------------------------------------------------

    def ok(self, msg):
        self.stdout.write(f"  -> {msg}")

    def _reset(self):
        from apps.users.models import User
        from apps.catalog.models import Banner
        demo = [s["email"] for s in SELLERS] + [c["email"] for c in CUSTOMERS]
        User.objects.filter(email__in=demo).delete()
        Banner.objects.all().delete()
        self.ok("Reset concluido.")

    # -----------------------------------------------------------------------
    # Usuarios
    # -----------------------------------------------------------------------

    def _upsert_admin(self):
        from apps.users.models import User
        from apps.sellers.models import Seller, SellerStatus
        user, created = User.objects.get_or_create(
            email="admin@mysuperstore.com",
            defaults=dict(first_name="Admin", last_name="MySuperStore",
                          phone="11999999999", role="admin",
                          is_active=True, is_staff=True, is_superuser=True),
        )
        if created:
            user.set_password("admin123")
            user.save()
        Seller.objects.get_or_create(
            user=user,
            defaults=dict(store_name="MySuperStore Oficial", slug="mysuperstore-oficial",
                          description="Loja oficial do marketplace.",
                          status=SellerStatus.APPROVED, commission_rate="0.0000",
                          pix_key="admin@mysuperstore.com"),
        )
        return user

    def _upsert_sellers(self):
        from apps.users.models import User
        from apps.sellers.models import Seller, SellerStatus
        result = []
        for s in SELLERS:
            user, created = User.objects.get_or_create(
                email=s["email"],
                defaults=dict(first_name=s["first_name"], last_name=s["last_name"],
                              phone=s["phone"], role="seller", is_active=True),
            )
            if created:
                user.set_password("seller123")
                user.save()
            seller, _ = Seller.objects.get_or_create(
                user=user,
                defaults=dict(store_name=s["store_name"], slug=s["slug"],
                              description=s["description"], status=SellerStatus.APPROVED,
                              commission_rate=s["commission_rate"], pix_key=s["pix_key"]),
            )
            result.append((seller, s["cats"]))
        return result

    def _upsert_customers(self):
        from apps.users.models import User, Address
        result = []
        for c in CUSTOMERS:
            user, created = User.objects.get_or_create(
                email=c["email"],
                defaults=dict(first_name=c["first_name"], last_name=c["last_name"],
                              phone=c["phone"], role="customer", is_active=True),
            )
            if created:
                user.set_password("cliente123")
                user.save()
                Address.objects.create(
                    user=user, label="Casa",
                    recipient_name=f"{c['first_name']} {c['last_name']}",
                    cep=c["cep"], logradouro=c["logradouro"], numero=c["numero"],
                    bairro=c["bairro"], cidade=c["cidade"], uf=c["uf"], is_default=True,
                )
            result.append(user)
        return result

    # -----------------------------------------------------------------------
    # Categorias
    # -----------------------------------------------------------------------

    def _build_categories(self):
        from apps.catalog.models import Category
        parents = {}
        children = {}
        order = 1
        for dj_cat, (parent_name, parent_slug, child_slug) in CATEGORY_MAP.items():
            if parent_slug not in parents:
                p, _ = Category.objects.get_or_create(
                    slug=parent_slug,
                    defaults=dict(name=parent_name, order=order, is_active=True),
                )
                parents[parent_slug] = p
                order += 1
            parent = parents[parent_slug]
            child_name = dj_cat.replace("-", " ").title()
            c, _ = Category.objects.get_or_create(
                slug=child_slug,
                defaults=dict(name=child_name, parent=parent, is_active=True),
            )
            children[dj_cat] = c
        return children

    # -----------------------------------------------------------------------
    # Banners
    # -----------------------------------------------------------------------

    def _build_banners(self):
        from apps.catalog.models import Banner
        if Banner.objects.exists():
            return
        banners = [
            dict(title="Eletronicos com ate 40% OFF",
                 subtitle="Os melhores gadgets pelo melhor preco",
                 cta_text="Ver Ofertas", link_url="/store/promotions", order=1, active=True),
            dict(title="Nova Colecao Feminina",
                 subtitle="Tendencias que chegaram para ficar",
                 cta_text="Explorar", link_url="/store?category=moda-feminina", order=2, active=True),
            dict(title="Venda na MySuperStore",
                 subtitle="Cadastre sua loja em menos de 5 minutos",
                 cta_text="Quero Vender", link_url="/seller/register", order=3, active=True),
        ]
        for b in banners:
            Banner.objects.create(**b)

    # -----------------------------------------------------------------------
    # Produtos
    # -----------------------------------------------------------------------

    def _import_products(self, sellers_with_cats, cat_map, customers):
        from apps.catalog.models import (
            Attribute, AttributeValue, Brand, Product,
            ProductImage, ProductVariant, ReviewRating,
        )

        # Atributos de variante
        size_attr, _ = Attribute.objects.get_or_create(name="Tamanho")
        sizes = {s: AttributeValue.objects.get_or_create(attribute=size_attr, value=s)[0]
                 for s in ["P", "M", "G", "GG"]}

        try:
            data = requests.get(DUMMYJSON_URL, timeout=15).json().get("products", [])
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"  ! DummyJSON offline: {e}"))
            return [], []

        all_products, all_variants = [], []
        flash_count = 0

        for p in data:
            dj_cat = p.get("category", "groceries")
            seller = self._pick_seller(dj_cat, sellers_with_cats)
            category = cat_map.get(dj_cat)

            brand_name = (p.get("brand") or "Sem Marca").strip()[:100]
            brand = Brand.objects.filter(name=brand_name).first()
            if not brand:
                brand_slug = slugify(brand_name)[:110] or "sem-marca"
                if Brand.objects.filter(slug=brand_slug).exists():
                    brand_slug = f"{brand_slug}-{brand_name[:4].lower()}"
                brand = Brand.objects.create(name=brand_name, slug=brand_slug)

            title = p.get("title", "Produto")
            base_price = Decimal(str(round(p.get("price", 10.0) * 5.5, 2)))
            slug = self._unique_slug(slugify(title))

            product, created = Product.objects.get_or_create(
                slug=slug,
                defaults=dict(
                    name=title,
                    description=p.get("description", ""),
                    base_price=base_price,
                    category=category,
                    brand=brand,
                    seller=seller,
                    is_available=True,
                    approval_status="approved",
                    meta_title=title[:70],
                    meta_description=p.get("description", "")[:160],
                ),
            )

            if not created:
                all_products.append(product)
                continue

            # Imagem principal
            if not self.skip_images:
                self._save_image(product, p.get("thumbnail"), primary=True)

            # Variantes
            if dj_cat in CLOTHING:
                for key, attr_val in sizes.items():
                    sku = self._safe_sku(f"{slug[:50]}-{key}")
                    v = ProductVariant.objects.create(
                        product=product, sku=sku,
                        price=base_price + Decimal(random.choice([-10, 0, 10, 20])),
                        stock=random.randint(5, 50), is_active=True,
                    )
                    v.attributes.set([attr_val])
                    all_variants.append(v)
            else:
                sku = self._safe_sku(f"{slug[:80]}-std")
                v = ProductVariant.objects.create(
                    product=product, sku=sku,
                    price=None, stock=random.randint(3, 30), is_active=True,
                )
                all_variants.append(v)

            # Flash sale (15 produtos)
            if flash_count < 15 and random.random() < 0.18:
                disc = Decimal(random.choice(["0.10", "0.15", "0.20", "0.30", "0.40", "0.50"]))
                product.promotional_price = (base_price * (1 - disc)).quantize(Decimal("0.01"))
                product.promo_starts_at = timezone.now() - timedelta(hours=2)
                product.promo_ends_at = timezone.now() + timedelta(hours=random.randint(4, 72))
                product.save(update_fields=["promotional_price", "promo_starts_at", "promo_ends_at"])
                flash_count += 1

            # Reviews (40% dos produtos)
            if customers and random.random() < 0.40:
                reviewer = random.choice(customers)
                if not ReviewRating.objects.filter(product=product, user=reviewer).exists():
                    subj, body = random.choice(REVIEWS)
                    ReviewRating.objects.create(
                        product=product, user=reviewer,
                        rating=Decimal(random.choice(["3.5", "4.0", "4.5", "5.0"])),
                        subject=subj, body=body, status="approved",
                    )

            all_products.append(product)

        self.ok(f"{len(all_products)} produtos | {flash_count} flash sales | {len(all_variants)} variantes")
        return all_products, all_variants

    def _pick_seller(self, dj_cat, sellers_with_cats):
        _, _, parent_slug = CATEGORY_MAP.get(dj_cat, ("", "mercado", ""))
        # pega a segunda coluna (parent_slug)
        parent_slug = CATEGORY_MAP.get(dj_cat, ("", "mercado", ""))[1]
        for seller, cats in sellers_with_cats:
            if parent_slug in cats:
                return seller
        return sellers_with_cats[hash(dj_cat) % len(sellers_with_cats)][0]

    def _unique_slug(self, base):
        from apps.catalog.models import Product
        slug, n = base[:255], 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base[:250]}-{n}"
            n += 1
        return slug

    def _safe_sku(self, raw):
        return raw.upper().replace("-", "_").replace(" ", "_")[:100]

    def _save_image(self, product, url, primary=False):
        from apps.catalog.models import ProductImage
        if not url:
            return
        try:
            r = requests.get(url, timeout=10)
            r.raise_for_status()
            ext = url.rsplit(".", 1)[-1][:4] or "jpg"
            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                tmp.write(r.content)
                path = tmp.name
            with open(path, "rb") as f:
                img = ProductImage(product=product, is_primary=primary, order=1)
                img.image.save(f"{product.slug}.{ext}", File(f), save=True)
        except Exception:
            pass  # imagem nao e critica

    # -----------------------------------------------------------------------
    # Cupons
    # -----------------------------------------------------------------------

    def _build_coupons(self, sellers_with_cats):
        from apps.orders.models import Coupon
        now = timezone.now()
        coupons = [
            dict(code="BEMVINDO10", discount_percentage="10.00",
                 valid_from=now, valid_to=now + timedelta(days=365), active=True),
            dict(code="FRETE20", discount_amount="20.00",
                 valid_from=now, valid_to=now + timedelta(days=180), active=True),
            dict(code="TECH20", discount_percentage="20.00",
                 seller=sellers_with_cats[0][0],
                 valid_from=now, valid_to=now + timedelta(days=90), active=True),
        ]
        for c in coupons:
            code = c.pop("code")
            Coupon.objects.get_or_create(code=code, defaults=c)

    # -----------------------------------------------------------------------
    # Pedidos
    # -----------------------------------------------------------------------

    def _build_orders(self, customers, variants):
        from apps.orders.models import Order, SubOrder, OrderItem
        statuses = ["confirmed", "processing", "shipped", "delivered", "cancelled"]
        active_variants = [v for v in variants if v.pk]

        if not customers or not active_variants:
            return

        for i, customer in enumerate(customers[:3]):
            addr = customer.addresses.first()
            if not addr:
                continue

            picked = random.sample(active_variants, min(3, len(active_variants)))
            subtotal = sum(
                (Decimal(str(v.product.current_price)) for v in picked),
                Decimal("0"),
            )

            order = Order.objects.create(
                user=customer,
                order_number=f"MSS{timezone.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:6].upper()}",
                address_recipient=addr.recipient_name,
                address_cep=addr.cep,
                address_logradouro=addr.logradouro,
                address_numero=addr.numero,
                address_bairro=addr.bairro,
                address_cidade=addr.cidade,
                address_uf=addr.uf,
                subtotal=subtotal,
                shipping=Decimal("15.90"),
                total=subtotal + Decimal("15.90"),
                status=statuses[i % len(statuses)],
            )

            # Agrupa itens por vendedor (SubOrder)
            by_seller = {}
            for v in picked:
                by_seller.setdefault(v.product.seller, []).append(v)

            for seller, svariants in by_seller.items():
                seller_sub = sum(
                    (Decimal(str(v.product.current_price)) for v in svariants),
                    Decimal("0"),
                )
                commission_rate = Decimal(str(seller.commission_rate))
                comm = (seller_sub * commission_rate).quantize(Decimal("0.01"))
                sub = SubOrder.objects.create(
                    order=order, seller=seller,
                    subtotal=seller_sub, commission=comm,
                    seller_amount=seller_sub - comm, status=order.status,
                )
                for v in svariants:
                    price = Decimal(str(v.product.current_price))
                    OrderItem.objects.create(
                        sub_order=sub, variant=v,
                        product_name=v.product.name, variant_sku=v.sku,
                        variant_attributes={}, quantity=1,
                        unit_price=price, total=price,
                    )

    # -----------------------------------------------------------------------
    # Resumo
    # -----------------------------------------------------------------------

    def _print_summary(self):
        from apps.users.models import User
        from apps.sellers.models import Seller
        from apps.catalog.models import Product, ReviewRating, Banner
        from apps.orders.models import Order

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 52))
        self.stdout.write(self.style.SUCCESS("  MYSUPERSTORE - SEED DEMO CONCLUIDO"))
        self.stdout.write(self.style.SUCCESS("=" * 52))
        self.stdout.write(f"  Usuarios:     {User.objects.count()} total")
        self.stdout.write(f"  Clientes:     {User.objects.filter(role='customer').count()}")
        self.stdout.write(f"  Vendedores:   {Seller.objects.filter(status='approved').count()} aprovados")
        self.stdout.write(f"  Produtos:     {Product.objects.filter(is_available=True).count()} disponiveis")
        self.stdout.write(f"  Flash Sales:  {Product.objects.filter(promotional_price__isnull=False).count()}")
        self.stdout.write(f"  Reviews:      {ReviewRating.objects.filter(status='approved').count()}")
        self.stdout.write(f"  Pedidos:      {Order.objects.count()}")
        self.stdout.write(f"  Banners:      {Banner.objects.count()}")
        self.stdout.write(self.style.SUCCESS("=" * 52))
        self.stdout.write(self.style.SUCCESS("\n  CREDENCIAIS:"))
        self.stdout.write("  Admin:     admin@mysuperstore.com    / admin123")
        self.stdout.write("  Vendedor:  tech_seller@mysuperstore.com / seller123")
        self.stdout.write("  Cliente:   joao.silva@gmail.com      / cliente123")
        self.stdout.write(self.style.SUCCESS("=" * 52 + "\n"))

