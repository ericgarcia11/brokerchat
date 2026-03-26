"""Tests for webhook deduplication logic."""

import hashlib
import json
import uuid

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.domain.enums.enums import Provedor, StatusWebhook
from app.domain.models.models import EventoWebhook
from app.services.webhook_event import WebhookEventService


def _make_payload(**overrides) -> dict:
    base = {
        "messages": [{"key": {"id": "msg-001", "remoteJid": "551599@s.whatsapp.net"}}],
        "event": "messages.upsert",
    }
    base.update(overrides)
    return base


@pytest.mark.anyio
async def test_save_event_new_event():
    """A brand-new event should be created and is_new=True."""
    session = AsyncMock()
    svc = WebhookEventService(session)
    svc.repo = AsyncMock()
    svc.repo.get_by_external_id = AsyncMock(return_value=None)
    svc.repo.get_by_hash = AsyncMock(return_value=None)
    svc.repo.create = AsyncMock()

    payload = _make_payload()
    event, is_new = await svc.save_event(
        conexao_id=uuid.uuid4(),
        provedor=Provedor.UAZAPI,
        payload=payload,
        evento_externo_id="msg-001",
        tipo_evento="message",
    )
    assert is_new is True
    svc.repo.create.assert_called_once()


@pytest.mark.anyio
async def test_save_event_duplicate_by_external_id():
    """Duplicate by external_id returns existing event with is_new=False."""
    session = AsyncMock()
    svc = WebhookEventService(session)
    svc.repo = AsyncMock()

    existing = MagicMock(spec=EventoWebhook)
    existing.id = uuid.uuid4()
    svc.repo.get_by_external_id = AsyncMock(return_value=existing)

    payload = _make_payload()
    event, is_new = await svc.save_event(
        conexao_id=uuid.uuid4(),
        provedor=Provedor.UAZAPI,
        payload=payload,
        evento_externo_id="msg-001",
        tipo_evento="message",
    )
    assert is_new is False
    assert event is existing
    svc.repo.create.assert_not_called()


@pytest.mark.anyio
async def test_save_event_duplicate_by_hash():
    """When no external_id match but hash matches, it's a duplicate."""
    session = AsyncMock()
    svc = WebhookEventService(session)
    svc.repo = AsyncMock()

    existing = MagicMock(spec=EventoWebhook)
    existing.id = uuid.uuid4()
    svc.repo.get_by_external_id = AsyncMock(return_value=None)
    svc.repo.get_by_hash = AsyncMock(return_value=existing)

    payload = _make_payload()
    event, is_new = await svc.save_event(
        conexao_id=uuid.uuid4(),
        provedor=Provedor.UAZAPI,
        payload=payload,
        evento_externo_id="msg-001",
        tipo_evento="message",
    )
    assert is_new is False
    assert event is existing
    svc.repo.create.assert_not_called()


@pytest.mark.anyio
async def test_save_event_no_external_id_skips_id_check():
    """When evento_externo_id is None, skip ID-based check, go to hash check."""
    session = AsyncMock()
    svc = WebhookEventService(session)
    svc.repo = AsyncMock()
    svc.repo.get_by_hash = AsyncMock(return_value=None)
    svc.repo.create = AsyncMock()

    payload = _make_payload()
    event, is_new = await svc.save_event(
        conexao_id=uuid.uuid4(),
        provedor=Provedor.UAZAPI,
        payload=payload,
        evento_externo_id=None,
        tipo_evento="message",
    )
    assert is_new is True
    svc.repo.get_by_external_id.assert_not_called()


def test_hash_payload_deterministic():
    payload = {"b": 2, "a": 1}
    h1 = WebhookEventService._hash_payload(payload)
    h2 = WebhookEventService._hash_payload(payload)
    assert h1 == h2
    expected = hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()
    assert h1 == expected


def test_hash_payload_different_for_different_payloads():
    h1 = WebhookEventService._hash_payload({"a": 1})
    h2 = WebhookEventService._hash_payload({"a": 2})
    assert h1 != h2
