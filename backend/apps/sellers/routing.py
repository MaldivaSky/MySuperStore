from django.urls import re_path
from . import consumers
from apps.users import consumers as user_consumers

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_id>[0-9a-f-]+)/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"ws/notifications/$", user_consumers.NotificationConsumer.as_asgi()),
]
