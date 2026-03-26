"""AgentExecutionService: runs a LangGraph agent for a given chat."""

import uuid

from langchain_core.messages import SystemMessage, HumanMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.domain.models.models import AgenteIA, Chat
from app.graphs.prompts.agent_prompts import PROMPTS
from app.graphs.registry import get_graph
from app.services.chat import ChatService
from app.services.opportunity import OpportunityService

logger = get_logger(__name__)


class AgentExecutionService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.chat_svc = ChatService(session)
        self.opp_svc = OpportunityService(session)

    async def run(
        self,
        chat: Chat,
        agente: AgenteIA,
        user_message: str,
    ) -> dict:
        """Execute the agent graph for a chat, returns dict with response_text and next_action."""
        graph = get_graph(agente.graph_id)

        system_prompt = agente.prompt_sistema or PROMPTS.get(agente.graph_id, "Você é uma assistente imobiliária.")

        config = {"configurable": {"thread_id": chat.graph_thread_id or chat.id.hex}}

        input_state = {
            "messages": [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_message),
            ],
            "chat_id": str(chat.id),
            "empresa_id": str(chat.empresa_id),
            "contato_id": str(chat.contato_id),
            "conexao_id": str(chat.conexao_id),
            "oportunidade_id": str(chat.oportunidade_id) if chat.oportunidade_id else "",
            "agent_type": agente.tipo.value if hasattr(agente.tipo, "value") else str(agente.tipo),
            "agent_name": agente.nome,
        }

        result = await graph.ainvoke(input_state, config=config)

        response_text = result.get("response_text", "")
        next_action = result.get("next_action", "respond")
        qualification = result.get("qualification", {})
        summary = result.get("summary", "")

        # Update CRM if we have qualification data
        if qualification and chat.oportunidade_id:
            await self.opp_svc.update_qualification(chat.oportunidade_id, **qualification)

        # Update chat context
        if summary or qualification:
            context = chat.contexto_resumido or {}
            if qualification:
                context["qualification"] = qualification
            if summary:
                context["summary"] = summary
            await self.chat_svc.update_context(chat.id, context)

        # Handle handoff
        if next_action == "handoff":
            await self.chat_svc.handoff_to_human(chat.id)

        logger.info(
            "agent_executed",
            chat_id=str(chat.id),
            agent=agente.nome,
            next_action=next_action,
            has_response=bool(response_text),
        )

        return {
            "response_text": response_text,
            "next_action": next_action,
            "qualification": qualification,
        }
