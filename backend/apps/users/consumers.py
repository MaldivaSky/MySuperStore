import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        self.group_name = f"user_{self.user.id}_notifications"

        # Entra no grupo
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Recebe do grupo
    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event["data"]))
