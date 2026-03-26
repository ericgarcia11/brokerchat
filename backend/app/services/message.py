import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.domain.enums.enums import DirecaoMensagem, AutorTipo, TipoMensagem, StatusEnvio, Provedor
from app.domain.models.models import Mensagem
from app.repositories.mensagem import MensagemRepository

logger = get_logger(__name__)


class MessageService:
    def __init__(self, session: AsyncSession):
        self.repo = MensagemRepository(session)
        self.session = session

    async def save_inbound(
        self,
        chat_id: uuid.UUID,
        texto: str | None,
        tipo: TipoMensagem = TipoMensagem.TEXTO,
        provedor: Provedor = Provedor.UAZAPI,
        mensagem_externa_id: str | None = None,
        mensagem_pai_externa_id: str | None = None,
        midia_url: str | None = None,
        payload: dict | None = None,
    ) -> Mensagem:
        if mensagem_externa_id:
            existing = await self.repo.get_by_external_id(provedor.value, mensagem_externa_id)
            if existing:
                logger.info("message_duplicate", external_id=mensagem_externa_id)
                return existing

        msg = Mensagem(
            chat_id=chat_id,
            direcao=DirecaoMensagem.ENTRADA,
            autor_tipo=AutorTipo.CONTATO,
            tipo=tipo,
            texto=texto,
            provedor=provedor,
            mensagem_externa_id=mensagem_externa_id,
            mensagem_pai_externa_id=mensagem_pai_externa_id,
            midia_url=midia_url,
            payload=payload,
            status_envio=StatusEnvio.ENTREGUE,
        )
        await self.repo.create(msg)
        return msg

    async def save_outbound(
        self,
        chat_id: uuid.UUID,
        texto: str | None,
        autor_tipo: AutorTipo = AutorTipo.IA,
        autor_id: uuid.UUID | None = None,
        tipo: TipoMensagem = TipoMensagem.TEXTO,
        midia_url: str | None = None,
        payload: dict | None = None,
    ) -> Mensagem:
        msg = Mensagem(
            chat_id=chat_id,
            direcao=DirecaoMensagem.SAIDA,
            autor_tipo=autor_tipo,
            autor_id=autor_id,
            tipo=tipo,
            texto=texto,
            midia_url=midia_url,
            payload=payload,
            status_envio=StatusEnvio.PENDENTE,
        )
        await self.repo.create(msg)
        return msg

    async def update_status(self, mensagem_id: uuid.UUID, status: StatusEnvio, external_id: str | None = None) -> None:
        updates: dict = {"status_envio": status}
        if external_id:
            updates["mensagem_externa_id"] = external_id
        await self.repo.update_fields(mensagem_id, **updates)

    async def list_by_chat(self, chat_id: uuid.UUID, limit: int = 100) -> list[Mensagem]:
        return list(await self.repo.list_by_chat(chat_id, limit))

    async def list_failed(self, limit: int = 50) -> list[Mensagem]:
        return list(await self.repo.list_failed(limit))
