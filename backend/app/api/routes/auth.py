"""Authentication routes: login and current user."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps.auth import DBSession, AuthPayload
from app.api.schemas.schemas import LoginRequest, LoginResponse, UsuarioRead
from app.core.security import verify_password, create_access_token
from app.repositories.crud import UsuarioRepository

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, session: DBSession):
    repo = UsuarioRepository(session)
    user = await repo.get_by_login(body.login)

    if not user or not user.senha_hash or not verify_password(body.senha, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login ou senha inválidos",
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "papel": user.papel.value if hasattr(user.papel, "value") else user.papel,
        "empresa_id": str(user.empresa_id),
    })

    return LoginResponse(
        access_token=token,
        user=UsuarioRead.model_validate(user),
    )


@router.get("/me", response_model=UsuarioRead)
async def me(session: DBSession, auth: AuthPayload):
    user_id = auth.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    repo = UsuarioRepository(session)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user
