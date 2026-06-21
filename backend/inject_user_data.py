import os
import sys
import django

sys.path.append('c:/Users/rafae/Dev/MySuperStore/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import User, UserSurvey, Address

try:
    user = User.objects.get(email="rafaelmaldivas@gmail.com")
    
    # 1. Edita o Telefone
    user.phone = "(11) 99999-9999"
    user.save()
    print("Phone updated.")

    # 2. Edita a Bio (Survey)
    survey, created = UserSurvey.objects.get_or_create(user=user)
    survey.profession = "Desenvolvedor de Software"
    survey.preferred_category = "Tecnologia"
    survey.gender = "Masculino"
    survey.save()
    print("Bio/Survey updated.")

    # 3. Inclui 2 endereços
    addr1, c1 = Address.objects.get_or_create(
        user=user,
        label="Casa",
        defaults={
            "recipient_name": f"{user.first_name} {user.last_name}".strip(),
            "cep": "01001000",
            "logradouro": "Praça da Sé",
            "numero": "123",
            "bairro": "Sé",
            "cidade": "São Paulo",
            "uf": "SP",
            "is_default": True
        }
    )
    if not c1:
        addr1.logradouro = "Praça da Sé"
        addr1.numero = "123"
        addr1.cep = "01001000"
        addr1.save()

    addr2, c2 = Address.objects.get_or_create(
        user=user,
        label="Trabalho",
        defaults={
            "recipient_name": f"{user.first_name} {user.last_name}".strip(),
            "cep": "20040002",
            "logradouro": "Avenida Rio Branco",
            "numero": "456",
            "bairro": "Centro",
            "cidade": "Rio de Janeiro",
            "uf": "RJ",
            "is_default": False
        }
    )
    if not c2:
        addr2.logradouro = "Avenida Rio Branco"
        addr2.numero = "456"
        addr2.cep = "20040002"
        addr2.save()
    print("2 Addresses added.")

    print("SUCCESS")
except Exception as e:
    print("ERROR:", e)
