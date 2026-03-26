from fastapi import APIRouter

from app.core.database import check_db
from app.core.redis import check_redis
from app.core.storage import check_storage

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok", "service": "wwp-backend"}


@router.get("/ready")
async def ready():
    db_ok = await check_db()
    redis_ok = await check_redis()
    storage_ok = check_storage()

    all_ok = db_ok and redis_ok
    return {
        "status": "ready" if all_ok else "degraded",
        "checks": {
            "database": "ok" if db_ok else "fail",
            "redis": "ok" if redis_ok else "fail",
            "storage": "ok" if storage_ok else "warn",
        },
    }
