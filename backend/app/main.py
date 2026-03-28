import uuid
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.core.storage import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    try:
        ensure_bucket()
    except Exception:
        pass
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_correlation_id(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID", uuid.uuid4().hex)
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(correlation_id=correlation_id)
    response: Response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    return response


# Register routes
from app.api.routes.health import router as health_router
from app.api.routes.webhooks import router as webhooks_router
from app.api.routes.auth import router as auth_router
from app.api.routes.admin_crud import router as admin_crud_router
from app.api.routes.admin_ops import router as admin_ops_router
from app.api.routes.cadence import router as cadence_router
from app.api.routes.configuracao import router as configuracao_router
from app.api.routes.configuracao import public_router as configuracao_public_router

app.include_router(health_router)
app.include_router(webhooks_router)
app.include_router(auth_router)
app.include_router(admin_crud_router)
app.include_router(admin_ops_router)
app.include_router(cadence_router)
app.include_router(configuracao_router)
app.include_router(configuracao_public_router)
