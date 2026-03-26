"""Tests for webhook endpoint (route-level)."""

import uuid

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.domain.enums.enums import Canal, Provedor
from app.domain.models.models import Conexao, EventoWebhook


@pytest.mark.anyio
@patch("app.api.routes.webhooks.process_webhook_event")
async def test_webhook_valid_connection(mock_task, client, session):
    """Valid secret → saves event → dispatches task → returns 200."""
    conexao = MagicMock(spec=Conexao)
    conexao.id = uuid.uuid4()
    conexao.canal = Canal.WHATSAPP

    event = MagicMock(spec=EventoWebhook)
    event.id = uuid.uuid4()

    with (
        patch("app.api.routes.webhooks.ConexaoRepository") as MockRepo,
        patch("app.api.routes.webhooks.WebhookEventService") as MockSvc,
    ):
        repo_instance = AsyncMock()
        repo_instance.get_by_webhook_secret = AsyncMock(return_value=conexao)
        MockRepo.return_value = repo_instance

        svc_instance = AsyncMock()
        svc_instance.save_event = AsyncMock(return_value=(event, True))
        MockSvc.return_value = svc_instance

        payload = {
            "messages": [
                {
                    "key": {"id": "msg-abc", "remoteJid": "5515999999999@s.whatsapp.net"},
                    "message": {"conversation": "Olá"},
                }
            ]
        }
        resp = await client.post("/webhooks/uazapi/test-secret-123", json=payload)

    assert resp.status_code == 200
    assert resp.json() == {"status": "received"}
    mock_task.delay.assert_called_once()


@pytest.mark.anyio
async def test_webhook_unknown_secret_returns_404(client, session):
    """Unknown webhook secret → 404."""
    with patch("app.api.routes.webhooks.ConexaoRepository") as MockRepo:
        repo_instance = AsyncMock()
        repo_instance.get_by_webhook_secret = AsyncMock(return_value=None)
        MockRepo.return_value = repo_instance

        resp = await client.post("/webhooks/uazapi/unknown-secret", json={"event": "test"})

    assert resp.status_code == 404


@pytest.mark.anyio
@patch("app.api.routes.webhooks.process_webhook_event")
async def test_webhook_duplicate_not_dispatched(mock_task, client, session):
    """Duplicate event → is_new=False → task NOT dispatched."""
    conexao = MagicMock(spec=Conexao)
    conexao.id = uuid.uuid4()

    event = MagicMock(spec=EventoWebhook)
    event.id = uuid.uuid4()

    with (
        patch("app.api.routes.webhooks.ConexaoRepository") as MockRepo,
        patch("app.api.routes.webhooks.WebhookEventService") as MockSvc,
    ):
        repo_instance = AsyncMock()
        repo_instance.get_by_webhook_secret = AsyncMock(return_value=conexao)
        MockRepo.return_value = repo_instance

        svc_instance = AsyncMock()
        svc_instance.save_event = AsyncMock(return_value=(event, False))
        MockSvc.return_value = svc_instance

        resp = await client.post("/webhooks/uazapi/valid-secret", json={"event": "dup"})

    assert resp.status_code == 200
    mock_task.delay.assert_not_called()
