from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.serializers import UserProfileSerializer, UserProfileUpdateSerializer


class MeView(APIView):
    """GET/PATCH /api/v1/users/me/ — perfil do usuário autenticado."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            UserProfileSerializer(request.user, context={"request": request}).data
        )


from apps.users.models import UserSurvey
from apps.users.serializers import UserSurveySerializer

class UserSurveyView(APIView):
    """GET/POST /api/v1/users/me/survey/ — questionário de interesses do usuário."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        survey, _ = UserSurvey.objects.get_or_create(user=request.user)
        serializer = UserSurveySerializer(survey)
        return Response(serializer.data)

    def post(self, request):
        survey, _ = UserSurvey.objects.get_or_create(user=request.user)
        serializer = UserSurveySerializer(survey, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        try:
            from apps.crm.models import Lead
            lead = Lead.objects.filter(email=request.user.email).first()
            if lead:
                notes = lead.notes + "\n\n--- Pesquisa de Perfil (Atualizada) ---\n"
                for key, value in serializer.validated_data.items():
                    if value:
                        notes += f"- {key}: {value}\n"
                        
                # Define o Funnel Type com base na intenção
                intent = serializer.validated_data.get("primary_intent")
                if intent == "comprar":
                    lead.funnel_type = "comprador"
                elif intent in ["vender", "ambos"]:
                    lead.funnel_type = "lojista"
                    
                lead.notes = notes.strip()
                lead.save(update_fields=["notes", "funnel_type", "updated_at"])
        except Exception as e:
            print(f"Erro ao sincronizar pesquisa com CRM: {e}")

        return Response(serializer.data)


from rest_framework import viewsets
from apps.users.models import Address
from apps.users.serializers import AddressSerializer

class AddressViewSet(viewsets.ModelViewSet):
    """CRUD para endereços do usuário autenticado."""
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

