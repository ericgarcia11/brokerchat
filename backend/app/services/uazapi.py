"""UazAPI service: orchestrates sending via adapter + persisting results."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger
from app.domain.enums.enums import StatusEnvio, TipoMensagem, AutorTipo, Canal, Provedor
from app.domain.models.models import Conexao, ConfiguracaoEmpresa, Mensagem
from app.providers.uazapi.adapter import UazAPIAdapter
from app.providers.uazapi.client import UazAPIClient
from app.repositories.conexao import ConexaoRepository
from app.services.message import MessageService

logger = get_logger(__name__)


def _extract_qr(data: dict) -> str | None:
    """Extract QR code from UazAPI response, handling multiple formats."""
    for key in ("qrcode", "qrCode", "QRCode", "base64", "qr", "image", "qr_code", "qr_image", "value"):
        val = data.get(key)
        if val and isinstance(val, str) and len(val) > 50:
            return val
    # Handle nested dict or raw string in common wrapper keys
    for key in ("data", "result", "instance"):
        inner = data.get(key)
        if isinstance(inner, str) and len(inner) > 50:
            return inner
        if isinstance(inner, dict):
            found = _extract_qr(inner)
            if found:
                return found
    return None


def _extract_pairing_code(data: dict) -> str | None:
    """Extract pairing code from UazAPI response."""
    for key in ("pairingCode", "pairing_code", "paring_code", "paircode", "code"):
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

    async def _get_empresa_adapter(self, empresa_id: uuid.UUID) -> UazAPIAdapter:
        """Build an adapter using the empresa's UazAPI config, falling back to env vars."""
        stmt = select(ConfiguracaoEmpresa).where(ConfiguracaoEmpresa.empresa_id == empresa_id)
        result = await self.session.execute(stmt)
        config = result.scalar_one_or_none()
        server_url = (config and config.uazapi_server_url) or settings.UAZAPI_BASE_URL
        admin_token = (config and config.uazapi_admin_token) or settings.UAZAPI_ADMIN_TOKEN
        client = UazAPIClient(base_url=server_url, admin_token=admin_token)
        return UazAPIAdapter(client=client)

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

    async def create_instance(self, name: str) -> dict:
        return await self.adapter.create_instance(name)

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
        """Create UazAPI instance + call connect to get QR + save connection to DB."""
        adapter = await self._get_empresa_adapter(empresa_id)
        webhook_secret = uuid.uuid4().hex

        # 1. Create the instance (only name is required by UazAPI)
        result = await adapter.create_instance(name=nome)
        logger.info("uazapi_instance_created", result_keys=list(result.keys()))

        token = (
            result.get("token")
            or result.get("instance", {}).get("token")
            or result.get("data", {}).get("token")
            or ""
        )
        instance_data = result.get("instance") or {}
        uazapi_id = str(instance_data.get("id") or result.get("id") or "")
        logger.info("uazapi_token_extracted", has_token=bool(token))

        # 2. Save to DB first so we have an ID
        repo = ConexaoRepository(self.session)
        conexao = Conexao(
            empresa_id=empresa_id,
            filial_id=filial_id,
            equipe_padrao_id=equipe_padrao_id,
            nome=nome,
            telefone_e164=telefone_e164,
            token_ref=token,
            webhook_secret_ref=webhook_secret,
            identificador_externo=uazapi_id or result.get("name") or nome,
            uazapi_status="disconnected",
            profile_name=instance_data.get("profileName"),
            profile_pic_url=instance_data.get("profilePicUrl"),
            ativo=False,
        )
        conexao = await repo.create(conexao)

        # 3. Call /instance/connect to generate QR code
        qr_data: dict = {}
        if token:
            try:
                qr_data = await adapter.connect_instance(token)
                logger.info("uazapi_connect_response", qr_keys=list(qr_data.keys()))
            except Exception as e:
                logger.warning("connect_instance_failed", error=str(e))

        # QR may also be in the initial create response instance object
        qrcode = _extract_qr(qr_data) or _extract_qr(instance_data)
        paircode = _extract_pairing_code(qr_data) or _extract_pairing_code(instance_data)

        return conexao, {
            "instance_token": token,
            "qrcode": qrcode,
            "pairing_code": paircode,
            "status": "disconnected",
        }

    async def sync_connections(self, empresa_id: uuid.UUID) -> list[Conexao]:
        """Fetch all instances from UazAPI and upsert into DB."""
        from datetime import datetime, timezone
        adapter = await self._get_empresa_adapter(empresa_id)
        instances = await adapter.list_all_instances()
        logger.info("uazapi_sync", empresa_id=str(empresa_id), count=len(instances))

        stmt = select(Conexao).where(Conexao.empresa_id == empresa_id)
        result = await self.session.execute(stmt)
        existing = list(result.scalars().all())

        by_token: dict[str, Conexao] = {c.token_ref: c for c in existing if c.token_ref}
        by_ext_id: dict[str, Conexao] = {c.identificador_externo: c for c in existing if c.identificador_externo}

        now = datetime.now(timezone.utc)

        for inst in instances:
            token = inst.get("token", "")
            uazapi_id = str(inst.get("id", ""))
            name = inst.get("name", "")
            status = inst.get("status", "")

            conexao: Conexao | None = (
                by_token.get(token)
                or by_ext_id.get(uazapi_id)
                or by_ext_id.get(name)
            )

            if conexao is None:
                webhook_secret = uuid.uuid4().hex
                conexao = Conexao(
                    empresa_id=empresa_id,
                    nome=inst.get("profileName") or name or uazapi_id,
                    canal=Canal.WHATSAPP,
                    provedor=Provedor.UAZAPI,
                    telefone_e164=inst.get("owner", f"+{uazapi_id}") or f"+{uazapi_id}",
                    identificador_externo=uazapi_id or name,
                    token_ref=token or None,
                    webhook_secret_ref=webhook_secret,
                    ativo=status == "connected",
                )
                self.session.add(conexao)
                if token:
                    by_token[token] = conexao
                if uazapi_id:
                    by_ext_id[uazapi_id] = conexao

            # Always refresh live fields
            conexao.uazapi_status = status
            conexao.profile_name = inst.get("profileName")
            conexao.profile_pic_url = inst.get("profilePicUrl")
            conexao.ativo = status == "connected"
            conexao.synced_at = now
            if token and not conexao.token_ref:
                conexao.token_ref = token
            if uazapi_id and not conexao.identificador_externo:
                conexao.identificador_externo = uazapi_id

        await self.session.commit()

        stmt2 = select(Conexao).where(Conexao.empresa_id == empresa_id).order_by(Conexao.nome)
        result2 = await self.session.execute(stmt2)
        return list(result2.scalars().all())

    async def get_qr_code(self, conexao: Conexao) -> dict:
        """Check status; if not connected, call /instance/connect to refresh QR."""
        token = conexao.token_ref or ""
        try:
            status_data = await self.adapter.get_instance_status(token)
            # UazAPI may return {"instance": {status: ...}, ...} or {status: ...}
            instance = status_data.get("instance")
            if isinstance(instance, dict) and "status" in instance:
                raw_state = instance["status"]
            else:
                raw_state = status_data.get("status") or status_data.get("state") or "disconnected"
            # Normalize to expected values
            if str(raw_state).lower() in ("connected", "open", "true", "1"):
                state = "connected"
            elif str(raw_state).lower() in ("connecting", "pending", "false", "0"):
                state = "connecting"
            else:
                state = "disconnected"
        except Exception as e:
            logger.warning("status_check_failed", error=str(e))
            state = "disconnected"

        if state == "connected":
            # Mark as connected in DB
            conexao.ativo = True
            conexao.uazapi_status = "open"
            await self.session.commit()
            return {"qrcode": None, "pairing_code": None, "status": "connected"}

        # Trigger connect to get a fresh QR code
        try:
            qr_data = await self.adapter.connect_instance(token)
            logger.info("uazapi_connect_response", qr_keys=list(qr_data.keys()))
            return {
                "qrcode": _extract_qr(qr_data),
                "pairing_code": _extract_pairing_code(qr_data),
                "status": state,
            }
        except Exception as e:
            logger.warning("connect_instance_failed", error=str(e))
            return {"qrcode": None, "pairing_code": None, "status": state}

    async def delete_connection(self, conexao: Conexao) -> None:
        """Delete instance from UazAPI then remove from DB."""
        if conexao.token_ref:
            try:
                adapter = await self._get_empresa_adapter(conexao.empresa_id)
                await adapter.delete_instance(conexao.token_ref)
                logger.info("uazapi_instance_deleted", conexao_id=str(conexao.id))
            except Exception as e:
                logger.warning("uazapi_delete_failed", error=str(e))
        await self.session.delete(conexao)
        await self.session.commit()
