"""Shared test fixtures."""

import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_session
from app.main import app

# Use an in-memory SQLite for tests or a test postgres:
TEST_DB_URL = settings.DATABASE_URL

_test_engine = create_async_engine(TEST_DB_URL, echo=False)
_test_session_factory = async_sessionmaker(bind=_test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    async with _test_session_factory() as sess:
        yield sess
        await sess.rollback()


@pytest_asyncio.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def _override_session():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_session] = _override_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def empresa_id() -> uuid.UUID:
    return uuid.UUID("00000000-0000-0000-0000-000000000001")
