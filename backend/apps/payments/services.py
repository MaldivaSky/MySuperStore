import base64
import logging
import os
import threading
from decimal import Decimal
from io import BytesIO

import qrcode
from django.conf import settings
from efipay import EfiPay

logger = logging.getLogger(__name__)

# Cache do caminho do .pem convertido (a conversão p12->pem roda uma vez por processo).
_efi_pem_lock = threading.Lock()
_efi_pem_cache: dict[str, str] = {}


def _ensure_pem_certificate(cert_path: str) -> str:
    """
    O Efí entrega o certificado em .p12, mas o SDK/requests precisa de .pem.
    Converte uma vez e guarda em /tmp. Se já for .pem, retorna como está.
    """
    if not cert_path:
        raise ValueError("Certificado do Efí não configurado (EFI_CERT_*).")
    if cert_path.lower().endswith(".pem"):
        return cert_path
    with _efi_pem_lock:
        cached = _efi_pem_cache.get(cert_path)
        if cached and os.path.exists(cached):
            return cached
        from cryptography.hazmat.primitives.serialization import (
            Encoding, NoEncryption, PrivateFormat, pkcs12,
        )
        with open(cert_path, "rb") as fh:
            data = fh.read()
        key, cert, _chain = pkcs12.load_key_and_certificates(data, None)
        pem = b""
        if key:
            pem += key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption())
        if cert:
            pem += cert.public_bytes(Encoding.PEM)
        out = os.path.join("/tmp", f"efi_{abs(hash(cert_path))}.pem")
        with open(out, "wb") as fh:
            fh.write(pem)
        os.chmod(out, 0o600)
        _efi_pem_cache[cert_path] = out
        return out


def _cents(value) -> int:
    """Converte um Decimal/float de reais para centavos inteiros sem erro de ponto flutuante."""
    return int((Decimal(str(value)) * 100).to_integral_value())


class EfiCardService:
    """
    Integração de Cartão de Crédito com Efí Bank (API Cobranças).
    Suporta Split Nativo via `payee_code`.
    """

    @staticmethod
    def _client():
        return EfiPay({
            "client_id": settings.EFI_COBRANCAS_CLIENT_ID,
            "client_secret": settings.EFI_COBRANCAS_CLIENT_SECRET,
            "sandbox": settings.EFI_SANDBOX,
        })

    @staticmethod
    def _build_splits(order):
        """Monta o array de splits para a API de Cobranças do Efí."""
        splits = []
        for sub_order in order.sub_orders.all():
            seller = sub_order.seller
            if seller and seller.efi_authorized:
                # O repasse é o total do sub-pedido menos a comissão da plataforma
                repasse_cents = _cents(sub_order.seller_amount)
                splits.append({
                    "payee_code": seller.efi_payee_code,
                    "split_value": repasse_cents
                })
        return splits

    @classmethod
    def create_card_charge(cls, order, payment_token, installments, customer_data, billing_address):
        """
        Cria uma cobrança de Cartão de Crédito em 1 Passo (One-Step Charge) com Split.
        """
        efi = cls._client()
        total_cents = _cents(order.total)
        
        body = {
            "items": [
                {
                    "name": f"Pedido {order.order_number}",
                    "value": total_cents,
                    "amount": 1
                }
            ],
            "payment": {
                "credit_card": {
                    "installments": int(installments),
                    "payment_token": payment_token,
                    "billing_address": billing_address,
                    "customer": customer_data
                }
            }
        }

        # Adiciona regras de Split caso os lojistas tenham payee_code cadastrado
        splits = cls._build_splits(order)
        if splits:
            body["splits"] = splits

        try:
            # create_one_step_charge encapsula a criação + pagamento do título
            response = efi.create_one_step_charge(params={}, body=body)
            if response.get("code") == 200:
                data = response.get("data", {})
                return {
                    "success": True,
                    "charge_id": str(data.get("charge_id")),
                    "status": data.get("status"),
                    "raw_response": response
                }
            return {
                "success": False,
                "error": response.get("error_description", "Falha no pagamento")
            }
        except Exception as e:
            logger.error(f"Erro ao processar cartão Efí: {e}")
            return {"success": False, "error": str(e)}

    @classmethod
    def refund_charge(cls, charge_id, amount=None):
        """Estorna uma cobrança de cartão no Efí."""
        efi = cls._client()
        try:
            return efi.cancel_charge(params={"id": charge_id})
        except Exception as e:
            logger.error(f"Erro ao estornar cartão Efí: {e}")
            raise e


class EfiPixService:
    """
    Integração de PIX com Efí Bank (API Pix - mTLS).
    Suporta repasses via Split Nativo PIX, caso configurado.
    """

    @staticmethod
    def is_configured() -> bool:
        return bool(
            getattr(settings, "EFI_PIX_CLIENT_ID", "")
            and getattr(settings, "EFI_PIX_CLIENT_SECRET", "")
            and getattr(settings, "EFI_PIX_CERT_PATH", "")
            and getattr(settings, "EFI_PIX_KEY", "")
        )

    @staticmethod
    def _client():
        return EfiPay({
            "client_id": settings.EFI_PIX_CLIENT_ID,
            "client_secret": settings.EFI_PIX_CLIENT_SECRET,
            "sandbox": settings.EFI_SANDBOX,
            "certificate": _ensure_pem_certificate(settings.EFI_PIX_CERT_PATH),
        })

    @classmethod
    def create_charge(cls, order):
        """
        Cria uma cobrança PIX imediata no Efí e retorna
        (txid, copia_e_cola, qr_code_base64).
        """
        efi = cls._client()
        valor = f"{Decimal(str(order.total)):.2f}"
        
        body = {
            "calendario": {"expiracao": int(getattr(settings, "EFI_PIX_EXPIRACAO", 3600))},
            "valor": {"original": valor},
            "chave": settings.EFI_PIX_KEY,
            "solicitacaoPagador": f"Pedido {order.order_number}"[:140],
        }

        # Configura os repasses de PIX Split
        splits = []
        for sub_order in order.sub_orders.all():
            seller = sub_order.seller
            if seller and seller.efi_authorized:
                splits.append({
                    "recebedor": {
                        "contaCorrente": seller.efi_payee_code
                    },
                    "valor": f"{Decimal(str(sub_order.seller_amount)):.2f}"
                })
        
        # O Split na API PIX do Efí
        if splits:
            body["repasses"] = splits

        charge = efi.pix_create_immediate_charge(body=body)
        if not isinstance(charge, dict) or not charge.get("txid"):
            raise RuntimeError(f"Resposta inesperada do Efí ao criar cobrança PIX: {charge}")

        txid = charge["txid"]
        loc_id = charge.get("loc", {}).get("id")
        qr = efi.pix_generate_qrcode(params={"id": loc_id})
        
        copia_e_cola = qr.get("qrcode", "") if isinstance(qr, dict) else ""
        imagem = qr.get("imagemQrcode", "") if isinstance(qr, dict) else ""
        qr_base64 = imagem.split(",", 1)[1] if "," in imagem else imagem
        
        return txid, copia_e_cola, qr_base64

    @classmethod
    def get_charge(cls, txid: str) -> dict:
        """Consulta uma cobrança pelo txid."""
        efi = cls._client()
        return efi.pix_detail_charge(params={"txid": txid})

    @classmethod
    def is_paid(cls, txid: str) -> bool:
        """True se a cobrança consta como concluída."""
        try:
            charge = cls.get_charge(txid)
        except Exception as exc:
            logger.warning("Falha ao consultar cobrança PIX %s: %s", txid, exc)
            return False
        return isinstance(charge, dict) and charge.get("status") == "CONCLUIDA"


class PixService:
    """
    Gera cobranças PIX offline (Fallback/Simulação).
    """
    MERCHANT_NAME = "MYSUPERSTORE"
    MERCHANT_CITY = "SAO PAULO"
    PIX_KEY = "contato@mysuperstore.com"

    @staticmethod
    def _emv(eid: str, value: str) -> str:
        return f"{eid}{len(value):02d}{value}"

    @staticmethod
    def _crc16(payload: str) -> str:
        crc = 0xFFFF
        for byte in payload.encode("utf-8"):
            crc ^= byte << 8
            for _ in range(8):
                crc = ((crc << 1) ^ 0x1021) if (crc & 0x8000) else (crc << 1)
                crc &= 0xFFFF
        return f"{crc:04X}"

    @classmethod
    def generate_brcode(cls, order):
        txid = "".join(c for c in order.order_number if c.isalnum())[:25] or "MSS"
        amount = f"{Decimal(str(order.total)):.2f}"
        mai = cls._emv("00", "br.gov.bcb.pix") + cls._emv("01", cls.PIX_KEY)
        adf = cls._emv("05", txid)
        payload = (
            cls._emv("00", "01")
            + cls._emv("26", mai)
            + cls._emv("52", "0000")
            + cls._emv("53", "986")
            + cls._emv("54", amount)
            + cls._emv("58", "BR")
            + cls._emv("59", cls.MERCHANT_NAME[:25])
            + cls._emv("60", cls.MERCHANT_CITY[:15])
            + cls._emv("62", adf)
            + "6304"
        )
        copia_e_cola = payload + cls._crc16(payload)
        img = qrcode.make(copia_e_cola)
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return copia_e_cola, qr_base64
