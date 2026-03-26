"""Operational admin endpoints: chat, messages, UazAPI."""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps.auth import DBSession, AuthPayload
from app.api.schemas.schemas import (
    ChatRead,
    MensagemRead,
    SendMessageRequest,
    CreateInstanceRequest,
    ProvisionConnectionRequest,
    ProvisionConnectionResponse,
    QRCodeResponse,
    ConnectionStatusResponse,
    ConexaoRead,
    HandoffRequest,
    AssignAgentRequest,
    MessageResponse,
)
from app.domain.enums.enums import StatusChat
from app.repositories.chat import ChatRepository
from app.repositories.conexao import ConexaoRepository
from app.repositories.crud import AgenteIARepository
from app.services.chat import ChatService
from app.services.message import MessageService
from app.services.uazapi import UazapiService
from app.workers.tasks.message import send_outbound_message

router = APIRouter(prefix="/admin", tags=["admin-ops"])


# ── Chats ────────────────────────────────────────
@router.get("/chats", response_model=list[ChatRead])
async def list_chats(
    session: DBSession, auth: AuthPayload,
    empresa_id: uuid.UUID | None = None,
    offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
):
    repo = ChatRepository(session)
    filters = {}
    if empresa_id:
        filters["empresa_id"] = empresa_id
    return list(await repo.list_all(filters=filters, offset=offset, limit=limit))


@router.get("/chats/{chat_id}", response_model=ChatRead)
async def get_chat(chat_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    repo = ChatRepository(session)
    chat = await repo.get_by_id(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat


@router.get("/chats/{chat_id}/mensagens", response_model=list[MensagemRead])
async def list_chat_messages(
    chat_id: uuid.UUID, session: DBSession, auth: AuthPayload,
    limit: int = Query(100, ge=1, le=500),
):
    svc = MessageService(session)
    return await svc.list_by_chat(chat_id, limit)


@router.post("/chats/{chat_id}/handoff", response_model=MessageResponse)
async def handoff_chat(chat_id: uuid.UUID, body: HandoffRequest, session: DBSession, auth: AuthPayload):
    svc = ChatService(session)
    chat = await svc.get_or_none(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    await svc.handoff_to_human(chat_id)
    return MessageResponse(message="Chat transferred to human")


@router.post("/chats/{chat_id}/close", response_model=MessageResponse)
async def close_chat(chat_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    svc = ChatService(session)
    await svc.close_chat(chat_id, motivo="fechado pelo admin")
    return MessageResponse(message="Chat closed")


@router.post("/chats/{chat_id}/resume", response_model=MessageResponse)
async def resume_chat(chat_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    svc = ChatService(session)
    await svc.resume_chat(chat_id)
    return MessageResponse(message="Chat resumed")


@router.post("/chats/{chat_id}/assign-agent", response_model=MessageResponse)
async def assign_agent(chat_id: uuid.UUID, body: AssignAgentRequest, session: DBSession, auth: AuthPayload):
    svc = ChatService(session)
    await svc.assign_agent(chat_id, body.agente_ia_id)
    return MessageResponse(message="Agent assigned")


# ── Messages ─────────────────────────────────────
@router.post("/messages/send", response_model=MessageResponse)
async def send_message(body: SendMessageRequest, session: DBSession, auth: AuthPayload):
    msg_svc = MessageService(session)

    if body.text:
        msg = await msg_svc.save_outbound(chat_id=body.chat_id, texto=body.text)
    elif body.media_url:
        msg = await msg_svc.save_outbound(chat_id=body.chat_id, texto=None, midia_url=body.media_url)
    else:
        raise HTTPException(status_code=400, detail="text or media_url required")

    await session.commit()
    send_outbound_message.delay(str(msg.id), str(body.conexao_id), body.phone)
    return MessageResponse(message=f"Message queued: {msg.id}")


# ── UazAPI ───────────────────────────────────────
@router.post("/uazapi/instances", tags=["uazapi"])
async def create_uazapi_instance(body: CreateInstanceRequest, session: DBSession, auth: AuthPayload):
    svc = UazapiService(session)
    result = await svc.create_instance(body.name, body.phone, body.webhook_url)
    return result


@router.post("/connections/provision", response_model=ProvisionConnectionResponse, tags=["connections"])
async def provision_connection(body: ProvisionConnectionRequest, session: DBSession, auth: AuthPayload):
    """Create a UazAPI instance + save connection to DB. Returns QR code for pairing."""
    svc = UazapiService(session)
    conexao, extras = await svc.provision_connection(
        empresa_id=body.empresa_id,
        nome=body.nome,
        telefone_e164=body.telefone_e164,
        filial_id=body.filial_id,
        equipe_padrao_id=body.equipe_padrao_id,
    )
    return ProvisionConnectionResponse(
        connection=ConexaoRead.model_validate(conexao),
        instance_token=extras["instance_token"],
        qrcode=extras.get("qrcode"),
        pairing_code=extras.get("pairing_code"),
        status=extras.get("status", "disconnected"),
    )


@router.get("/connections/{connection_id}/qrcode", response_model=QRCodeResponse, tags=["connections"])
async def get_connection_qrcode(connection_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    """Fetch current QR code for an existing connection. Used for polling during pairing."""
    repo = ConexaoRepository(session)
    conexao = await repo.get_by_id(connection_id)
    if not conexao:
        raise HTTPException(status_code=404, detail="Connection not found")
    svc = UazapiService(session)
    result = await svc.get_qr_code(conexao)
    return QRCodeResponse(
        qrcode=result.get("qrcode"),
        pairing_code=result.get("pairing_code"),
        status=result.get("status", "disconnected"),
    )


@router.get("/uazapi/connections/{connection_id}/status", response_model=ConnectionStatusResponse, tags=["uazapi"])
async def get_uazapi_status(connection_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    repo = ConexaoRepository(session)
    conexao = await repo.get_by_id(connection_id)
    if not conexao:
        raise HTTPException(status_code=404, detail="Connection not found")
    svc = UazapiService(session)
    raw = await svc.get_connection_status(conexao)
    return ConnectionStatusResponse(
        status=raw.get("state") or raw.get("status", "disconnected"),
        phone=raw.get("phone"),
        name=raw.get("name"),
    )
