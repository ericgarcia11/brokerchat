"""API routes for tenant branding configuration."""

import base64
import uuid
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from sqlalchemy import select

from app.api.deps.auth import AuthPayload, DBSession
from app.api.schemas.schemas import ConfiguracaoEmpresaRead, ConfiguracaoEmpresaUpdate
from app.domain.models.models import ConfiguracaoEmpresa

router = APIRouter(prefix="/admin/configuracao", tags=["configuracao"])
public_router = APIRouter(prefix="/public", tags=["public"])

ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/svg+xml"}
MAX_LOGO_SIZE = 2 * 1024 * 1024  # 2 MB


async def _get_or_create(session, empresa_id: uuid.UUID) -> ConfiguracaoEmpresa:
    """Return existing config or create a default one for the empresa."""
    stmt = select(ConfiguracaoEmpresa).where(ConfiguracaoEmpresa.empresa_id == empresa_id)
    result = await session.execute(stmt)
    config = result.scalar_one_or_none()
    if config is None:
        config = ConfiguracaoEmpresa(empresa_id=empresa_id)
        session.add(config)
        await session.flush()
    return config


# ── Public (no auth) ────────────────────────────────────── #

@public_router.get(
    "/configuracao",
    response_model=ConfiguracaoEmpresaRead,
    response_model_exclude={"uazapi_admin_token", "uazapi_server_url"},
)
async def get_configuracao_publica(
    session: DBSession,
    empresa_id: uuid.UUID = Query(...),
):
    """Returns branding config publicly so the login page can apply it."""
    stmt = select(ConfiguracaoEmpresa).where(ConfiguracaoEmpresa.empresa_id == empresa_id)
    result = await session.execute(stmt)
    config = result.scalar_one_or_none()
    if config is None:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    return config


# ── Protected ────────────────────────────────────────────── #

@router.get("", response_model=ConfiguracaoEmpresaRead)
async def get_configuracao(session: DBSession, auth: AuthPayload):
    empresa_id = uuid.UUID(auth["empresa_id"])
    config = await _get_or_create(session, empresa_id)
    await session.commit()
    return config


@router.put("", response_model=ConfiguracaoEmpresaRead)
async def update_configuracao(
    data: ConfiguracaoEmpresaUpdate,
    session: DBSession,
    auth: AuthPayload,
):
    empresa_id = uuid.UUID(auth["empresa_id"])
    config = await _get_or_create(session, empresa_id)

    updates = data.model_dump(exclude_unset=True)
    if "paleta_cores" in updates and updates["paleta_cores"] is not None:
        paleta = data.paleta_cores
        paleta_dict = {}
        if paleta and paleta.light:
            paleta_dict["light"] = paleta.light.model_dump(by_alias=True, exclude_none=True)
        if paleta and paleta.dark:
            paleta_dict["dark"] = paleta.dark.model_dump(by_alias=True, exclude_none=True)
        updates["paleta_cores"] = paleta_dict if paleta_dict else None

    for key, value in updates.items():
        setattr(config, key, value)

    await session.commit()
    await session.refresh(config)
    return config


@router.post("/logo", response_model=ConfiguracaoEmpresaRead)
async def upload_logo(
    session: DBSession,
    auth: AuthPayload,
    file: Annotated[UploadFile, File()],
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Tipo de arquivo não permitido. Use PNG, JPEG, WebP ou SVG.",
        )

    data = await file.read()
    if len(data) > MAX_LOGO_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 2 MB.")

    empresa_id = uuid.UUID(auth["empresa_id"])
    config = await _get_or_create(session, empresa_id)

    # Store as base64 data URL directly in the database — no external storage needed.
    content_type = file.content_type or "image/png"
    b64 = base64.b64encode(data).decode("utf-8")
    config.logo_url = f"data:{content_type};base64,{b64}"

    await session.commit()
    await session.refresh(config)
    return config


@router.delete("/logo", response_model=ConfiguracaoEmpresaRead)
async def delete_logo(session: DBSession, auth: AuthPayload):
    empresa_id = uuid.UUID(auth["empresa_id"])
    config = await _get_or_create(session, empresa_id)
    config.logo_url = None
    await session.commit()
    await session.refresh(config)
    return config
