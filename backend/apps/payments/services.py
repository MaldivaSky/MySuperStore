import base64
from decimal import Decimal
from io import BytesIO

import qrcode
import stripe
from django.conf import settings
from django.utils import timezone
from apps.sellers.models import Seller

# Inicializa o SDK do Stripe com a chave privada
stripe.api_key = settings.STRIPE_SECRET_KEY


def _cents(value) -> int:
    """Converte um Decimal/float de reais para centavos inteiros sem erro de ponto flutuante."""
    return int((Decimal(str(value)) * 100).to_integral_value())


class StripeService:
    @staticmethod
    def create_payment_intent(order):
        """
        Cria um PaymentIntent no Stripe (cartão de crédito/débito) para o pedido.
        - Vendedor único onboardado no Connect → Destination Charge (split automático).
        - Carrinho misto ou vendedor sem Stripe → cobrança na plataforma, split posterior
          via Separate Transfers (executado no webhook após a confirmação).
        """
        sub_orders = list(order.sub_orders.all())
        amount_in_cents = _cents(order.total)

        # Caso 1: Vendedor Único com Stripe Connect configurado → split automático
        if len(sub_orders) == 1:
            sub_order = sub_orders[0]
            seller = sub_order.seller
            if seller and seller.stripe_authorized:
                commission_in_cents = _cents(sub_order.commission)
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
                    payment_method_options={
                        "card": {
                            "installments": {
                                "enabled": True
                            }
                        }
                    }
                )
                return intent

        # Caso 2: Carrinho misto ou vendedor sem Connect → cobrança na plataforma
        intent = stripe.PaymentIntent.create(
            amount=amount_in_cents,
            currency="brl",
            payment_method_types=["card"],
            metadata={
                "order_id": str(order.id),
                "order_number": order.order_number,
                "type": "separate_transfers",
            },
            payment_method_options={
                "card": {
                    "installments": {
                        "enabled": True
                    }
                }
            }
        )
        return intent

    @staticmethod
    def refund_payment(payment, amount=None):
        """
        Estorna um pagamento de cartão no Stripe. Para cobranças com split (Connect),
        reverte a transferência ao vendedor e devolve a taxa de aplicação à plataforma.
        `amount` em reais; None = estorno total.
        Retorna o objeto Refund do Stripe.
        """
        if not payment.mp_payment_id:
            raise ValueError("Pagamento sem PaymentIntent associado — nada a estornar.")

        kwargs = {
            "payment_intent": payment.mp_payment_id,
            "metadata": {"order_number": payment.order.order_number},
        }
        if amount is not None:
            kwargs["amount"] = _cents(amount)

        # Reverter transfer/comissão só faz sentido quando houve split de fato (vendedor
        # onboardado no Connect). Cobrança direta na plataforma não possui transfer.
        has_split = any(
            so.seller and so.seller.stripe_authorized
            for so in payment.order.sub_orders.all()
        )
        if has_split:
            kwargs["reverse_transfer"] = True       # devolve o valor transferido ao vendedor
            kwargs["refund_application_fee"] = True  # devolve a comissão retida

        return stripe.Refund.create(**kwargs)

    @staticmethod
    def cancel_payment_intent(payment):
        """Cancela um PaymentIntent ainda não confirmado (antes de qualquer cobrança)."""
        if not payment.mp_payment_id:
            return None
        try:
            return stripe.PaymentIntent.cancel(payment.mp_payment_id)
        except stripe.error.InvalidRequestError:
            # Já capturado/cancelado — nada a fazer
            return None

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


class PixService:
    """
    Gera cobranças PIX no padrão BR Code (EMV) do Banco Central — o mesmo "Copia e Cola"
    lido por qualquer app bancário. Implementação local e testável; em produção, a emissão
    do txid e a baixa do pagamento seriam delegadas à API de um PSP/banco (Efí, MP, etc.),
    bastando trocar `generate_brcode` e o gatilho de confirmação.
    """

    MERCHANT_NAME = "MYSUPERSTORE"
    MERCHANT_CITY = "SAO PAULO"
    PIX_KEY = "contato@mysuperstore.com"  # chave PIX da plataforma (recebedora)

    @staticmethod
    def _emv(eid: str, value: str) -> str:
        """Monta um campo EMV: ID + tamanho (2 dígitos) + valor."""
        return f"{eid}{len(value):02d}{value}"

    @staticmethod
    def _crc16(payload: str) -> str:
        """CRC16-CCITT (0x1021, init 0xFFFF) — checksum exigido no fim do BR Code."""
        crc = 0xFFFF
        for byte in payload.encode("utf-8"):
            crc ^= byte << 8
            for _ in range(8):
                crc = ((crc << 1) ^ 0x1021) if (crc & 0x8000) else (crc << 1)
                crc &= 0xFFFF
        return f"{crc:04X}"

    @classmethod
    def generate_brcode(cls, order):
        """
        Retorna (copia_e_cola, qr_code_base64) para o valor total do pedido.
        O txid é derivado do número do pedido (alfanumérico, máx. 25).
        """
        txid = "".join(c for c in order.order_number if c.isalnum())[:25] or "MSS"
        amount = f"{Decimal(str(order.total)):.2f}"

        # Merchant Account Information (GUI br.gov.bcb.pix + chave)
        mai = cls._emv("00", "br.gov.bcb.pix") + cls._emv("01", cls.PIX_KEY)
        # Additional Data Field (txid)
        adf = cls._emv("05", txid)

        payload = (
            cls._emv("00", "01")               # Payload Format Indicator
            + cls._emv("26", mai)              # Merchant Account Information
            + cls._emv("52", "0000")           # Merchant Category Code
            + cls._emv("53", "986")            # Moeda: BRL
            + cls._emv("54", amount)           # Valor da transação
            + cls._emv("58", "BR")             # País
            + cls._emv("59", cls.MERCHANT_NAME[:25])
            + cls._emv("60", cls.MERCHANT_CITY[:15])
            + cls._emv("62", adf)              # Additional Data Field
            + "6304"                            # ID 63 + tamanho 04 do CRC (sem o valor ainda)
        )
        copia_e_cola = payload + cls._crc16(payload)

        # Gera o QR Code em PNG e codifica em base64 para embutir no frontend
        img = qrcode.make(copia_e_cola)
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return copia_e_cola, qr_base64
