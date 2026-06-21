import os
import django
import sys
import requests
from django.core.files.base import ContentFile
from decimal import Decimal

# Setup Django Environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.conf import settings
from apps.sellers.models import Seller, SellerStatus
from apps.catalog.models import Category, Brand, Product, ProductImage, ProductVariant

# Forçar Celery a rodar de forma síncrona ignorando Redis local
settings.CELERY_TASK_ALWAYS_EAGER = True

User = get_user_model()

def download_image(url, filename):
    return None

def run_seed():
    print("Iniciando Semente da Loja Nike (Glassdoor) - VERSÃO PREMIUM...")
    
    email = "nike@oficial.com"
    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            "first_name": "Nike",
            "last_name": "Oficial",
            "role": "seller",
            "is_active": True,
            "person_type": "PJ",
            "cpf_cnpj": "00000000000100"
        }
    )
    user.set_password("nike123456")
    user.save()

    brand, _ = Brand.objects.get_or_create(slug="nike", defaults={"name": "Nike"})
    
    if not brand.logo and not brand.external_url:
        brand.external_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png"
        brand.save()

    cat, _ = Category.objects.get_or_create(
        slug="esportes",
        defaults={"name": "Esportes e Lazer", "description": "Tênis, chuteiras e artigos esportivos."}
    )

    seller, _ = Seller.objects.get_or_create(
        slug="nike",
        defaults={
            "user": user,
            "store_name": "Nike Oficial",
            "description": "A vitrine oficial da inovação e da performance. Descubra os lançamentos em tênis, chuteiras da Copa e streetwear.",
            "status": SellerStatus.APPROVED,
            "stripe_onboarding_complete": True
        }
    )
    
    # Atualiza Assets da Loja (Logo e 3 Banners)
    if not seller.logo and not seller.logo_external:
        seller.logo_external = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png"
    
    if not seller.banner and not seller.banner_external:
        seller.banner_external = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=2070"
        
    if not seller.banner2 and not seller.banner2_external:
        seller.banner2_external = "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=2070"
        
    if not seller.banner3 and not seller.banner3_external:
        seller.banner3_external = "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=2070"

    seller.save()

    # Limpar produtos anteriores para evitar duplicações e lixo
    Product.objects.filter(seller=seller).delete()
    print("Produtos antigos da loja removidos para uma vitrine fresca.")

    products_data = [
        {
            "name": "Chuteira Nike Zoom Mercurial Superfly 9 Elite - Copa do Mundo",
            "slug": "chuteira-nike-zoom-mercurial-superfly-9-copa",
            "description": "Edição especial Copa do Mundo. Futebol de elite e esporte com tração máxima para campos de grama natural. Vista o esporte e a paixão.",
            "base_price": "2199.90",
            "promotional_price": "1999.90",
            "is_free_shipping": True,
            "images": [
                "https://images.unsplash.com/photo-1518605368461-1ee71168f8fb?auto=format&fit=crop&q=80&w=1000",
                "https://images.unsplash.com/photo-1584735174965-48c48d4daf27?auto=format&fit=crop&q=80&w=1000"
            ]
        },
        {
            "name": "Camisa Seleção Brasileira Nike Oficial - Esporte e Futebol",
            "slug": "camisa-selecao-brasileira-nike",
            "description": "Camisa oficial para celebrar a Copa do Mundo. Celebre o esporte mais amado com a autêntica camisa de jogo da Nike.",
            "base_price": "349.90",
            "promotional_price": None,
            "is_free_shipping": True,
            "images": [
                "https://images.unsplash.com/photo-1508344928928-7137b29de216?auto=format&fit=crop&q=80&w=1000",
                "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=1000"
            ]
        },
        {
            "name": "Tênis Nike Air Max 270 React Premium",
            "slug": "nike-air-max-270-react-premium",
            "description": "Inspirado nas cores e texturas da arte moderna. Amortecimento visível incomparável para o dia a dia.",
            "base_price": "899.90",
            "promotional_price": "799.90",
            "is_free_shipping": True,
            "images": [
                "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=1000",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000",
                "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=1000"
            ]
        },
        {
            "name": "Tênis Nike Air Force 1 '07",
            "slug": "nike-air-force-1-07",
            "description": "O brilho continua a viver no Nike Air Force 1 '07. A lenda do basquete com um toque de frescor e muito esporte.",
            "base_price": "749.90",
            "promotional_price": None,
            "is_free_shipping": True,
            "images": [
                "https://images.unsplash.com/photo-1584583570840-0a2d81577782?auto=format&fit=crop&q=80&w=1000",
                "https://images.unsplash.com/photo-1584735174965-48c48d4daf27?auto=format&fit=crop&q=80&w=1000"
            ]
        },
        {
            "name": "Tênis Nike ZoomX Vaporfly Esportivo",
            "slug": "nike-zoomx-vaporfly-esportivo",
            "description": "Feito para os dias de corrida. O auge da tecnologia de retorno de energia para alta performance.",
            "base_price": "1499.90",
            "promotional_price": "1299.90",
            "is_free_shipping": True,
            "images": [
                "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=1000",
                "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=1000"
            ]
        }
    ]

    for p_data in products_data:
        prod = Product.objects.create(
            slug=p_data["slug"],
            seller=seller,
            category=cat,
            brand=brand,
            name=p_data["name"],
            description=p_data["description"],
            base_price=Decimal(p_data["base_price"]),
            promotional_price=Decimal(p_data["promotional_price"]) if p_data["promotional_price"] else None,
            is_available=True,
            is_free_shipping=p_data["is_free_shipping"],
            approval_status="approved"
        )
        
        # Promoções (is_on_sale)
        if prod.promotional_price:
            from django.utils import timezone
            from datetime import timedelta
            prod.promo_starts_at = timezone.now() - timedelta(days=1)
            prod.promo_ends_at = timezone.now() + timedelta(days=30)
            prod.save()

        # Variantes de Tamanho
        ProductVariant.objects.create(product=prod, sku=f"SKU-{prod.slug}-39", stock=15)
        ProductVariant.objects.create(product=prod, sku=f"SKU-{prod.slug}-40", stock=50)
        ProductVariant.objects.create(product=prod, sku=f"SKU-{prod.slug}-41", stock=25)
        ProductVariant.objects.create(product=prod, sku=f"SKU-{prod.slug}-42", stock=20)
        
        # Imagens Múltiplas usando external_url
        for idx, img_url in enumerate(p_data["images"]):
            ProductImage.objects.create(
                product=prod,
                external_url=img_url,
                is_primary=(idx == 0),
                order=idx
            )
        print(f"Produto '{prod.name}' semeado com {len(p_data['images'])} imagens.")
    
    print("Semente (Seed) PREMIUM Finalizada com Sucesso! 5 Produtos impecáveis adicionados.")

if __name__ == "__main__":
    run_seed()
