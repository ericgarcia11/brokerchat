"""Cadence routes — fluxo (template) management and execution control."""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps.auth import AuthPayload, DBSession
from app.api.schemas.schemas import (
    CadenceExecucaoCreate,
    CadenceExecucaoRead,
    CadenceFluxoCreate,
    CadenceFluxoRead,
    CadenceFluxoUpdate,
    MessageResponse,
)
from app.domain.models.models import CadenceFluxo
from app.repositories.cadence import CadenceExecucaoRepository, CadenceFluxoRepository
from app.services.cadence import CadenceService

router = APIRouter(prefix="/cadence", tags=["cadence"])


# ── Fluxos ────────────────────────────────────────────────

@router.get("/fluxos", response_model=list[CadenceFluxoRead])
async def list_fluxos(
    session: DBSession,
    auth: AuthPayload,
    empresa_id: uuid.UUID = Query(...),
    ativo: bool | None = None,
):
    repo = CadenceFluxoRepository(session)
    return list(await repo.list_by_empresa(empresa_id, ativo=ativo))


@router.post("/fluxos", response_model=CadenceFluxoRead, status_code=status.HTTP_201_CREATED)
async def create_fluxo(data: CadenceFluxoCreate, session: DBSession, auth: AuthPayload):
    steps_raw = [s.model_dump() for s in data.steps]
    obj = CadenceFluxo(
        empresa_id=data.empresa_id,
        nome=data.nome,
        descricao=data.descricao,
        mensagem_inicial=data.mensagem_inicial,
        acao_resposta=data.acao_resposta,
        steps=steps_raw,
        ativo=data.ativo,
    )
    repo = CadenceFluxoRepository(session)
    result = await repo.create(obj)
    await session.commit()
    await session.refresh(result)
    return result


@router.get("/fluxos/{fluxo_id}", response_model=CadenceFluxoRead)
async def get_fluxo(fluxo_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    repo = CadenceFluxoRepository(session)
    obj = await repo.get_by_id(fluxo_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Fluxo não encontrado")
    return obj


@router.put("/fluxos/{fluxo_id}", response_model=CadenceFluxoRead)
async def update_fluxo(
    fluxo_id: uuid.UUID, data: CadenceFluxoUpdate, session: DBSession, auth: AuthPayload
):
    repo = CadenceFluxoRepository(session)
    updates = data.model_dump(exclude_none=True)
    if "steps" in updates:
        updates["steps"] = [s.model_dump() if hasattr(s, "model_dump") else s for s in data.steps]
    obj = await repo.update_fields(fluxo_id, **updates)
    if not obj:
        raise HTTPException(status_code=404, detail="Fluxo não encontrado")
    await session.commit()
    await session.refresh(obj)
    return obj


@router.delete("/fluxos/{fluxo_id}", response_model=MessageResponse)
async def delete_fluxo(fluxo_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    repo = CadenceFluxoRepository(session)
    deleted = await repo.delete(fluxo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Fluxo não encontrado")
    await session.commit()
    return MessageResponse(message="Fluxo removido")


# ── Execuções ─────────────────────────────────────────────

@router.post("/execucoes", response_model=CadenceExecucaoRead, status_code=status.HTTP_201_CREATED)
async def iniciar_execucao(data: CadenceExecucaoCreate, session: DBSession, auth: AuthPayload):
    """Inicia uma cadência de follow-up para um contato."""
    # Retrieve empresa_id from the fluxo
    fluxo_repo = CadenceFluxoRepository(session)
    fluxo = await fluxo_repo.get_by_id(data.fluxo_id)
    if not fluxo:
        raise HTTPException(status_code=404, detail="Fluxo não encontrado")

    svc = CadenceService(session)
    try:
        execucao = await svc.iniciar_execucao(
            fluxo_id=data.fluxo_id,
            empresa_id=fluxo.empresa_id,
            contato_id=data.contato_id,
            conexao_id=data.conexao_id,
            oportunidade_id=data.oportunidade_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    await session.commit()
    await session.refresh(execucao)
    return execucao


@router.get("/execucoes", response_model=list[CadenceExecucaoRead])
async def list_execucoes(
    session: DBSession,
    auth: AuthPayload,
    fluxo_id: uuid.UUID | None = None,
    contato_id: uuid.UUID | None = None,
    empresa_id: uuid.UUID | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    repo = CadenceExecucaoRepository(session)
    if fluxo_id:
        return list(await repo.list_by_fluxo(fluxo_id, offset=offset, limit=limit))
    if contato_id and empresa_id:
        return list(await repo.list_by_contato(contato_id, empresa_id))
    return list(await repo.list_all(offset=offset, limit=limit))


@router.get("/execucoes/{execucao_id}", response_model=CadenceExecucaoRead)
async def get_execucao(execucao_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    repo = CadenceExecucaoRepository(session)
    obj = await repo.get_by_id(execucao_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Execução não encontrada")
    return obj


@router.post("/execucoes/{execucao_id}/cancelar", response_model=CadenceExecucaoRead)
async def cancelar_execucao(execucao_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    """Cancela manualmente uma cadência ativa, revogando o próximo step agendado."""
    svc = CadenceService(session)
    execucao = await svc.cancelar_execucao(execucao_id)
    if not execucao:
        raise HTTPException(status_code=404, detail="Execução não encontrada")
    await session.commit()
    await session.refresh(execucao)
    return execucao
