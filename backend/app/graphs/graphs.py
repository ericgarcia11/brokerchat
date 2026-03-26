"""Graph definitions for each agent type."""

from langgraph.graph import StateGraph, END

from app.graphs.state import AgentState
from app.graphs.nodes.agent_nodes import (
    classify_intent,
    respond,
    handoff_to_human,
    update_crm,
    search_property,
)


def _route_after_classify(state: AgentState) -> str:
    intent = state.get("intent", "outro")
    if intent in ("corretor", "outro", "venda_proprio"):
        return "handoff"
    return "update_crm"


def _route_after_respond(state: AgentState) -> str:
    action = state.get("next_action", "")
    if action == "handoff":
        return "handoff"
    if action == "search_property":
        return "search_property"
    return END


# ── Triagem Graph ────────────────────────────────
def build_triagem_graph() -> StateGraph:
    g = StateGraph(AgentState)
    g.add_node("classify", classify_intent)
    g.add_node("respond", respond)
    g.add_node("handoff", handoff_to_human)
    g.add_node("update_crm", update_crm)

    g.set_entry_point("classify")
    g.add_conditional_edges("classify", _route_after_classify, {"handoff": "handoff", "update_crm": "update_crm"})
    g.add_edge("update_crm", "respond")
    g.add_conditional_edges("respond", _route_after_respond, {"handoff": "handoff", END: END})
    g.add_edge("handoff", END)

    return g


# ── Vendas Graph ─────────────────────────────────
def _route_vendas(state: AgentState) -> str:
    action = state.get("next_action", "")
    if action == "handoff":
        return "handoff"
    if action == "search_property":
        return "search_property"
    return END


def build_vendas_graph() -> StateGraph:
    g = StateGraph(AgentState)
    g.add_node("update_crm", update_crm)
    g.add_node("respond", respond)
    g.add_node("handoff", handoff_to_human)
    g.add_node("search_property", search_property)

    g.set_entry_point("update_crm")
    g.add_edge("update_crm", "respond")
    g.add_conditional_edges("respond", _route_vendas, {"handoff": "handoff", "search_property": "search_property", END: END})
    g.add_edge("search_property", "respond")
    g.add_edge("handoff", END)

    return g


# ── Aluguel Graph ────────────────────────────────
def build_aluguel_graph() -> StateGraph:
    g = StateGraph(AgentState)
    g.add_node("update_crm", update_crm)
    g.add_node("respond", respond)
    g.add_node("handoff", handoff_to_human)
    g.add_node("search_property", search_property)

    g.set_entry_point("update_crm")
    g.add_edge("update_crm", "respond")
    g.add_conditional_edges("respond", _route_vendas, {"handoff": "handoff", "search_property": "search_property", END: END})
    g.add_edge("search_property", "respond")
    g.add_edge("handoff", END)

    return g
