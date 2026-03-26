"""Tests for the routing service."""

import uuid
from unittest.mock import MagicMock

from app.domain.enums.enums import AcaoRoteamento, Canal, Provedor
from app.domain.models.models import Conexao, Contato, RegraRoteamento
from app.services.routing import RoutingService


def _make_contato(**kwargs) -> Contato:
    defaults = {
        "id": uuid.uuid4(),
        "empresa_id": uuid.uuid4(),
        "telefone_e164": "+5515999999999",
        "opt_out": False,
        "ultimo_contato_em": None,
    }
    defaults.update(kwargs)
    c = MagicMock(spec=Contato)
    for k, v in defaults.items():
        setattr(c, k, v)
    return c


def _make_conexao(regras: list[RegraRoteamento] | None = None) -> Conexao:
    c = MagicMock(spec=Conexao)
    c.id = uuid.uuid4()
    c.empresa_id = uuid.uuid4()
    c.canal = Canal.WHATSAPP
    c.equipe_padrao_id = uuid.uuid4()
    c.regras = regras or []
    return c


def _make_regra(**kwargs) -> RegraRoteamento:
    defaults = {
        "id": uuid.uuid4(),
        "nome": "test rule",
        "prioridade": 10,
        "ativa": True,
        "acao": AcaoRoteamento.ABRIR_CHAT,
        "iniciar_chat": True,
        "equipe_destino_id": uuid.uuid4(),
        "agente_ia_destino_id": uuid.uuid4(),
        "condicoes": None,
        "stop_on_match": True,
    }
    defaults.update(kwargs)
    r = MagicMock(spec=RegraRoteamento)
    for k, v in defaults.items():
        setattr(r, k, v)
    return r


def test_fallback_when_no_rules():
    svc = RoutingService()
    conexao = _make_conexao(regras=[])
    contato = _make_contato()
    decision = svc.evaluate(conexao, "Olá", contato)
    assert decision.acao == AcaoRoteamento.ABRIR_CHAT
    assert decision.regra_id is None
    assert decision.equipe_destino_id == conexao.equipe_padrao_id


def test_match_default_rule():
    regra = _make_regra(condicoes=None)
    svc = RoutingService()
    conexao = _make_conexao(regras=[regra])
    contato = _make_contato()
    decision = svc.evaluate(conexao, "Olá", contato)
    assert decision.acao == AcaoRoteamento.ABRIR_CHAT
    assert decision.regra_id == regra.id


def test_match_keyword_rule():
    regra_aluguel = _make_regra(
        nome="Aluguel",
        prioridade=5,
        acao=AcaoRoteamento.ABRIR_CHAT,
        condicoes={"palavras_chave": ["aluguel", "alugar"]},
    )
    regra_default = _make_regra(prioridade=100, condicoes=None)
    svc = RoutingService()
    conexao = _make_conexao(regras=[regra_aluguel, regra_default])
    contato = _make_contato()
    decision = svc.evaluate(conexao, "Quero alugar um apartamento", contato)
    assert decision.regra_id == regra_aluguel.id


def test_ignorar_optout():
    regra_optout = _make_regra(
        nome="Ignorar opt-out",
        prioridade=1,
        acao=AcaoRoteamento.IGNORAR,
        condicoes={"opt_out": True},
    )
    regra_default = _make_regra(prioridade=100, condicoes=None)
    svc = RoutingService()
    conexao = _make_conexao(regras=[regra_optout, regra_default])
    contato = _make_contato(opt_out=True)
    decision = svc.evaluate(conexao, "Oi", contato)
    assert decision.acao == AcaoRoteamento.IGNORAR


def test_encaminhar_humano():
    regra = _make_regra(
        nome="Encaminhar",
        acao=AcaoRoteamento.ENCAMINHAR_HUMANO,
        condicoes={"palavras_chave": ["corretor", "humano"]},
    )
    svc = RoutingService()
    conexao = _make_conexao(regras=[regra])
    contato = _make_contato()
    decision = svc.evaluate(conexao, "Quero falar com um corretor", contato)
    assert decision.acao == AcaoRoteamento.ENCAMINHAR_HUMANO


def test_inactive_rules_skipped():
    regra_inactive = _make_regra(ativa=False, prioridade=1)
    regra_active = _make_regra(prioridade=10, condicoes=None)
    svc = RoutingService()
    conexao = _make_conexao(regras=[regra_inactive, regra_active])
    contato = _make_contato()
    decision = svc.evaluate(conexao, "Oi", contato)
    assert decision.regra_id == regra_active.id


def test_priority_ordering():
    regra_low = _make_regra(nome="Low", prioridade=100, condicoes=None)
    regra_high = _make_regra(nome="High", prioridade=1, condicoes=None)
    svc = RoutingService()
    conexao = _make_conexao(regras=[regra_low, regra_high])
    contato = _make_contato()
    decision = svc.evaluate(conexao, "Oi", contato)
    assert decision.regra_id == regra_high.id
