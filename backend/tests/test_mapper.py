"""Tests for UazAPI webhook mapper."""

from app.providers.uazapi.mapper import (
    extract_event_id,
    extract_event_type,
    extract_message_text,
    extract_sender_phone,
    extract_sender_name,
    extract_media_url,
    is_from_me,
    map_message_type,
    parse_webhook,
)
from app.domain.enums.enums import TipoMensagem


# ── Sample payloads ──────────────────────────────
BAILEYS_MESSAGE = {
    "messages": [
        {
            "key": {
                "remoteJid": "5515999998888@s.whatsapp.net",
                "fromMe": False,
                "id": "3EB0C767D097B7C7C0E2",
            },
            "pushName": "João Silva",
            "messageType": "chat",
            "message": {
                "conversation": "Olá, quero comprar um apartamento",
            },
        }
    ]
}

FLAT_MESSAGE = {
    "event": "message",
    "id": "MSG123",
    "from": "+5515999997777",
    "senderName": "Maria",
    "type": "text",
    "body": "Bom dia, tenho interesse em aluguel",
}

STATUS_UPDATE = {
    "status": {
        "id": "STATUS123",
        "status": "delivered",
    }
}

IMAGE_MESSAGE = {
    "messages": [
        {
            "key": {
                "remoteJid": "5515999996666@s.whatsapp.net",
                "fromMe": False,
                "id": "IMG001",
            },
            "pushName": "Ana",
            "messageType": "image",
            "message": {
                "imageMessage": {
                    "url": "https://media.example.com/img.jpg",
                    "caption": "Veja este imóvel",
                }
            },
        }
    ]
}

FROM_ME_MESSAGE = {
    "messages": [
        {
            "key": {
                "remoteJid": "5515999995555@s.whatsapp.net",
                "fromMe": True,
                "id": "OUTBOUND001",
            },
            "pushName": "Bot",
            "messageType": "chat",
            "message": {"conversation": "Resposta automática"},
        }
    ]
}


def test_extract_event_id_baileys():
    assert extract_event_id(BAILEYS_MESSAGE) == "3EB0C767D097B7C7C0E2"


def test_extract_event_id_flat():
    assert extract_event_id(FLAT_MESSAGE) == "MSG123"


def test_extract_event_type_message():
    assert extract_event_type(BAILEYS_MESSAGE) == "message"


def test_extract_event_type_status():
    assert extract_event_type(STATUS_UPDATE) == "status_update"


def test_extract_event_type_flat():
    assert extract_event_type(FLAT_MESSAGE) == "message"


def test_extract_sender_phone_baileys():
    phone = extract_sender_phone(BAILEYS_MESSAGE)
    assert phone == "+5515999998888"


def test_extract_sender_phone_flat():
    phone = extract_sender_phone(FLAT_MESSAGE)
    assert phone == "+5515999997777"


def test_extract_sender_name():
    assert extract_sender_name(BAILEYS_MESSAGE) == "João Silva"
    assert extract_sender_name(FLAT_MESSAGE) == "Maria"


def test_extract_message_text_baileys():
    text = extract_message_text(BAILEYS_MESSAGE)
    assert text == "Olá, quero comprar um apartamento"


def test_extract_message_text_flat():
    text = extract_message_text(FLAT_MESSAGE)
    assert text == "Bom dia, tenho interesse em aluguel"


def test_extract_media_url():
    url = extract_media_url(IMAGE_MESSAGE)
    assert url == "https://media.example.com/img.jpg"


def test_is_from_me():
    assert is_from_me(FROM_ME_MESSAGE) is True
    assert is_from_me(BAILEYS_MESSAGE) is False


def test_map_message_type():
    assert map_message_type("chat") == TipoMensagem.TEXTO
    assert map_message_type("image") == TipoMensagem.IMAGEM
    assert map_message_type("audio") == TipoMensagem.AUDIO
    assert map_message_type("video") == TipoMensagem.VIDEO
    assert map_message_type("document") == TipoMensagem.DOCUMENTO
    assert map_message_type("unknown_type") == TipoMensagem.TEXTO
    assert map_message_type(None) == TipoMensagem.TEXTO


def test_parse_webhook_complete():
    result = parse_webhook(BAILEYS_MESSAGE)
    assert result["event_type"] == "message"
    assert result["event_id"] == "3EB0C767D097B7C7C0E2"
    assert result["sender_phone"] == "+5515999998888"
    assert result["sender_name"] == "João Silva"
    assert result["message_text"] == "Olá, quero comprar um apartamento"
    assert result["from_me"] is False
    assert result["raw"] == BAILEYS_MESSAGE


def test_parse_webhook_empty_payload():
    result = parse_webhook({})
    assert result["event_type"] == "unknown"
    assert result["event_id"] is None
    assert result["sender_phone"] is None
    assert result["from_me"] is False


def test_parse_webhook_partial_payload():
    result = parse_webhook({"event": "someEvent", "random": "field"})
    assert result["event_type"] == "someEvent"
    assert result["sender_phone"] is None
