import os
import django
import sys
import random
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import Notification, UserRole
from apps.sellers.models import Seller
from apps.catalog.models import Category, Product, ProductVariant, ReviewRating, Attribute, AttributeValue
from apps.orders.models import Order, SubOrder, OrderItem, OrderStatus, Coupon
from apps.sellers.models import ChatRoom, ChatMessage

User = get_user_model()

def clean_db():
    print("🧹 Limpando o banco de dados...")
    # Delete dependents first to avoid ProtectedError
    from apps.payments.models import Payment, CommissionEntry, Payout
    
    Payment.objects.all().delete()
    Payout.objects.all().delete()
    CommissionEntry.objects.all().delete()
    OrderItem.objects.all().delete()
    SubOrder.objects.all().delete()
    Order.objects.all().delete()
    Coupon.objects.all().delete()
    
    ProductVariant.objects.all().delete()
    Product.objects.all().delete()
    Category.objects.all().delete()
    AttributeValue.objects.all().delete()
    Attribute.objects.all().delete()
    Seller.objects.all().delete()
    User.objects.exclude(is_superuser=True).delete()
    ChatRoom.objects.all().delete()
    Notification.objects.all().delete()

def run_master_seed():
    clean_db()
    
    print("🚀 Iniciando Seed Master com Alta Fidelidade (Modo Detalhista)...")

    # ---------------------------------------------------------
    # 1. USUÁRIOS E LOJISTAS
    # ---------------------------------------------------------
    print("👤 Criando Usuários Realistas e Superadmin...")
    
    # Criando o Superadmin exigido
    if not User.objects.filter(email="rafaelmaldivas@gmail.com").exists():
        print("👑 Criando superadmin: rafaelmaldivas@gmail.com")
        User.objects.create_superuser(
            email="rafaelmaldivas@gmail.com",
            password="Mald1v@$",
            first_name="Rafael",
            last_name="Maldivas"
        )
    
    buyer = User.objects.create_user(
        email="demo@mysuperstore.com",
        password="password123",
        first_name="João",
        last_name="Comprador",
        role=UserRole.CUSTOMER,
        person_type="PF",
        cpf_cnpj="11122233344",
        phone=f"119{random.randint(10000000, 99999999)}"
    )

    buyer_2 = User.objects.create_user(
        email="maria@mysuperstore.com",
        password="password123",
        first_name="Maria",
        last_name="Silva",
        role=UserRole.CUSTOMER,
        person_type="PF",
        cpf_cnpj="55566677788",
        phone=f"119{random.randint(10000000, 99999999)}"
    )

    seller_user = User.objects.create_user(
        email="loja@nike.com",
        password="password123",
        first_name="Nike",
        last_name="Oficial",
        role=UserRole.SELLER,
        person_type="PJ",
        cpf_cnpj="99988877766655"
    )

    seller_profile = Seller.objects.create(
        user=seller_user,
        store_name="Nike Oficial",
        slug="nike-oficial",
        description="A loja oficial da Nike no MySuperStore. Produtos premium de alta performance.",
        commission_rate=Decimal("0.10"),
        status="approved"
    )
    
    seller_user_2 = User.objects.create_user(
        email="loja@samsung.com",
        password="password123",
        first_name="Samsung",
        last_name="Oficial",
        role=UserRole.SELLER,
        person_type="PJ",
        cpf_cnpj="12345678901234"
    )

    seller_profile_2 = Seller.objects.create(
        user=seller_user_2,
        store_name="Samsung Oficial",
        slug="samsung-oficial",
        description="A melhor tecnologia para a sua vida.",
        commission_rate=Decimal("0.12"),
        status="approved"
    )

    # ---------------------------------------------------------
    # 2. CATÁLOGO E ATRIBUTOS (Alta Fidelidade)
    # ---------------------------------------------------------
    print("📦 Criando Catálogo (Atributos, Categorias e Produtos)...")
    
    cat_esportes = Category.objects.create(name="Esportes", slug="esportes")
    cat_casual = Category.objects.create(name="Moda Casual", slug="moda-casual")
    cat_eletronicos = Category.objects.create(name="Eletrônicos", slug="eletronicos")

    attr_cor = Attribute.objects.create(name="Cor")
    attr_tamanho = Attribute.objects.create(name="Tamanho")
    
    # Valores de Cor
    val_branco = AttributeValue.objects.create(attribute=attr_cor, value="Branco")
    val_preto = AttributeValue.objects.create(attribute=attr_cor, value="Preto")
    val_vermelho = AttributeValue.objects.create(attribute=attr_cor, value="Vermelho")
    val_prata = AttributeValue.objects.create(attribute=attr_cor, value="Prata")
    
    # Valores de Tamanho
    val_39 = AttributeValue.objects.create(attribute=attr_tamanho, value="39")
    val_40 = AttributeValue.objects.create(attribute=attr_tamanho, value="40")
    val_41 = AttributeValue.objects.create(attribute=attr_tamanho, value="41")

    products_data = [
        {
            "name": "Nike Air Force 1 '07",
            "desc": "O brilho vive no Nike Air Force 1 '07, o tênis original do basquete.",
            "price": "799.99",
            "seller": seller_profile,
            "cat": cat_casual,
            "image": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1000",
            "variants": [(val_39, val_branco), (val_40, val_branco), (val_41, val_preto)]
        },
        {
            "name": "Nike Air Max 270",
            "desc": "O primeiro Max Air criado especificamente para a Nike Sportswear.",
            "price": "999.99",
            "promo_price": "850.00",
            "seller": seller_profile,
            "cat": cat_esportes,
            "image": "https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&q=80&w=1000",
            "variants": [(val_40, val_vermelho)]
        },
        {
            "name": "Nike Dunk Low Retro",
            "desc": "Criado para as quadras, mas levado para as ruas, o ícone do basquete dos anos 80 retorna com sobreposições perfeitamente brilhantes.",
            "price": "1099.99",
            "seller": seller_profile,
            "cat": cat_casual,
            "image": "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=1000",
            "variants": [(val_39, val_preto), (val_41, val_branco)]
        },
        {
            "name": "Nike ZoomX Vaporfly",
            "desc": "O próximo passo na evolução da velocidade.",
            "price": "1999.99",
            "seller": seller_profile,
            "cat": cat_esportes,
            "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000",
            "variants": [(val_40, val_vermelho), (val_41, val_branco)]
        },
        {
            "name": "Nike Pegasus 40",
            "desc": "A corrida do dia a dia ganhou um novo visual.",
            "price": "899.99",
            "promo_price": "750.00",
            "seller": seller_profile,
            "cat": cat_esportes,
            "image": "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=1000",
            "variants": [(val_39, val_preto)]
        },
        {
            "name": "Nike SB Dunk Low Pro",
            "desc": "Estilo clássico para andar de skate com máximo desempenho.",
            "price": "1199.99",
            "seller": seller_profile,
            "cat": cat_casual,
            "image": "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=1000",
            "variants": [(val_40, val_branco)]
        },
        {
            "name": "Smart TV Samsung Neo QLED 4K 55\"",
            "desc": "O ápice do controle de luz. TV de altíssima definição para games e cinema.",
            "price": "4599.00",
            "seller": seller_profile_2,
            "cat": cat_eletronicos,
            "image": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_prata)]
        },
        {
            "name": "Samsung Galaxy S24 Ultra",
            "desc": "O poder do Galaxy AI agora no seu bolso.",
            "price": "8999.00",
            "promo_price": "8499.00",
            "seller": seller_profile_2,
            "cat": cat_eletronicos,
            "image": "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_preto), (None, val_prata)]
        },
        {
            "name": "Samsung Galaxy Watch 6",
            "desc": "O smartwatch perfeito para monitorar sua saúde e exercícios.",
            "price": "1999.00",
            "seller": seller_profile_2,
            "cat": cat_eletronicos,
            "image": "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_preto)]
        },
        {
            "name": "Samsung Galaxy Buds2 Pro",
            "desc": "Som imersivo de alta qualidade com cancelamento de ruído ativo.",
            "price": "1299.00",
            "promo_price": "999.00",
            "seller": seller_profile_2,
            "cat": cat_eletronicos,
            "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_branco), (None, val_preto)]
        },
        {
            "name": "Monitor Samsung Odyssey G9",
            "desc": "Monitor ultrawide curvo para uma imersão total nos games.",
            "price": "11999.00",
            "seller": seller_profile_2,
            "cat": cat_eletronicos,
            "image": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_preto)]
        },
        {
            "name": "Notebook Samsung Galaxy Book3 Pro",
            "desc": "Desempenho ultrafino com tela AMOLED dinâmica.",
            "price": "7999.00",
            "seller": seller_profile_2,
            "cat": cat_eletronicos,
            "image": "https://images.unsplash.com/photo-1531297172867-4f50414a1fa3?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_prata)]
        },
        {
            "name": "Nike Sportswear Club Fleece",
            "desc": "Moletom com capuz macio e confortável para o dia a dia.",
            "price": "349.99",
            "seller": seller_profile,
            "cat": cat_casual,
            "image": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1000",
            "variants": [(val_39, val_preto), (val_40, val_branco)]
        },
        {
            "name": "Mochila Nike Brasilia",
            "desc": "Espaçosa e durável para carregar seus itens com segurança.",
            "price": "249.99",
            "seller": seller_profile,
            "cat": cat_esportes,
            "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_preto)]
        },
        {
            "name": "Soundbar Samsung Q-Series",
            "desc": "Áudio de cinema na sua sala com Dolby Atmos.",
            "price": "2999.00",
            "promo_price": "2599.00",
            "seller": seller_profile_2,
            "cat": cat_eletronicos,
            "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=1000",
            "variants": [(None, val_preto)]
        }
    ]

    created_products = []
    for p_data in products_data:
        prod = Product.objects.create(
            seller=p_data["seller"],
            category=p_data["cat"],
            name=p_data["name"],
            slug=p_data["name"].lower().replace(" ", "-").replace("'", "").replace("\"", ""),
            description=p_data["desc"],
            base_price=Decimal(p_data["price"]),
            promotional_price=Decimal(p_data["promo_price"]) if "promo_price" in p_data else None,
            is_available=True,
            approval_status="approved",
            weight=Decimal("1.500"),
            length=Decimal("30.00"),
            width=Decimal("20.00"),
            height=Decimal("15.00")
        )
        prod.save()
        
        from apps.catalog.models import ProductImage
        ProductImage.objects.create(product=prod, external_url=p_data["image"], is_primary=True)

        for size_val, color_val in p_data["variants"]:
            var_sku = f"{prod.id.hex[:6]}-{color_val.value[:3].upper()}"
            if size_val:
                var_sku += f"-{size_val.value}"
                
            variant = ProductVariant.objects.create(
                product=prod,
                sku=var_sku,
                stock=50,
                price=None # Usa o base_price
            )
            variant.attributes.add(color_val)
            if size_val:
                variant.attributes.add(size_val)

        created_products.append(prod)

    # ---------------------------------------------------------
    # 3. CUPONS
    # ---------------------------------------------------------
    print("🎟️ Criando Cupons...")
    Coupon.objects.create(
        code="BEMVINDO10",
        seller=seller_profile,
        discount_percentage=Decimal("10.00"),
        valid_from=timezone.now() - timedelta(days=1),
        valid_to=timezone.now() + timedelta(days=30),
        active=True
    )

    # ---------------------------------------------------------
    # 4. AVALIAÇÕES (Reviews Reais)
    # ---------------------------------------------------------
    print("⭐ Criando Avaliações de Produtos...")
    ReviewRating.objects.create(
        product=created_products[0],
        user=buyer,
        rating=Decimal("5.0"),
        subject="Melhor tênis que já tive!",
        body="Muito confortável, combina com qualquer roupa. Recomendo demais.",
        status="approved"
    )
    ReviewRating.objects.create(
        product=created_products[1],
        user=buyer_2,
        rating=Decimal("4.0"),
        subject="Bom para corrida",
        body="Amortece bem, mas achei a forma um pouco justa.",
        status="approved"
    )
    ReviewRating.objects.create(
        product=created_products[2],
        user=buyer,
        rating=Decimal("5.0"),
        subject="Imagem espetacular",
        body="Assisti a filmes em 4K e fiquei deslumbrado com o contraste.",
        status="approved"
    )

    # ---------------------------------------------------------
    # 5. PEDIDOS (Para o Dashboard "Meu Universo" ficar insano)
    # ---------------------------------------------------------
    print("🛒 Criando Pedidos Premium...")
    total_spent = Decimal("0.00")
    total_items = 0

    for i in range(12): 
        days_ago = random.randint(2, 300)
        order_date = timezone.now() - timedelta(days=days_ago)
        
        order = Order.objects.create(
            user=buyer,
            status=OrderStatus.DELIVERED,
            subtotal=Decimal("0.00"),
            total=Decimal("0.00"),
            shipping=Decimal("25.00"),
            order_number=f"MST-{buyer.id.hex[:4]}-{i}-{random.randint(100, 999)}",
            address_recipient=buyer.first_name,
            address_cep="01001000",
            address_logradouro="Avenida Paulista",
            address_numero="1000",
            address_bairro="Bela Vista",
            address_cidade="São Paulo",
            address_uf="SP",
        )
        
        order_subtotal = Decimal("0.00")
        
        # O cliente compra de 1 a 3 itens diferentes no mesmo pedido
        num_items = random.randint(1, 3)
        for _ in range(num_items):
            prod = random.choice(created_products)
            variant = prod.variants.first()
            qty = random.randint(1, 2)
            price = prod.promotional_price or prod.base_price
            item_total = price * qty
            
            sub_order, _ = SubOrder.objects.get_or_create(
                order=order,
                seller=prod.seller,
                defaults={
                    "subtotal": Decimal("0.00"),
                    "commission": Decimal("0.00"),
                    "seller_amount": Decimal("0.00"),
                    "status": OrderStatus.DELIVERED
                }
            )
            
            OrderItem.objects.create(
                sub_order=sub_order,
                variant=variant,
                product_name=prod.name,
                variant_sku=variant.sku,
                quantity=qty,
                unit_price=price,
                total=item_total
            )
            
            sub_order.subtotal += item_total
            sub_order.commission += item_total * prod.seller.commission_rate
            sub_order.seller_amount += item_total * (Decimal("1.00") - prod.seller.commission_rate)
            sub_order.save()
            
            order_subtotal += item_total
            total_items += qty
            
        order.subtotal = order_subtotal
        order.total = order_subtotal + order.shipping
        order.save()
        
        # Retroagir datas reais
        Order.objects.filter(id=order.id).update(created_at=order_date)
        SubOrder.objects.filter(order=order).update(created_at=order_date)
        
        total_spent += order.total

    # ---------------------------------------------------------
    # 6. CHAT E MENSAGENS (Atendimento Humanizado)
    # ---------------------------------------------------------
    print("💬 Criando Chat de Suporte Real...")
    chat_room = ChatRoom.objects.create(
        customer=buyer,
        seller=seller_profile,
        product=created_products[1] # Air Max
    )
    ChatMessage.objects.create(
        room=chat_room,
        sender=buyer,
        message="Olá, boa tarde! Gostaria de saber se a forma do Air Max é grande ou pequena? Calço 40.",
        created_at=timezone.now() - timedelta(minutes=15)
    )
    ChatMessage.objects.create(
        room=chat_room,
        sender=seller_user,
        message="Olá João, boa tarde! A forma é padrão, mas o bico é um pouco mais afunilado. Se você gosta de um ajuste mais folgado, recomendo pegar o 41. Temos ambos no estoque!",
        created_at=timezone.now() - timedelta(minutes=5)
    )
    ChatMessage.objects.create(
        room=chat_room,
        sender=buyer,
        message="Perfeito, vou comprar o 41 agora. Obrigado pela ajuda ágil!",
        created_at=timezone.now() - timedelta(minutes=1)
    )
    
    # ---------------------------------------------------------
    # 7. NOTIFICAÇÕES (Sistema Inteligente)
    # ---------------------------------------------------------
    print("🔔 Criando Notificações Estratégicas...")
    notifications = [
        {"title": "Obrigado por comprar!", "message": "Seu pagamento foi confirmado e a Nike Oficial já está preparando o envio.", "type": "order", "is_read": False},
        {"title": "Nova Mensagem", "message": "A Nike Oficial respondeu sua dúvida no chat de suporte.", "type": "chat", "is_read": False},
        {"title": "Oferta Premium Exclusiva", "message": "A Neo QLED 4K que você visualizou baixou de preço! Corra antes que acabe.", "type": "system", "is_read": False},
        {"title": "Avaliação Aprovada", "message": "Sua review do tênis foi publicada e ajudou 15 pessoas.", "type": "system", "is_read": True},
    ]
    
    for n in notifications:
        Notification.objects.create(
            user=buyer,
            title=n["title"],
            message=n["message"],
            type=n["type"],
            is_read=n["is_read"]
        )

    print("\n" + "🔥"*25)
    print("  SEED MASTER CONCLUÍDO COM EXTREMA FIDELIDADE!  ")
    print("🔥"*25)
    print("✅ Usuários: 2 Compradores | 2 Lojistas (Nike, Samsung)")
    print("✅ Catálogo: Categorias, Produtos reais, Atributos de Cor/Tamanho")
    print("✅ Avaliações: Reviews de 4 e 5 estrelas")
    print("✅ Pedidos: 12 pedidos multi-lojas processados")
    print("✅ Chats: Conversação realística entre cliente e vendedor")
    print("✅ Notificações: Diversas ativas aguardando clique")
    print(f"📊 Dashboard Gerado -> Gasto total: R$ {total_spent:,.2f}")
    print("\n🔐 CREDENCIAIS DO SUPERADMIN:")
    print("   E-mail: rafaelmaldivas@gmail.com")
    print("   Senha:  Mald1v@$")
    print("\n🔐 CREDENCIAIS DO CLIENTE PREMIUM (Painel Completo):")
    print("   E-mail: demo@mysuperstore.com")
    print("   Senha:  password123")
    print("\n🔐 CREDENCIAIS LOJISTA NIKE (Para testar Chat/Painel):")
    print("   E-mail: loja@nike.com")
    print("   Senha:  password123")
    print("="*50)

if __name__ == "__main__":
    run_master_seed()
