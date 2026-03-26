"""Registry: maps graph_id -> compiled LangGraph graph."""

from langgraph.graph import StateGraph
from langgraph.checkpoint.memory import MemorySaver

from app.core.logging import get_logger
from app.graphs.graphs import (
    build_triagem_graph,
    build_vendas_graph,
    build_aluguel_graph,
)

logger = get_logger(__name__)

_GRAPH_BUILDERS: dict[str, callable] = {
    "triagem_sorocaba": build_triagem_graph,
    "vendas_sorocaba": build_vendas_graph,
    "aluguel_sorocaba": build_aluguel_graph,
    "vendas_bc": build_vendas_graph,
}

# Cache compiled graphs
_compiled_cache: dict[str, object] = {}


def get_graph(graph_id: str):
    """Get a compiled graph by ID. Uses in-memory checkpointer for thread state."""
    if graph_id in _compiled_cache:
        return _compiled_cache[graph_id]

    builder_fn = _GRAPH_BUILDERS.get(graph_id)
    if not builder_fn:
        raise ValueError(f"Unknown graph_id: {graph_id}. Available: {list(_GRAPH_BUILDERS.keys())}")

    builder: StateGraph = builder_fn()
    checkpointer = MemorySaver()
    compiled = builder.compile(checkpointer=checkpointer)
    _compiled_cache[graph_id] = compiled
    logger.info("graph_compiled", graph_id=graph_id)
    return compiled


def list_graphs() -> list[str]:
    return list(_GRAPH_BUILDERS.keys())
