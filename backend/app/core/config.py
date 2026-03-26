from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    # App
    APP_NAME: str = "wwp-backend"
    APP_ENV: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_KEY: str = "changeme-admin-api-key"
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000"])

    # JWT
    JWT_SECRET_KEY: str = "changeme-jwt-secret-at-least-32-chars!!"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # Database (PostgreSQL externo)
    DATABASE_URL: str = "postgresql+asyncpg://wwp:wwp_secret@localhost:5432/wwp"
    DATABASE_URL_SYNC: str = "postgresql://wwp:wwp_secret@localhost:5432/wwp"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "wwp-media"
    MINIO_USE_SSL: bool = False
    MINIO_PUBLIC_URL: str = "http://localhost:9000"

    # UazAPI
    UAZAPI_BASE_URL: str = "https://sua-instancia.uazapi.com"
    UAZAPI_ADMIN_TOKEN: str = "changeme-uazapi-admin-token"

    # LLM
    LLM_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = "sk-changeme"
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_TEMPERATURE: float = 0.3

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 120

    # Webhook
    WEBHOOK_BASE_URL: str = "https://seu-dominio.com"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


settings = Settings()
