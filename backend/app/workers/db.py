"""Synchronous DB session for Celery workers."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# Sync engine for celery
_sync_engine = create_engine(settings.DATABASE_URL_SYNC, pool_size=5, max_overflow=5, pool_pre_ping=True)
SyncSessionFactory = sessionmaker(bind=_sync_engine, expire_on_commit=False)

# Async engine for async tasks
_async_engine = create_async_engine(settings.DATABASE_URL, pool_size=5, max_overflow=5, pool_pre_ping=True)
AsyncSessionFactory = async_sessionmaker(bind=_async_engine, class_=AsyncSession, expire_on_commit=False)


def get_sync_session() -> Session:
    return SyncSessionFactory()
