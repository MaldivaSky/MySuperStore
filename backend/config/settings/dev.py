from .base import *  # noqa: F401, F403

DEBUG = True

INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405

MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405

INTERNAL_IPS = ["127.0.0.1"]

# Por padrão imprime no console; defina EMAIL_BACKEND=...smtp.EmailBackend no .env
# (com as MAIL_* preenchidas) para enviar e-mails reais em desenvolvimento.
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend")  # noqa: F405

CORS_ALLOW_ALL_ORIGINS = True
