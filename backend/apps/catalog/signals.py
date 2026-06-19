from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ProductImage
from .tasks import optimize_product_image_task


@receiver(post_save, sender=ProductImage)
def optimize_product_image_on_save(sender, instance, created, **kwargs):
    """
    Sinal post_save para otimizar e converter a imagem do produto para WebP em background.
    """
    # Enfileira o processamento apenas se a imagem possuir um nome válido e não for WebP ainda
    if instance.image and not instance.image.name.lower().endswith(".webp"):
        # Usa on_commit para garantir que o registro já exista no banco para o worker do Celery
        transaction.on_commit(
            lambda: optimize_product_image_task.delay(str(instance.id))
        )
