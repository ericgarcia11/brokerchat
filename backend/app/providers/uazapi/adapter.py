"""High-level adapter for UazAPI operations. Decoupled from domain logic."""

from typing import Any

from app.core.logging import get_logger
from app.providers.uazapi.client import UazAPIClient

logger = get_logger(__name__)


class UazAPIAdapter:
    def __init__(self, client: UazAPIClient | None = None):
        self.client = client or UazAPIClient()

    # ── Instance Management ──────────────────────
    async def create_instance(self, name: str) -> dict[str, Any]:
        """POST /instance/init — create instance. Returns response with root-level token."""
        return await self.client.admin_post("/instance/init", {"name": name})

    async def connect_instance(self, token: str) -> dict[str, Any]:
        """POST /instance/connect — trigger QR/pairing code generation."""
        return await self.client.instance_post("/instance/connect", token=token)

    async def list_all_instances(self) -> list[dict[str, Any]]:
        result = await self.client.admin_get("/instance/all")
        if isinstance(result, list):
            return result
        # Some UazAPI versions wrap in {"instances": [...]}
        if isinstance(result, dict):
            for key in ("instances", "data", "result"):
                if isinstance(result.get(key), list):
                    return result[key]
        return []

    async def get_instance_status(self, token: str) -> dict[str, Any]:
        """GET /instance/status — check connection state."""
        return await self.client.instance_get("/instance/status", token=token)

    async def delete_instance(self, token: str) -> dict[str, Any]:
        """DELETE /instance — permanently delete instance from UazAPI."""
        return await self.client.instance_delete("/instance", token=token)

    # ── Sending Messages ─────────────────────────
    async def send_text(
        self,
        token: str,
        phone: str,
        text: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        body = self._build_send_body(phone, **kwargs)
        body["message"] = text
        return await self.client.instance_post("/message/send-text", body, token=token)

    async def send_media(
        self,
        token: str,
        phone: str,
        media_url: str,
        media_type: str = "image",
        caption: str | None = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        body = self._build_send_body(phone, **kwargs)
        body["mediaUrl"] = media_url
        body["mediaType"] = media_type
        if caption:
            body["caption"] = caption
        return await self.client.instance_post("/message/send-media", body, token=token)

    async def send_menu(
        self,
        token: str,
        phone: str,
        title: str,
        description: str,
        options: list[dict],
        **kwargs: Any,
    ) -> dict[str, Any]:
        body = self._build_send_body(phone, **kwargs)
        body["title"] = title
        body["description"] = description
        body["options"] = options
        return await self.client.instance_post("/message/send-menu", body, token=token)

    async def send_carousel(
        self,
        token: str,
        phone: str,
        cards: list[dict],
        **kwargs: Any,
    ) -> dict[str, Any]:
        body = self._build_send_body(phone, **kwargs)
        body["cards"] = cards
        return await self.client.instance_post("/message/send-carousel", body, token=token)

    async def mark_chat_read(self, token: str, phone: str) -> dict[str, Any]:
        body = {"phone": phone}
        return await self.client.instance_post("/chat/mark-read", body, token=token)

    async def find_chats(
        self,
        token: str,
        limit: int = 50,
        offset: int = 0,
        operator: str = "AND",
        sort: str = "-wa_lastMsgTimestamp",
        filters: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """POST /chat/find — return paginated list of chats from UazAPI instance."""
        body: dict[str, Any] = {
            "operator": operator,
            "sort": sort,
            "limit": limit,
            "offset": offset,
        }
        if filters:
            body.update(filters)
        return await self.client.instance_post("/chat/find", body, token=token)

    async def generic_send(
        self,
        token: str,
        endpoint: str,
        body: dict[str, Any],
    ) -> dict[str, Any]:
        return await self.client.instance_post(endpoint, body, token=token)

    # ── Helpers ───────────────────────────────────
    @staticmethod
    def _build_send_body(phone: str, **kwargs: Any) -> dict[str, Any]:
        body: dict[str, Any] = {"phone": phone}
        optional_fields = [
            "delay", "readchat", "readmessages", "replyid",
            "mentions", "track_source", "track_id", "async",
        ]
        for field in optional_fields:
            if field in kwargs and kwargs[field] is not None:
                body[field] = kwargs[field]
        return body
