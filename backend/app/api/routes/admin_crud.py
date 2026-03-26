"""Generic CRUD routes for admin entities."""

import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps.auth import DBSession, AuthPayload
from app.api.schemas.schemas import (
    AgenteIACreate, AgenteIARead,
    ConexaoCreate, ConexaoRead,
    ContatoCreate, ContatoRead,
    EmpresaCreate, EmpresaRead,
    EquipeCreate, EquipeRead, EquipeUpdate,
    FilialCreate, FilialRead,
    ImovelCreate, ImovelRead,
    OportunidadeCreate, OportunidadeRead,
    RegraRoteamentoCreate, RegraRoteamentoRead,
    UsuarioCreate, UsuarioRead, UsuarioUpdate,
    MessageResponse,
)
from app.domain.models.models import (
    AgenteIA, Conexao, Contato, Empresa, Equipe,
    Filial, Imovel, Oportunidade, RegraRoteamento, Usuario,
)
from app.repositories.base import BaseRepository
from app.repositories.crud import (
    AgenteIARepository, EmpresaRepository, EquipeRepository,
    FilialRepository, ImovelRepository, RegraRoteamentoRepository,
    UsuarioRepository,
)
from app.repositories.conexao import ConexaoRepository
from app.repositories.contato import ContatoRepository
from app.repositories.oportunidade import OportunidadeRepository

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Helper to build CRUD endpoints ──────────────
def _crud_routes(
    prefix: str,
    model_class: type,
    create_schema: type,
    read_schema: type,
    repo_factory,
):
    sub = APIRouter(prefix=f"/{prefix}")

    @sub.get("", response_model=list[read_schema])
    async def list_items(
        session: DBSession, auth: AuthPayload,
        offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
        empresa_id: uuid.UUID | None = None,
    ):
        repo = repo_factory(session)
        filters = {}
        if empresa_id and hasattr(model_class, "empresa_id"):
            filters["empresa_id"] = empresa_id
        return list(await repo.list_all(filters=filters, offset=offset, limit=limit))

    @sub.get("/{item_id}", response_model=read_schema)
    async def get_item(item_id: uuid.UUID, session: DBSession, auth: AuthPayload):
        repo = repo_factory(session)
        obj = await repo.get_by_id(item_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Not found")
        return obj

    @sub.post("", response_model=read_schema, status_code=status.HTTP_201_CREATED)
    async def create_item(data: create_schema, session: DBSession, auth: AuthPayload):
        repo = repo_factory(session)
        obj = model_class(**data.model_dump())
        return await repo.create(obj)

    @sub.delete("/{item_id}", response_model=MessageResponse)
    async def delete_item(item_id: uuid.UUID, session: DBSession, auth: AuthPayload):
        repo = repo_factory(session)
        deleted = await repo.delete(item_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Not found")
        return MessageResponse(message="Deleted")

    return sub


router.include_router(_crud_routes("empresas", Empresa, EmpresaCreate, EmpresaRead, EmpresaRepository))
router.include_router(_crud_routes("filiais", Filial, FilialCreate, FilialRead, FilialRepository))
router.include_router(_crud_routes("equipes", Equipe, EquipeCreate, EquipeRead, EquipeRepository))

# ── Custom PUT for equipes ───────────────────────
_equipes_sub = APIRouter(prefix="/equipes")


@_equipes_sub.put("/{item_id}", response_model=EquipeRead)
async def update_equipe(item_id: uuid.UUID, data: EquipeUpdate, session: DBSession, auth: AuthPayload):
    repo = EquipeRepository(session)
    obj = await repo.get_by_id(item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    updates = data.model_dump(exclude_unset=True)
    return await repo.update_fields(item_id, **updates)


router.include_router(_equipes_sub)
router.include_router(_crud_routes("agentes-ia", AgenteIA, AgenteIACreate, AgenteIARead, AgenteIARepository))
router.include_router(_crud_routes("conexoes", Conexao, ConexaoCreate, ConexaoRead, ConexaoRepository))
router.include_router(_crud_routes("regras-roteamento", RegraRoteamento, RegraRoteamentoCreate, RegraRoteamentoRead, RegraRoteamentoRepository))
router.include_router(_crud_routes("contatos", Contato, ContatoCreate, ContatoRead, ContatoRepository))
router.include_router(_crud_routes("oportunidades", Oportunidade, OportunidadeCreate, OportunidadeRead, OportunidadeRepository))
router.include_router(_crud_routes("imoveis", Imovel, ImovelCreate, ImovelRead, ImovelRepository))


# ── Custom CRUD for usuarios (password hashing) ─
from app.core.security import hash_password

_usuarios_sub = APIRouter(prefix="/usuarios")


@_usuarios_sub.get("", response_model=list[UsuarioRead])
async def list_usuarios(
    session: DBSession, auth: AuthPayload,
    offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    empresa_id: uuid.UUID | None = None,
):
    repo = UsuarioRepository(session)
    filters = {}
    if empresa_id:
        filters["empresa_id"] = empresa_id
    return list(await repo.list_all(filters=filters, offset=offset, limit=limit))


@_usuarios_sub.get("/{item_id}", response_model=UsuarioRead)
async def get_usuario(item_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    repo = UsuarioRepository(session)
    obj = await repo.get_by_id(item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj


@_usuarios_sub.post("", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
async def create_usuario(data: UsuarioCreate, session: DBSession, auth: AuthPayload):
    repo = UsuarioRepository(session)
    fields = data.model_dump(exclude={"senha"})
    fields["senha_hash"] = hash_password(data.senha)
    obj = Usuario(**fields)
    return await repo.create(obj)


@_usuarios_sub.put("/{item_id}", response_model=UsuarioRead)
async def update_usuario(item_id: uuid.UUID, data: UsuarioUpdate, session: DBSession, auth: AuthPayload):
    repo = UsuarioRepository(session)
    obj = await repo.get_by_id(item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    updates = data.model_dump(exclude_unset=True)
    if "senha" in updates:
        senha = updates.pop("senha")
        if senha:
            updates["senha_hash"] = hash_password(senha)
    return await repo.update_fields(item_id, **updates)


@_usuarios_sub.delete("/{item_id}", response_model=MessageResponse)
async def delete_usuario(item_id: uuid.UUID, session: DBSession, auth: AuthPayload):
    repo = UsuarioRepository(session)
    deleted = await repo.delete(item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
    return MessageResponse(message="Deleted")


router.include_router(_usuarios_sub)
