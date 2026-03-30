"""Inbox service: syncs UAZAPI chats to DB and exposes unified inbox."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.domain.enums.enums import StatusChat
from app.domain.models.models import Chat, ConfiguracaoEmpresa, Conexao
from app.providers.uazapi.adapter import UazAPIAdapter
from app.providers.uazapi.client import UazAPIClient
from app.repositories.chat import ChatRepository
from app.repositories.contato import ContatoRepository

logger = get_logger(__name__)


def _phone_from_wa_chatid(wa_chatid: str) -> str | None:
    """Extract E.164 phone from a WA chat ID like '5511999887766@s.whatsapp.net'."""
    if not wa_chatid or "@" not in wa_chatid:
        return None
    local = wa_chatid.split("@")[0]
    if local.isdigit():
        return f"+{local}"
    return None


def _best_name(raw: dict) -> str | None:
    return (
        raw.get("lead_name")
        or raw.get("wa_contactName")
        or raw.get("wa_name")
        or raw.get("name")
    ) or None


class InboxService:
    def __init__(self, session: AsyncSession, adapter: UazAPIAdapter | None = None):
        self.session = session
        self.adapter = adapter or UazAPIAdapter()
        self.chat_repo = ChatRepository(session)
        self.contato_repo = ContatoRepository(session)

    # ── Private helpers ──────────────────────────

    async def _get_adapter(self, empresa_id) -> UazAPIAdapter:
        """Use empresa-specific UazAPI config when available."""
        stmt = select(ConfiguracaoEmpresa).where(ConfiguracaoEmpresa.empresa_id == empresa_id)
        result = await self.session.execute(stmt)
        config = result.scalar_one_or_none()
        if config and config.uazapi_server_url and config.uazapi_admin_token:
            client = UazAPIClient(
                base_url=config.uazapi_server_url,
                admin_token=config.uazapi_admin_token,
            )
            return UazAPIAdapter(client)
        return self.adapter

    # ── Public API ───────────────────────────────

    async def sync_from_uazapi(
        self,
        conexao: Conexao,
        limit: int = 50,
        offset: int = 0,
        sort: str = "-wa_lastMsgTimestamp",
    ) -> dict:
        """Pull chats from UAZAPI /chat/find, upsert contacts and chats in DB.

        Returns a summary dict: {synced, created_contacts, pagination}.
        """
        if not conexao.token_ref:
            raise ValueError(f"Conexão {conexao.id} sem token_ref configurado")

        adapter = await self._get_adapter(conexao.empresa_id)
        raw_response = await adapter.find_chats(
            token=conexao.token_ref,
            limit=limit,
            offset=offset,
            sort=sort,
        )

        chats_data: list[dict] = raw_response.get("chats", [])
        pagination: dict = raw_response.get("pagination", {})

        synced = 0
        created_contacts = 0

        for raw in chats_data:
            # Skip group chats – they don't map to individual contacts
            if raw.get("wa_isGroup"):
                continue

            wa_chatid: str = raw.get("wa_chatid", "") or ""
            phone = _phone_from_wa_chatid(wa_chatid) or raw.get("phone") or ""

            if not phone:
                logger.warning("inbox_sync_skip_no_phone", wa_chatid=wa_chatid)
                continue

            # Normalise: ensure leading "+"
            if not phone.startswith("+") and phone.isdigit():
                phone = f"+{phone}"

            name = _best_name(raw)

            # ── Upsert contact ──────────────────────────
            contato, created = await self.contato_repo.find_or_create(
                empresa_id=conexao.empresa_id,
                telefone_e164=phone,
                nome=name,
                whatsapp_id=wa_chatid or None,
                origem="uazapi_sync",
            )
            if created:
                created_contacts += 1
            else:
                # Update name / whatsapp_id if previously missing
                if not contato.nome and name:
                    contato.nome = name
                if not contato.whatsapp_id and wa_chatid:
                    contato.whatsapp_id = wa_chatid

            wa_ts_ms: int = raw.get("wa_lastMsgTimestamp") or 0
            wa_ts: int = wa_ts_ms // 1000 if wa_ts_ms else 0  # store as seconds (INT fits)
            wa_unread: int = raw.get("wa_unreadCount") or 0

            # ── Upsert chat ─────────────────────────────
            chat: Chat | None = None
            if wa_chatid:
                chat = await self.chat_repo.get_by_wa_chat_id(conexao.id, wa_chatid)

            if chat is None:
                # Fall back to any active chat for this contact+connection
                chat = await self.chat_repo.get_active_chat(
                    conexao.empresa_id, contato.id, conexao.id
                )

            if chat is None:
                chat = Chat(
                    empresa_id=conexao.empresa_id,
                    contato_id=contato.id,
                    conexao_id=conexao.id,
                    status=StatusChat.ABERTO,
                    origem_abertura="uazapi_sync",
                    wa_chat_id=wa_chatid or None,
                    wa_unread_count=wa_unread,
                    wa_last_msg_timestamp=wa_ts or None,
                    wa_name=name,
                )
                if wa_ts:
                    chat.ultima_mensagem_em = datetime.fromtimestamp(wa_ts, tz=timezone.utc)
                self.session.add(chat)
            else:
                if wa_chatid and not chat.wa_chat_id:
                    chat.wa_chat_id = wa_chatid
                chat.wa_unread_count = wa_unread
                chat.wa_last_msg_timestamp = wa_ts or None
                chat.wa_name = name
                if wa_ts:
                    chat.ultima_mensagem_em = datetime.fromtimestamp(wa_ts, tz=timezone.utc)

            synced += 1

        await self.session.flush()

        logger.info(
            "inbox_sync_done",
            conexao_id=str(conexao.id),
            synced=synced,
            created_contacts=created_contacts,
        )
        return {
            "synced": synced,
            "created_contacts": created_contacts,
            "pagination": pagination,
        }

    async def list_inbox(
        self,
        empresa_id,
        conexao_id=None,
        status_list: list[str] | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[Sequence[Chat], int]:
        """Return paginated inbox chats. Each Chat has .contato pre-loaded via selectin."""
        return await self.chat_repo.list_inbox(
            empresa_id=empresa_id,
            conexao_id=conexao_id,
            status_list=status_list,
            limit=limit,
            offset=offset,
        )
