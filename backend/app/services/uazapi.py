"""UazAPI service: orchestrates sending via adapter + persisting results."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.domain.enums.enums import StatusEnvio, TipoMensagem, AutorTipo
from app.domain.models.models import Conexao, Mensagem
from app.providers.uazapi.adapter import UazAPIAdapter
from app.repositories.conexao import ConexaoRepository
from app.services.message import MessageService

logger = get_logger(__name__)


def _extract_qr(data: dict) -> str | None:
    """Extract QR code from UazAPI response, handling multiple formats."""
    for key in ("qrcode", "base64", "data", "qr", "image", "qr_code"):
        val = data.get(key)
        if val and isinstance(val, str) and len(val) > 50:
            return val
    # Nested in data key
    inner = data.get("data")
    if isinstance(inner, dict):
        return _extract_qr(inner)
    return None


def _extract_pairing_code(data: dict) -> str | None:
    """Extract pairing code from UazAPI response."""
    for key in ("pairingCode", "pairing_code", "paring_code", "code"):
        val = data.get(key)
        if val and isinstance(val, str):
            return val
    inner = data.get("data")
    if isinstance(inner, dict):
        return _extract_pairing_code(inner)
    return None


class UazapiService:
    def __init__(self, session: AsyncSession, adapter: UazAPIAdapter | None = None):
        self.session = session
        self.adapter = adapter or UazAPIAdapter()
        self.message_svc = MessageService(session)

    async def send_text(
        self,
        conexao: Conexao,
        phone: str,
        chat_id: uuid.UUID,
        text: str,
        autor_tipo: AutorTipo = AutorTipo.IA,
        autor_id: uuid.UUID | None = None,
    ) -> Mensagem:
        msg = await self.message_svc.save_outbound(
            chat_id=chat_id,
            texto=text,
            autor_tipo=autor_tipo,
            autor_id=autor_id,
        )
        try:
            result = await self.adapter.send_text(
                token=conexao.token_ref or "",
                phone=phone,
                text=text,
            )
            external_id = result.get("key", {}).get("id") or result.get("id")
            await self.message_svc.update_status(msg.id, StatusEnvio.ENVIADA, external_id=str(external_id) if external_id else None)
            logger.info("message_sent", msg_id=str(msg.id), external_id=external_id)
        except Exception as e:
            await self.message_svc.update_status(msg.id, StatusEnvio.FALHA)
            logger.error("message_send_failed", msg_id=str(msg.id), error=str(e))
        return msg

    async def send_media(
        self,
        conexao: Conexao,
        phone: str,
        chat_id: uuid.UUID,
        media_url: str,
        media_type: str = "image",
        caption: str | None = None,
    ) -> Mensagem:
        tipo_map = {"image": TipoMensagem.IMAGEM, "video": TipoMensagem.VIDEO, "document": TipoMensagem.DOCUMENTO}
        msg = await self.message_svc.save_outbound(
            chat_id=chat_id,
            texto=caption,
            tipo=tipo_map.get(media_type, TipoMensagem.DOCUMENTO),
            midia_url=media_url,
        )
        try:
            result = await self.adapter.send_media(
                token=conexao.token_ref or "",
                phone=phone,
                media_url=media_url,
                media_type=media_type,
                caption=caption,
            )
            external_id = result.get("key", {}).get("id") or result.get("id")
            await self.message_svc.update_status(msg.id, StatusEnvio.ENVIADA, external_id=str(external_id) if external_id else None)
        except Exception as e:
            await self.message_svc.update_status(msg.id, StatusEnvio.FALHA)
            logger.error("message_send_media_failed", msg_id=str(msg.id), error=str(e))
        return msg

    async def create_instance(self, name: str, phone: str, webhook_url: str) -> dict:
        return await self.adapter.create_instance(name, phone, webhook_url)

    async def get_connection_status(self, conexao: Conexao) -> dict:
        return await self.adapter.get_instance_status(token=conexao.token_ref or "")

    async def provision_connection(
        self,
        empresa_id: uuid.UUID,
        nome: str,
        telefone_e164: str,
        filial_id: uuid.UUID | None = None,
        equipe_padrao_id: uuid.UUID | None = None,
    ) -> tuple[Conexao, dict]:
        """Create UazAPI instance + save connection to DB in one step."""
        webhook_secret = uuid.uuid4().hex
        webhook_url = f"{settings.WEBHOOK_BASE_URL}/webhooks/uazapi/{webhook_secret}"

        result = await self.adapter.create_instance(
            name=nome,
            phone=telefone_e164,
            webhook_url=webhook_url,
        )
        logger.info("uazapi_instance_created", result=result)

        token = (
            result.get("token")
            or result.get("instance", {}).get("token")
            or result.get("data", {}).get("token")
            or ""
        )
        logger.info("uazapi_token_extracted", has_token=bool(token))

        repo = ConexaoRepository(self.session)
        conexao = Conexao(
            empresa_id=empresa_id,
            filial_id=filial_id,
            equipe_padrao_id=equipe_padrao_id,
            nome=nome,
            telefone_e164=telefone_e164,
            token_ref=token,
            webhook_secret_ref=webhook_secret,
            identificador_externo=result.get("name") or nome,
            ativo=True,
        )
        conexao = await repo.create(conexao)

        # Try to get QR code right away
        qr_data: dict = {}
        if token:
            try:
                qr_data = await self.adapter.get_qr_code(token)
                logger.info("uazapi_qr_response", qr_keys=list(qr_data.keys()))
            except Exception as e:
                logger.warning("qr_code_fetch_failed", error=str(e))

        return conexao, {
            "instance_token": token,
            "qrcode": _extract_qr(qr_data),
            "pairing_code": _extract_pairing_code(qr_data),
            "status": result.get("state") or result.get("status") or "disconnected",
        }

    async def get_qr_code(self, conexao: Conexao) -> dict:
        """Fetch current QR code for a connection."""
        token = conexao.token_ref or ""
        try:
            status_data = await self.adapter.get_instance_status(token)
            logger.info("uazapi_status_response", status_data=status_data)
            state = status_data.get("state") or status_data.get("status", "disconnected")
        except Exception as e:
            logger.warning("status_check_failed", error=str(e))
            state = "disconnected"

        if state == "connected":
            return {"qrcode": None, "pairing_code": None, "status": "connected"}

        try:
            qr_data = await self.adapter.get_qr_code(token)
            logger.info("uazapi_qr_response", qr_keys=list(qr_data.keys()))
            return {
                "qrcode": _extract_qr(qr_data),
                "pairing_code": _extract_pairing_code(qr_data),
                "status": state,
            }
        except Exception as e:
            logger.warning("qr_code_fetch_failed", error=str(e))
            return {"qrcode": None, "pairing_code": None, "status": state}
