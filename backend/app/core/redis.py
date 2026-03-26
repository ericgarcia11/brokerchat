import redis.asyncio as aioredis

from app.core.config import settings

redis_client = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
)


async def check_redis() -> bool:
    try:
        return await redis_client.ping()
    except Exception:
        return False


async def acquire_lock(key: str, timeout: int = 30) -> bool:
    return await redis_client.set(f"lock:{key}", "1", nx=True, ex=timeout)


async def release_lock(key: str) -> None:
    await redis_client.delete(f"lock:{key}")
