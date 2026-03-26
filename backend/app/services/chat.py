import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.domain.enums.enums import StatusChat, CHAT_STATUS_ATIVOS
from app.domain.models.models import Chat
from app.repositories.chat import ChatRepository

logger = get_logger(__name__)


class ChatService:
    def __init__(self, session: AsyncSession):
        self.repo = ChatRepository(session)
        self.session = session

    async def get_or_none(self, chat_id: uuid.UUID) -> Chat | None:
        return await self.repo.get_by_id(chat_id)

    async def get_active_chat(
        self,
        empresa_id: uuid.UUID,
        contato_id: uuid.UUID,
        conexao_id: uuid.UUID,
    ) -> Chat | None:
        return await self.repo.get_active_chat(empresa_id, contato_id, conexao_id)

    async def open_chat(
        self,
        empresa_id: uuid.UUID,
        contato_id: uuid.UUID,
        conexao_id: uuid.UUID,
        filial_id: uuid.UUID | None = None,
        equipe_id: uuid.UUID | None = None,
        agente_ia_id: uuid.UUID | None = None,
        oportunidade_id: uuid.UUID | None = None,
        status: StatusChat = StatusChat.ABERTO,
        origem_abertura: str = "webhook",
    ) -> Chat:
        chat = Chat(
            empresa_id=empresa_id,
            contato_id=contato_id,
            conexao_id=conexao_id,
            filial_id=filial_id,
            equipe_id=equipe_id,
            agente_ia_id=agente_ia_id,
            oportunidade_id=oportunidade_id,
            status=status,
            origem_abertura=origem_abertura,
            graph_thread_id=uuid.uuid4().hex,
        )
        await self.repo.create(chat)
        logger.info("chat_opened", chat_id=str(chat.id), status=status.value)
        return chat

    async def update_last_message(self, chat_id: uuid.UUID) -> None:
        await self.repo.update_fields(chat_id, ultima_mensagem_em=datetime.now(timezone.utc))

    async def close_chat(self, chat_id: uuid.UUID, motivo: str = "encerrado") -> Chat | None:
        return await self.repo.update_fields(
            chat_id,
            status=StatusChat.ENCERRADO,
            motivo_encerramento=motivo,
            encerrado_em=datetime.now(timezone.utc),
        )

    async def handoff_to_human(self, chat_id: uuid.UUID) -> Chat | None:
        return await self.repo.update_fields(chat_id, status=StatusChat.AGUARDANDO_HUMANO)

    async def resume_chat(self, chat_id: uuid.UUID, agente_ia_id: uuid.UUID | None = None) -> Chat | None:
        updates: dict = {"status": StatusChat.ABERTO}
        if agente_ia_id:
            updates["agente_ia_id"] = agente_ia_id
        return await self.repo.update_fields(chat_id, **updates)

    async def assign_agent(self, chat_id: uuid.UUID, agente_ia_id: uuid.UUID) -> Chat | None:
        return await self.repo.update_fields(chat_id, agente_ia_id=agente_ia_id)

    async def update_context(self, chat_id: uuid.UUID, context: dict) -> Chat | None:
        return await self.repo.update_fields(chat_id, contexto_resumido=context)

    async def list_idle(self, idle_minutes: int = 60) -> list:
        return list(await self.repo.list_idle(idle_minutes))
