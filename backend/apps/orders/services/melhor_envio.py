import requests
from django.conf import settings

class MelhorEnvioService:
    def __init__(self):
        self.token = settings.MELHOR_ENVIO_TOKEN
        self.environment = getattr(settings, "MELHOR_ENVIO_ENVIRONMENT", "sandbox")
        
        if self.environment == "sandbox":
            self.base_url = "https://sandbox.melhorenvio.com.br/api/v2/me"
        else:
            self.base_url = "https://www.melhorenvio.com.br/api/v2/me"

    def calculate_shipping(self, origin_cep: str, dest_cep: str, products: list):
        """
        Calcula frete no Melhor Envio.
        :param origin_cep: str (Ex: '01001000')
        :param dest_cep: str (Ex: '20040020')
        :param products: list de dicts: [{"id": "x", "weight": 1.0, "width": 10, "height": 10, "length": 10, "quantity": 1, "insurance_value": 100.0}]
        :return: dict com opções de frete ou raise Exception
        """
        # Se não tem token, retorna mock (útil para dev local antes do cadastro no Melhor Envio)
        if not self.token:
            return [
                {
                    "id": 1,
                    "name": "PAC (Mock)",
                    "company": {"name": "Correios"},
                    "price": "18.50",
                    "delivery_time": 5,
                    "error": None
                },
                {
                    "id": 2,
                    "name": "SEDEX (Mock)",
                    "company": {"name": "Correios"},
                    "price": "35.90",
                    "delivery_time": 2,
                    "error": None
                },
                {
                    "id": 3,
                    "name": "Jadlog Package (Mock)",
                    "company": {"name": "Jadlog"},
                    "price": "22.10",
                    "delivery_time": 4,
                    "error": None
                }
            ]

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
            "User-Agent": "MySuperStore (rafael@exemplo.com)" # Recomendado pelo ME
        }

        # Formata produtos para o Melhor Envio
        me_products = []
        for p in products:
            me_products.append({
                "id": p.get("id", "1"),
                "width": float(p.get("width") or 11.0),   # min ME: 11cm
                "height": float(p.get("height") or 2.0),  # min ME: 2cm
                "length": float(p.get("length") or 16.0), # min ME: 16cm
                "weight": float(p.get("weight") or 0.3),  # min ME: 0.3kg
                "insurance_value": float(p.get("insurance_value") or 0.0),
                "quantity": int(p.get("quantity") or 1)
            })

        payload = {
            "from": {"postal_code": origin_cep.replace("-", "")},
            "to": {"postal_code": dest_cep.replace("-", "")},
            "products": me_products
        }

        response = requests.post(f"{self.base_url}/shipment/calculate", json=payload, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Erro no Melhor Envio: {response.text}")
            
        data = response.json()
        
        # Filtra apenas opções que não retornaram erro (dimensões fora do limite, etc)
        valid_options = []
        for opt in data:
            if not opt.get("error"):
                valid_options.append({
                    "id": opt.get("id"),
                    "name": opt.get("name"),
                    "company": opt.get("company", {}),
                    "price": opt.get("price"),
                    "custom_price": opt.get("custom_price"), # O que a loja vai pagar de fato (com desconto)
                    "delivery_time": opt.get("delivery_time"),
                })
                
        return valid_options
