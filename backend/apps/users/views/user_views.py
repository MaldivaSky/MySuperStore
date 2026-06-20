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
        return Response(serializer.data)

