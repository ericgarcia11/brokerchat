"""Mapper: transforms raw UazAPI webhook payloads into canonical internal format.

Designed to be tolerant of missing fields and structure changes.
Unknown fields are preserved in `raw_extras`.
"""

from typing import Any

from app.core.logging import get_logger
from app.domain.enums.enums import TipoMensagem

logger = get_logger(__name__)

# Known UazAPI message type mappings
_TYPE_MAP: dict[str, TipoMensagem] = {
    "chat": TipoMensagem.TEXTO,
    "text": TipoMensagem.TEXTO,
    "image": TipoMensagem.IMAGEM,
    "video": TipoMensagem.VIDEO,
    "audio": TipoMensagem.AUDIO,
    "ptt": TipoMensagem.AUDIO,
    "document": TipoMensagem.DOCUMENTO,
    "buttons_response": TipoMensagem.BOTAO,
    "list_response": TipoMensagem.LISTA,
    "sticker": TipoMensagem.IMAGEM,
}


def map_message_type(raw_type: str | None) -> TipoMensagem:
    if not raw_type:
        return TipoMensagem.TEXTO
    return _TYPE_MAP.get(raw_type.lower(), TipoMensagem.TEXTO)


def extract_event_type(payload: dict[str, Any]) -> str:
    """Determine canonical event type from raw payload."""
    if "messages" in payload or "message" in payload:
        return "message"
    if "status" in payload:
        return "status_update"
    if "event" in payload:
        return payload["event"]
    return "unknown"


def extract_event_id(payload: dict[str, Any]) -> str | None:
    """Extract unique event/message ID from payload."""
    # Try different known paths
    for path in [
        "messages.0.key.id",
        "message.key.id",
        "key.id",
        "id",
        "messageId",
        "message_id",
    ]:
        val = _deep_get(payload, path)
        if val:
            return str(val)
    return None


def extract_sender_phone(payload: dict[str, Any]) -> str | None:
    """Extract sender phone number in E.164-ish format."""
    for path in [
        "messages.0.key.remoteJid",
        "message.key.remoteJid",
        "key.remoteJid",
        "from",
        "sender",
        "phone",
    ]:
        val = _deep_get(payload, path)
        if val:
            return _normalize_jid_to_phone(str(val))
    return None


def extract_sender_name(payload: dict[str, Any]) -> str | None:
    for path in [
        "messages.0.pushName",
        "message.pushName",
        "pushName",
        "senderName",
        "name",
    ]:
        val = _deep_get(payload, path)
        if val:
            return str(val)
    return None


def extract_message_text(payload: dict[str, Any]) -> str | None:
    for path in [
        "messages.0.message.conversation",
        "messages.0.message.extendedTextMessage.text",
        "message.message.conversation",
        "message.message.extendedTextMessage.text",
        "body",
        "text",
        "message.body",
    ]:
        val = _deep_get(payload, path)
        if val:
            return str(val)
    return None


def extract_message_type_raw(payload: dict[str, Any]) -> str | None:
    for path in [
        "messages.0.messageType",
        "message.messageType",
        "messageType",
        "type",
    ]:
        val = _deep_get(payload, path)
        if val:
            return str(val)
    return None


def extract_media_url(payload: dict[str, Any]) -> str | None:
    for path in [
        "messages.0.message.imageMessage.url",
        "messages.0.message.videoMessage.url",
        "messages.0.message.audioMessage.url",
        "messages.0.message.documentMessage.url",
        "media_url",
        "mediaUrl",
    ]:
        val = _deep_get(payload, path)
        if val:
            return str(val)
    return None


def extract_quoted_id(payload: dict[str, Any]) -> str | None:
    for path in [
        "messages.0.message.extendedTextMessage.contextInfo.stanzaId",
        "message.message.extendedTextMessage.contextInfo.stanzaId",
        "quotedMessageId",
    ]:
        val = _deep_get(payload, path)
        if val:
            return str(val)
    return None


def is_from_me(payload: dict[str, Any]) -> bool:
    for path in [
        "messages.0.key.fromMe",
        "message.key.fromMe",
        "key.fromMe",
        "fromMe",
    ]:
        val = _deep_get(payload, path)
        if val is not None:
            return bool(val)
    return False


def parse_webhook(payload: dict[str, Any]) -> dict[str, Any]:
    """Parse raw webhook into a canonical dict. Never raises on unknown fields."""
    return {
        "event_type": extract_event_type(payload),
        "event_id": extract_event_id(payload),
        "sender_phone": extract_sender_phone(payload),
        "sender_name": extract_sender_name(payload),
        "message_text": extract_message_text(payload),
        "message_type_raw": extract_message_type_raw(payload),
        "message_type": map_message_type(extract_message_type_raw(payload)),
        "media_url": extract_media_url(payload),
        "quoted_id": extract_quoted_id(payload),
        "from_me": is_from_me(payload),
        "raw": payload,
    }


# ──────────────────────────────────────────────────
# helpers
# ──────────────────────────────────────────────────

def _deep_get(d: dict, path: str, default=None):
    """Safely traverse nested dict/list by dot-separated path."""
    keys = path.split(".")
    current = d
    for key in keys:
        if isinstance(current, dict):
            current = current.get(key)
        elif isinstance(current, (list, tuple)):
            try:
                current = current[int(key)]
            except (IndexError, ValueError):
                return default
        else:
            return default
        if current is None:
            return default
    return current


def _normalize_jid_to_phone(jid: str) -> str:
    """Convert WhatsApp JID like '5515999999999@s.whatsapp.net' to '+5515999999999'."""
    phone = jid.split("@")[0].split(":")[0]
    phone = "".join(c for c in phone if c.isdigit())
    if phone and not phone.startswith("+"):
        phone = f"+{phone}"
    return phone
