from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.models import (
    AgenteIA,
    Empresa,
    Equipe,
    Filial,
    Imovel,
    InteresseImovel,
    RegraRoteamento,
    Usuario,
)
from app.repositories.base import BaseRepository


class EmpresaRepository(BaseRepository[Empresa]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Empresa)


class FilialRepository(BaseRepository[Filial]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Filial)


class EquipeRepository(BaseRepository[Equipe]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Equipe)


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Usuario)

    async def get_by_login(self, login: str) -> Usuario | None:
        from sqlalchemy import select
        stmt = select(Usuario).where(Usuario.email == login)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


class AgenteIARepository(BaseRepository[AgenteIA]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, AgenteIA)


class RegraRoteamentoRepository(BaseRepository[RegraRoteamento]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, RegraRoteamento)


class ImovelRepository(BaseRepository[Imovel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, Imovel)


class InteresseImovelRepository(BaseRepository[InteresseImovel]):
    def __init__(self, session: AsyncSession):
        super().__init__(session, InteresseImovel)
