"""Tests for the health endpoint."""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.anyio
async def test_health_returns_ok(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "wwp-backend"


@pytest.mark.anyio
@patch("app.api.routes.health.check_storage", return_value=True)
@patch("app.api.routes.health.check_redis", new_callable=AsyncMock, return_value=True)
@patch("app.api.routes.health.check_db", new_callable=AsyncMock, return_value=True)
async def test_ready_all_ok(mock_db, mock_redis, mock_storage, client):
    resp = await client.get("/ready")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["checks"]["database"] == "ok"
    assert data["checks"]["redis"] == "ok"
    assert data["checks"]["storage"] == "ok"


@pytest.mark.anyio
@patch("app.api.routes.health.check_storage", return_value=True)
@patch("app.api.routes.health.check_redis", new_callable=AsyncMock, return_value=False)
@patch("app.api.routes.health.check_db", new_callable=AsyncMock, return_value=True)
async def test_ready_redis_down(mock_db, mock_redis, mock_storage, client):
    resp = await client.get("/ready")
    data = resp.json()
    assert data["status"] == "degraded"
    assert data["checks"]["redis"] == "fail"


@pytest.mark.anyio
@patch("app.api.routes.health.check_storage", return_value=False)
@patch("app.api.routes.health.check_redis", new_callable=AsyncMock, return_value=True)
@patch("app.api.routes.health.check_db", new_callable=AsyncMock, return_value=False)
async def test_ready_db_down(mock_db, mock_redis, mock_storage, client):
    resp = await client.get("/ready")
    data = resp.json()
    assert data["status"] == "degraded"
    assert data["checks"]["database"] == "fail"
    assert data["checks"]["storage"] == "warn"
