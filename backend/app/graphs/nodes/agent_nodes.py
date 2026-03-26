"""Graph nodes for agent execution."""

import json
from typing import Any

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.core.logging import get_logger
from app.graphs.llm_provider import get_llm
from app.graphs.state import AgentState

logger = get_logger(__name__)


async def classify_intent(state: AgentState) -> dict[str, Any]:
    """Classification node for triagem agent. Determines user intent."""
    llm = get_llm()
    system_prompt = """Analise a última mensagem do usuário e classifique a intenção.
Responda APENAS com um JSON: {"intent": "<intent>", "confidence": <0-1>}
Intenções possíveis: compra, aluguel, venda_proprio, visita, corretor, outro
"""
    messages = [
        SystemMessage(content=system_prompt),
        *state["messages"][-5:],
    ]
    response = await llm.ainvoke(messages)
    content = response.content.strip()

    try:
        parsed = json.loads(content)
        intent = parsed.get("intent", "outro")
    except (json.JSONDecodeError, AttributeError):
        intent = "outro"

    logger.info("intent_classified", intent=intent, chat_id=state.get("chat_id"))
    return {"intent": intent}


async def respond(state: AgentState) -> dict[str, Any]:
    """Main response node. Generates response using the agent's system prompt."""
    llm = get_llm()

    # Build context about qualification
    qual_context = ""
    if state.get("qualification"):
        qual_context = f"\nDados já coletados do cliente: {json.dumps(state['qualification'], ensure_ascii=False)}"

    system_msg = state["messages"][0] if state["messages"] and isinstance(state["messages"][0], SystemMessage) else None
    system_text = system_msg.content if system_msg else "Você é uma assistente imobiliária."

    messages = [
        SystemMessage(content=system_text + qual_context),
        *[m for m in state["messages"] if not isinstance(m, SystemMessage)][-10:],
    ]

    response = await llm.ainvoke(messages)
    return {
        "response_text": response.content,
        "messages": [AIMessage(content=response.content)],
        "next_action": "respond",
    }


async def handoff_to_human(state: AgentState) -> dict[str, Any]:
    """Handoff node. Prepares state for human takeover."""
    logger.info("handoff_triggered", chat_id=state.get("chat_id"), reason=state.get("handoff_reason", "solicitado"))
    return {
        "next_action": "handoff",
        "response_text": "Entendi! Vou encaminhar você para um de nossos atendentes. Aguarde um momento.",
        "messages": [AIMessage(content="Entendi! Vou encaminhar você para um de nossos atendentes. Aguarde um momento.")],
    }


async def update_crm(state: AgentState) -> dict[str, Any]:
    """CRM update node. Extracts qualification data from conversation."""
    llm = get_llm()

    extract_prompt = """Analise a conversa e extraia os dados de qualificação do cliente.
Responda APENAS com JSON:
{
  "cidade": "string ou null",
  "bairro": "string ou null",
  "tipo_imovel": "string ou null",
  "quartos": "int ou null",
  "orcamento_min": "float ou null",
  "orcamento_max": "float ou null",
  "urgencia": "string ou null",
  "observacoes": "string ou null"
}
"""
    messages = [
        SystemMessage(content=extract_prompt),
        *state["messages"][-10:],
    ]
    response = await llm.ainvoke(messages)

    try:
        qualification = json.loads(response.content.strip())
    except (json.JSONDecodeError, AttributeError):
        qualification = state.get("qualification", {})

    # Merge with existing
    existing = state.get("qualification", {})
    for k, v in qualification.items():
        if v is not None:
            existing[k] = v

    return {"qualification": existing, "next_action": "respond"}


async def search_property(state: AgentState) -> dict[str, Any]:
    """Property search node placeholder. Returns context for the response node."""
    qualification = state.get("qualification", {})
    search_summary = f"Buscando imóveis com critérios: {json.dumps(qualification, ensure_ascii=False)}"
    logger.info("property_search", chat_id=state.get("chat_id"), criteria=qualification)
    return {
        "next_action": "respond",
        "messages": [SystemMessage(content=f"[SISTEMA] {search_summary}")],
    }


async def generate_summary(state: AgentState) -> dict[str, Any]:
    """Generate conversation summary for CRM."""
    llm = get_llm()
    summary_prompt = """Resuma esta conversa em 2-3 frases objetivas para registro no CRM.
Inclua: intenção do cliente, dados coletados, status do atendimento."""

    messages = [
        SystemMessage(content=summary_prompt),
        *state["messages"][-15:],
    ]
    response = await llm.ainvoke(messages)
    return {"summary": response.content.strip()}
