"""configuracao_empresa table for SaaS branding

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "configuracao_empresa",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "empresa_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("empresas.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("nome_app", sa.String(255), nullable=False, server_default="Meu App"),
        sa.Column("nome_empresa", sa.String(255), nullable=False, server_default="Minha Empresa"),
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column("paleta_cores", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("configuracao_empresa")
