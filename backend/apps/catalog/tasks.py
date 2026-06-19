import io
import os
from celery import shared_task
from django.core.files.base import ContentFile
from PIL import Image
from .models import ProductImage


@shared_task
def optimize_product_image_task(product_image_id):
    try:
        product_image = ProductImage.objects.get(id=product_image_id)
    except ProductImage.DoesNotExist:
        return f"Imagem de produto {product_image_id} não encontrada."

    # Se a imagem já estiver no formato webp, pula a otimização para evitar processamento redundante
    if product_image.image.name.lower().endswith(".webp"):
        return f"Imagem {product_image.id} já está em formato WebP."

    # Carrega a imagem original do storage (local ou S3)
    img_field = product_image.image
    try:
        img_field.open("rb")
        img_data = img_field.read()
    except Exception as e:
        return f"Erro ao ler imagem original do storage: {str(e)}"
    finally:
        img_field.close()

    # Processamento de imagem com a biblioteca Pillow
    try:
        image = Image.open(io.BytesIO(img_data))
        
        # Converte para RGB se necessário (WebP suporta RGB e RGBA)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

        # Redimensiona mantendo a proporção (thumbnail) com tamanho máximo de 1200px
        image.thumbnail((1200, 1200))

        # Salva a imagem comprimida em formato WebP no buffer
        output_buffer = io.BytesIO()
        image.save(output_buffer, format="WEBP", quality=80)
        output_buffer.seek(0)
    except Exception as e:
        return f"Erro ao processar imagem com Pillow: {str(e)}"

    # Define o novo nome do arquivo com a extensão .webp
    original_filename = os.path.basename(img_field.name)
    base_name, _ = os.path.splitext(original_filename)
    new_filename = f"{base_name}.webp"

    # Salva o arquivo WebP de volta no model
    # Nota: save=False para evitar o gatilho recursivo do signal. Atualizamos via queryset
    optimized_file = ContentFile(output_buffer.read(), name=new_filename)
    
    # Exclui o arquivo físico antigo
    try:
        img_field.storage.delete(img_field.name)
    except Exception:
        pass

    # Atualiza o arquivo no banco
    product_image.image.save(new_filename, optimized_file, save=False)
    product_image.save(update_fields=["image"])

    return f"Imagem {product_image.id} otimizada com sucesso para WebP (Pedido: {new_filename})"
