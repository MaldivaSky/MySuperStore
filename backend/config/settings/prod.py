import sentry_sdk

from .base import *  # noqa: F401, F403

DEBUG = False

# ── Whitenoise (servir statics) ───────────────────────────────────────────────
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # noqa: F405
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ── S3 / R2 para mídia ───────────────────────────────────────────────────────
if env.bool("USE_S3", default=False):  # noqa: F405
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID")  # noqa: F405
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY")  # noqa: F405
    AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME")  # noqa: F405
    AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", default=None)  # noqa: F405
    AWS_S3_CUSTOM_DOMAIN = env("AWS_S3_CUSTOM_DOMAIN", default=None)  # noqa: F405
    AWS_DEFAULT_ACL = "public-read"
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/" if AWS_S3_CUSTOM_DOMAIN else f"{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/"

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
