"""add uazapi_server_url and uazapi_admin_token to configuracao_empresa

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("configuracao_empresa", sa.Column("uazapi_server_url", sa.Text(), nullable=True))
    op.add_column("configuracao_empresa", sa.Column("uazapi_admin_token", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("configuracao_empresa", "uazapi_admin_token")
    op.drop_column("configuracao_empresa", "uazapi_server_url")
