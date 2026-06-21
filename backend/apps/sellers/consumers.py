import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"
        self.user = self.scope["user"]

        if self.user.is_anonymous:
            await self.close()
            return

        # Verifica se a sala existe
        room_exists = await self.check_room_exists(self.room_id)
        if not room_exists:
            await self.close()
            return

        # Entra no grupo
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Sai do grupo
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Recebe mensagem do WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message")

        if message:
            # Salva no BD
            saved_msg = await self.save_message(self.room_id, self.user, message)

            # Envia pro grupo
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "id": str(saved_msg.id),
                    "message": saved_msg.message,
                    "sender_id": str(self.user.id),
                    "sender_name": self.user.first_name or self.user.email,
                    "created_at": saved_msg.created_at.isoformat(),
                }
            )

    # Recebe do grupo da sala
    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def check_room_exists(self, room_id):
        return ChatRoom.objects.filter(id=room_id).exists()

    @database_sync_to_async
    def save_message(self, room_id, user, message_text):
        room = ChatRoom.objects.get(id=room_id)
        msg = ChatMessage.objects.create(room=room, sender=user, message=message_text)
        room.save(update_fields=["updated_at"])  # Atualiza last activity
        return msg
