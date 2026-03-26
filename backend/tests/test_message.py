"""Tests for message service logic."""

import uuid

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.domain.enums.enums import (
    AutorTipo,
    DirecaoMensagem,
    Provedor,
    StatusEnvio,
    TipoMensagem,
)
from app.domain.models.models import Mensagem
from app.services.message import MessageService


@pytest.mark.anyio
async def test_save_inbound_creates_message():
    session = AsyncMock()
    svc = MessageService(session)
    svc.repo = AsyncMock()
    svc.repo.get_by_external_id = AsyncMock(return_value=None)
    svc.repo.create = AsyncMock()

    msg = await svc.save_inbound(
        chat_id=uuid.uuid4(),
        texto="Olá, tenho interesse",
        mensagem_externa_id="ext-001",
    )
    svc.repo.create.assert_called_once()
    created = svc.repo.create.call_args[0][0]
    assert created.direcao == DirecaoMensagem.ENTRADA
    assert created.autor_tipo == AutorTipo.CONTATO
    assert created.texto == "Olá, tenho interesse"
    assert created.status_envio == StatusEnvio.ENTREGUE


@pytest.mark.anyio
async def test_save_inbound_dedup_returns_existing():
    session = AsyncMock()
    svc = MessageService(session)
    svc.repo = AsyncMock()

    existing = MagicMock(spec=Mensagem)
    existing.id = uuid.uuid4()
    existing.mensagem_externa_id = "ext-001"
    svc.repo.get_by_external_id = AsyncMock(return_value=existing)

    msg = await svc.save_inbound(
        chat_id=uuid.uuid4(),
        texto="Olá",
        mensagem_externa_id="ext-001",
    )
    assert msg is existing
    svc.repo.create.assert_not_called()


@pytest.mark.anyio
async def test_save_outbound_creates_pending_message():
    session = AsyncMock()
    svc = MessageService(session)
    svc.repo = AsyncMock()
    svc.repo.create = AsyncMock()

    msg = await svc.save_outbound(
        chat_id=uuid.uuid4(),
        texto="Resposta do agente",
        autor_tipo=AutorTipo.IA,
    )
    svc.repo.create.assert_called_once()
    created = svc.repo.create.call_args[0][0]
    assert created.direcao == DirecaoMensagem.SAIDA
    assert created.autor_tipo == AutorTipo.IA
    assert created.status_envio == StatusEnvio.PENDENTE


@pytest.mark.anyio
async def test_update_status():
    session = AsyncMock()
    svc = MessageService(session)
    svc.repo = AsyncMock()
    svc.repo.update_fields = AsyncMock()

    msg_id = uuid.uuid4()
    await svc.update_status(msg_id, StatusEnvio.ENVIADA, external_id="ext-002")
    svc.repo.update_fields.assert_called_once_with(
        msg_id, status_envio=StatusEnvio.ENVIADA, mensagem_externa_id="ext-002"
    )


@pytest.mark.anyio
async def test_update_status_without_external_id():
    session = AsyncMock()
    svc = MessageService(session)
    svc.repo = AsyncMock()
    svc.repo.update_fields = AsyncMock()

    msg_id = uuid.uuid4()
    await svc.update_status(msg_id, StatusEnvio.FALHA)
    svc.repo.update_fields.assert_called_once_with(msg_id, status_envio=StatusEnvio.FALHA)
