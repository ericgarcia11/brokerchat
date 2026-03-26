"""Typed state for LangGraph agent graphs."""

from typing import Any, Annotated
from operator import add

from langgraph.graph import MessagesState
from pydantic import BaseModel, Field


class AgentState(MessagesState):
    """State shared across all agent graph nodes."""

    # Identifiers
    chat_id: str = ""
    empresa_id: str = ""
    contato_id: str = ""
    conexao_id: str = ""
    oportunidade_id: str = ""
    graph_thread_id: str = ""

    # Contact context
    contact_name: str = ""
    contact_phone: str = ""

    # Conversation tracking
    intent: str = ""  # triagem result: compra, aluguel, visita, corretor, outro
    qualification: dict[str, Any] = Field(default_factory=dict)
    summary: str = ""

    # Control flow
    next_action: str = ""  # respond, handoff, update_crm, search_property, end
    handoff_reason: str = ""
    response_text: str = ""

    # Agent metadata
    agent_type: str = ""  # triagem, vendas, aluguel, pos_atendimento
    agent_name: str = ""


class QualificationData(BaseModel):
    cidade: str | None = None
    bairro: str | None = None
    tipo_imovel: str | None = None
    quartos: int | None = None
    orcamento_min: float | None = None
    orcamento_max: float | None = None
    urgencia: str | None = None
    observacoes: str | None = None
