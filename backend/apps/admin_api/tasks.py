import logging
from celery import shared_task
from django.contrib.auth import get_user_model
from apps.users.models import Notification
from apps.users.notifications import send_web_push

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task
def broadcast_notification_task(title, message, url="/"):
    """
    Envia uma notificação in-app e Web Push para todos os usuários ativos da plataforma.
    """
    logger.info("Iniciando broadcast de notificação: %s", title)
    
    # Podemos enviar para todos ou apenas ativos
    users = User.objects.filter(is_active=True)
    count = 0
    
    for user in users.iterator(chunk_size=1000):
        # Cria notificação in-app
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            type="promo",
            related_entity_id=url
        )
        
        # Dispara Web Push
        try:
            send_web_push(user, title, message, url=url)
        except Exception as e:
            logger.error("Erro ao enviar push para %s: %s", user.email, str(e))
        
        count += 1
        
    logger.info("Broadcast finalizado. %d notificações enviadas.", count)
    return count
