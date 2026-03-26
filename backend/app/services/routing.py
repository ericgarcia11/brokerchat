import uuid
from dataclasses import dataclass
from datetime import datetime, timezone, time

from app.core.logging import get_logger
from app.domain.enums.enums import AcaoRoteamento
from app.domain.models.models import Conexao, Contato, RegraRoteamento

logger = get_logger(__name__)


@dataclass
class RoutingDecision:
    acao: AcaoRoteamento
    regra_id: uuid.UUID | None
    equipe_destino_id: uuid.UUID | None
    agente_ia_destino_id: uuid.UUID | None
    iniciar_chat: bool
    motivo: str


class RoutingService:
    """Evaluates routing rules for an inbound message on a specific connection."""

    def evaluate(
        self,
        conexao: Conexao,
        message_text: str | None,
        contact: Contato,
        has_active_chat: bool = False,
    ) -> RoutingDecision:
        regras = sorted(
            [r for r in conexao.regras if r.ativa],
            key=lambda r: r.prioridade,
        )

        for regra in regras:
            if self._matches(regra, message_text, contact, has_active_chat, conexao):
                logger.info(
                    "routing_match",
                    regra_id=str(regra.id),
                    regra_nome=regra.nome,
                    acao=regra.acao.value if isinstance(regra.acao, AcaoRoteamento) else regra.acao,
                )
                acao = regra.acao if isinstance(regra.acao, AcaoRoteamento) else AcaoRoteamento(regra.acao)
                return RoutingDecision(
                    acao=acao,
                    regra_id=regra.id,
                    equipe_destino_id=regra.equipe_destino_id,
                    agente_ia_destino_id=regra.agente_ia_destino_id,
                    iniciar_chat=regra.iniciar_chat,
                    motivo=f"Regra '{regra.nome}' matched",
                )
                # if stop_on_match, break is implicit via return

        # Fallback: open chat with default team
        return RoutingDecision(
            acao=AcaoRoteamento.ABRIR_CHAT,
            regra_id=None,
            equipe_destino_id=conexao.equipe_padrao_id,
            agente_ia_destino_id=None,
            iniciar_chat=True,
            motivo="Fallback: nenhuma regra correspondeu",
        )

    def _matches(
        self,
        regra: RegraRoteamento,
        message_text: str | None,
        contact: Contato,
        has_active_chat: bool,
        conexao: Conexao,
    ) -> bool:
        conds = regra.condicoes
        if not conds:
            return True  # No conditions = always match (default rule)

        text_lower = (message_text or "").lower()

        # Keyword match
        keywords = conds.get("palavras_chave")
        if keywords and isinstance(keywords, list):
            if not any(kw.lower() in text_lower for kw in keywords):
                return False

        # Business hours
        horario = conds.get("horario_comercial")
        if horario is not None:
            in_hours = self._is_business_hours(conds.get("horario_inicio", "08:00"), conds.get("horario_fim", "18:00"))
            if horario and not in_hours:
                return False
            if not horario and in_hours:
                return False

        # Connection type
        tipo_conexao = conds.get("tipo_conexao")
        if tipo_conexao and conexao.canal.value != tipo_conexao:
            return False

        # Opt-out
        if conds.get("opt_out") is True and not contact.opt_out:
            return False
        if conds.get("opt_out") is False and contact.opt_out:
            return False

        # First message
        if conds.get("primeira_mensagem") is True and contact.ultimo_contato_em is not None:
            return False

        # Has active chat
        if conds.get("chat_ativo") is True and not has_active_chat:
            return False
        if conds.get("chat_ativo") is False and has_active_chat:
            return False

        # Origin
        origem = conds.get("origem")
        if origem and contact.origem_atual != origem:
            return False

        # Linha de negocio fixa
        linha = conds.get("linha_negocio")
        if linha:
            pass  # Stored in the rule for informational purposes

        return True

    @staticmethod
    def _is_business_hours(start: str = "08:00", end: str = "18:00") -> bool:
        now = datetime.now(timezone.utc).time()
        h_start = time.fromisoformat(start)
        h_end = time.fromisoformat(end)
        return h_start <= now <= h_end
