import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("mysuperstore")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

from celery.schedules import crontab

app.conf.beat_schedule = {
    "check-pending-pix-orders-every-5-minutes": {
        "task": "apps.orders.tasks.check_pending_pix_orders_task",
        "schedule": crontab(minute="*/5"),
    },
}
