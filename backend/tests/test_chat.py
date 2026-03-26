"""Tests for chat service logic."""

import uuid

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.domain.enums.enums import StatusChat
from app.domain.models.models import Chat
from app.services.chat import ChatService


@pytest.mark.anyio
async def test_open_chat_creates_chat():
    session = AsyncMock()
    svc = ChatService(session)
    svc.repo = AsyncMock()
    svc.repo.create = AsyncMock()

    emp_id = uuid.uuid4()
    contato_id = uuid.uuid4()
    conexao_id = uuid.uuid4()
    equipe_id = uuid.uuid4()
    agente_id = uuid.uuid4()

    chat = await svc.open_chat(
        empresa_id=emp_id,
        contato_id=contato_id,
        conexao_id=conexao_id,
        equipe_id=equipe_id,
        agente_ia_id=agente_id,
    )
    svc.repo.create.assert_called_once()
    assert chat.empresa_id == emp_id
    assert chat.contato_id == contato_id
    assert chat.conexao_id == conexao_id
    assert chat.equipe_id == equipe_id
    assert chat.agente_ia_id == agente_id
    assert chat.status == StatusChat.ABERTO
    assert chat.graph_thread_id is not None


@pytest.mark.anyio
async def test_close_chat():
    session = AsyncMock()
    svc = ChatService(session)
    svc.repo = AsyncMock()
    svc.repo.update_fields = AsyncMock(return_value=MagicMock(spec=Chat))

    chat_id = uuid.uuid4()
    result = await svc.close_chat(chat_id, motivo="teste")
    svc.repo.update_fields.assert_called_once()
    call_kwargs = svc.repo.update_fields.call_args
    assert call_kwargs[1]["status"] == StatusChat.ENCERRADO
    assert call_kwargs[1]["motivo_encerramento"] == "teste"


@pytest.mark.anyio
async def test_handoff_to_human():
    session = AsyncMock()
    svc = ChatService(session)
    svc.repo = AsyncMock()
    svc.repo.update_fields = AsyncMock(return_value=MagicMock(spec=Chat))

    chat_id = uuid.uuid4()
    await svc.handoff_to_human(chat_id)
    call_kwargs = svc.repo.update_fields.call_args
    assert call_kwargs[1]["status"] == StatusChat.AGUARDANDO_HUMANO


@pytest.mark.anyio
async def test_resume_chat():
    session = AsyncMock()
    svc = ChatService(session)
    svc.repo = AsyncMock()
    svc.repo.update_fields = AsyncMock(return_value=MagicMock(spec=Chat))

    chat_id = uuid.uuid4()
    agente_id = uuid.uuid4()
    await svc.resume_chat(chat_id, agente_ia_id=agente_id)
    call_kwargs = svc.repo.update_fields.call_args
    assert call_kwargs[1]["status"] == StatusChat.ABERTO
    assert call_kwargs[1]["agente_ia_id"] == agente_id


@pytest.mark.anyio
async def test_get_active_chat_delegates_to_repo():
    session = AsyncMock()
    svc = ChatService(session)
    svc.repo = AsyncMock()

    active = MagicMock(spec=Chat)
    svc.repo.get_active_chat = AsyncMock(return_value=active)

    emp_id = uuid.uuid4()
    contato_id = uuid.uuid4()
    conexao_id = uuid.uuid4()
    result = await svc.get_active_chat(emp_id, contato_id, conexao_id)
    assert result is active


@pytest.mark.anyio
async def test_assign_agent():
    session = AsyncMock()
    svc = ChatService(session)
    svc.repo = AsyncMock()
    svc.repo.update_fields = AsyncMock(return_value=MagicMock(spec=Chat))

    chat_id = uuid.uuid4()
    agente_id = uuid.uuid4()
    await svc.assign_agent(chat_id, agente_id)
    svc.repo.update_fields.assert_called_once_with(chat_id, agente_ia_id=agente_id)
