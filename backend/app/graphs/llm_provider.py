"""Decoupled LLM provider. Swap model/provider via env vars."""

from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel

from app.core.config import settings


def get_llm(
    provider: str | None = None,
    model: str | None = None,
    temperature: float | None = None,
) -> BaseChatModel:
    prov = provider or settings.LLM_PROVIDER

    if prov == "openai":
        return ChatOpenAI(
            model=model or settings.OPENAI_MODEL,
            temperature=temperature if temperature is not None else settings.OPENAI_TEMPERATURE,
            api_key=settings.OPENAI_API_KEY,
        )

    raise ValueError(f"Unsupported LLM provider: {prov}")
