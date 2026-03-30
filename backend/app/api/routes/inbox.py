"""Inbox endpoints: sync chats from UazAPI and list the inbox."""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps.auth import AuthPayload, DBSession
from app.api.schemas.schemas import InboxChatRead, InboxListResponse, InboxSyncResponse
from app.repositories.conexao import ConexaoRepository
from app.services.inbox import InboxService

router = APIRouter(prefix="/inbox", tags=["inbox"])


# ── Sync ─────────────────────────────────────────
@router.post(
    "/sync/{conexao_id}",
    response_model=InboxSyncResponse,
    summary="Sincronizar chats da instância UAZAPI",
)
async def sync_inbox(
    conexao_id: uuid.UUID,
    session: DBSession,
    auth: AuthPayload,
    limit: int = Query(50, ge=1, le=200, description="Máximo de chats a buscar no UAZAPI"),
    offset: int = Query(0, ge=0),
    sort: str = Query("-wa_lastMsgTimestamp"),
):
    """Busca chats da instância UzAPI, salva contatos novos e cria/atualiza registros de chat."""
    empresa_id = uuid.UUID(auth["empresa_id"])
    repo = ConexaoRepository(session)
    conexao = await repo.get_by_id(conexao_id)
    if not conexao or conexao.empresa_id != empresa_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conexão não encontrada")

    svc = InboxService(session)
    result = await svc.sync_from_uazapi(conexao, limit=limit, offset=offset, sort=sort)
    return InboxSyncResponse(**result)


# ── List ──────────────────────────────────────────
@router.get(
    "/chats",
    response_model=InboxListResponse,
    summary="Listar chats do inbox",
)
async def list_inbox_chats(
    session: DBSession,
    auth: AuthPayload,
    conexao_id: uuid.UUID | None = Query(None, description="Filtrar por conexão"),
    status_filter: list[str] | None = Query(
        None,
        alias="status",
        description="Filtrar por status (aberto, aguardando_lead, aguardando_humano, encerrado)",
    ),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Retorna os chats paginados com informações do contato embutidas."""
    empresa_id = uuid.UUID(auth["empresa_id"])
    svc = InboxService(session)
    chats, total = await svc.list_inbox(
        empresa_id=empresa_id,
        conexao_id=conexao_id,
        status_list=status_filter,
        limit=limit,
        offset=offset,
    )
    items = [InboxChatRead.model_validate(c) for c in chats]
    return InboxListResponse(items=items, total=total, offset=offset, limit=limit)


# ── Single chat ───────────────────────────────────
@router.get(
    "/chats/{chat_id}",
    response_model=InboxChatRead,
    summary="Detalhes de um chat",
)
async def get_inbox_chat(
    chat_id: uuid.UUID,
    session: DBSession,
    auth: AuthPayload,
):
    """Retorna um único chat com informações do contato."""
    empresa_id = uuid.UUID(auth["empresa_id"])
    from app.repositories.chat import ChatRepository
    repo = ChatRepository(session)
    chat = await repo.get_by_id(chat_id)
    if not chat or chat.empresa_id != empresa_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat não encontrado")
    return InboxChatRead.model_validate(chat)
