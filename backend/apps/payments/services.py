import stripe
from django.conf import settings
from django.utils import timezone
from apps.sellers.models import Seller

# Inicializa o SDK do Stripe com a chave privada
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    @staticmethod
    def create_payment_intent(order):
        """
        Cria um PaymentIntent no Stripe para o pedido especificado.
        Utiliza Destination Charges se houver apenas um vendedor associado e ativo no Stripe.
        Caso contrário (carrinho misto ou vendedor sem Stripe), faz a cobrança na conta principal
        da plataforma para posterior transferência via Separate Transfers.
        """
        sub_orders = list(order.sub_orders.all())
        amount_in_cents = int(order.total * 100)

        # Caso 1: Vendedor Único com Stripe Connect configurado
        if len(sub_orders) == 1:
            sub_order = sub_orders[0]
            seller = sub_order.seller
            if seller and seller.stripe_authorized:
                commission_in_cents = int(sub_order.commission * 100)
                # Cria cobrança com destino direto ao vendedor, descontando a taxa de comissão
                intent = stripe.PaymentIntent.create(
                    amount=amount_in_cents,
                    currency="brl",
                    payment_method_types=["card"],
                    application_fee_amount=commission_in_cents,
                    transfer_data={"destination": seller.stripe_account_id},
                    metadata={
                        "order_id": str(order.id),
                        "order_number": order.order_number,
                        "type": "destination_charge",
                        "seller_id": str(seller.id),
                    },
                )
                return intent

        # Caso 2: Múltiplos Vendedores (Carrinho Misto) ou Vendedor sem Stripe configurado
        # Cobrança direta na conta da plataforma para posterior divisão manual/assíncrona (Separate Transfers)
        intent = stripe.PaymentIntent.create(
            amount=amount_in_cents,
            currency="brl",
            payment_method_types=["card"],
            metadata={
                "order_id": str(order.id),
                "order_number": order.order_number,
                "type": "separate_transfers",
            },
        )
        return intent

    @staticmethod
    def execute_separate_transfers(order, charge_id):
        """
        Divide o pagamento e transfere o valor líquido para cada vendedor da ordem.
        Usado após a confirmação de um PaymentIntent de carrinho misto.
        """
        transfers = []
        for sub_order in order.sub_orders.all():
            seller = sub_order.seller
            if seller and seller.stripe_authorized:
                # Valor a transferir em centavos (subtotal - comissão)
                transfer_amount = int(sub_order.seller_amount * 100)
                try:
                    transfer = stripe.Transfer.create(
                        amount=transfer_amount,
                        currency="brl",
                        destination=seller.stripe_account_id,
                        source_transaction=charge_id,
                        metadata={
                            "sub_order_id": str(sub_order.id),
                            "order_number": order.order_number,
                        },
                    )
                    transfers.append(transfer)
                except Exception as e:
                    # Em produção, registraríamos isso num Sentry ou log.
                    # Vamos manter o processamento para não quebrar a transação completa.
                    pass
        return transfers

    @staticmethod
    def create_account_link(seller, return_url, refresh_url):
        """
        Cria ou recupera uma Express Account no Stripe Connect para o vendedor
        e gera o link seguro para onboarding do lojista.
        """
        if not seller.stripe_account_id:
            # Cria a Express Account no Stripe
            account = stripe.Account.create(
                type="express",
                country="BR",
                email=seller.user.email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_type="individual",
                metadata={"seller_id": str(seller.id)},
            )
            seller.stripe_account_id = account.id
            seller.save(update_fields=["stripe_account_id"])

        # Cria o link de onboarding de 1 única utilização
        account_link = stripe.AccountLink.create(
            account=seller.stripe_account_id,
            refresh_url=refresh_url,
            return_url=return_url,
            type="account_onboarding",
        )
        return account_link.url
