import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ProductImage
from .tasks import optimize_product_image_task

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ProductImage)
def optimize_product_image_on_save(sender, instance, created, **kwargs):
    """
    Sinal post_save para otimizar e converter a imagem do produto para WebP em background.
    """
    # Enfileira o processamento apenas se a imagem possuir um nome válido e não for WebP ainda
    if instance.image and not instance.image.name.lower().endswith(".webp"):
        image_id = str(instance.id)

        def _enqueue():
            # A otimização é um "nice-to-have" em background. Se o broker (Redis) estiver
            # indisponível, NUNCA deve derrubar o upload do lojista — apenas registra.
            try:
                optimize_product_image_task.delay(image_id)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Falha ao enfileirar otimização da imagem %s: %s", image_id, exc)

        # on_commit garante que o registro já exista no banco para o worker do Celery
        transaction.on_commit(_enqueue)
