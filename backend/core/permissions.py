from rest_framework.permissions import BasePermission


class IsSeller(BasePermission):
    """Usuário tem role=seller OU admin com loja cadastrada."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("seller", "admin"):
            return hasattr(request.user, "seller_profile")
        return False


class IsApprovedSeller(BasePermission):
    """Usuário é vendedor com status=approved no Mercado Pago."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        try:
            return request.user.seller_profile.is_approved
        except AttributeError:
            return False


class IsPlatformAdmin(BasePermission):
    """Usuário tem role=admin."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsProductOwner(BasePermission):
    """Vendedor pode acessar somente seus próprios produtos."""
    def has_object_permission(self, request, view, obj):
        try:
            return obj.seller == request.user.seller_profile
        except AttributeError:
            return False


class IsOrderOwner(BasePermission):
    """Usuário pode acessar somente seus próprios pedidos."""
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
