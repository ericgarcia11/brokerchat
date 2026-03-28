from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

DEFAULT_TIMEOUT = 30.0
MAX_RETRIES = 3


class UazAPIClient:
    """Low-level HTTP client for UazAPI. Handles auth, retries, and error handling."""

    def __init__(
        self,
        base_url: str | None = None,
        admin_token: str | None = None,
        instance_token: str | None = None,
    ):
        self.base_url = (base_url or settings.UAZAPI_BASE_URL).rstrip("/")
        self.admin_token = admin_token or settings.UAZAPI_ADMIN_TOKEN
        self.instance_token = instance_token

    def _admin_headers(self) -> dict[str, str]:
        return {"admintoken": self.admin_token, "Content-Type": "application/json"}

    def _instance_headers(self, token: str | None = None) -> dict[str, str]:
        t = token or self.instance_token or ""
        return {"token": t, "Content-Type": "application/json"}

    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        path: str,
        headers: dict[str, str],
        json_body: dict | None = None,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        logger.info("uazapi_request", method=method, url=url)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.request(method, url, headers=headers, json=json_body)
            response.raise_for_status()
            return response.json()

    async def admin_post(self, path: str, body: dict | None = None) -> dict[str, Any]:
        return await self._request("POST", path, self._admin_headers(), body)

    async def admin_get(self, path: str) -> dict[str, Any]:
        return await self._request("GET", path, self._admin_headers())

    async def instance_post(self, path: str, body: dict | None = None, token: str | None = None) -> dict[str, Any]:
        return await self._request("POST", path, self._instance_headers(token), body)

    async def instance_get(self, path: str, token: str | None = None) -> dict[str, Any]:
        return await self._request("GET", path, self._instance_headers(token))

    async def instance_delete(self, path: str, token: str | None = None) -> dict[str, Any]:
        return await self._request("DELETE", path, self._instance_headers(token))

    async def instance_delete(self, path: str, token: str | None = None) -> dict[str, Any]:
        return await self._request("DELETE", path, self._instance_headers(token))
