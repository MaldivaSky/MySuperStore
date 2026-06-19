import sentry_sdk

from .base import *  # noqa: F401, F403

DEBUG = False

# ── Whitenoise (servir statics) ───────────────────────────────────────────────
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
STORAGES["staticfiles"] = {
    "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
}

# ── Segurança ─────────────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ── Sentry ────────────────────────────────────────────────────────────────────
sentry_sdk.init(
    dsn=env("SENTRY_DSN", default=""),  # noqa: F405
    traces_sample_rate=0.2,
    profiles_sample_rate=0.1,
)
