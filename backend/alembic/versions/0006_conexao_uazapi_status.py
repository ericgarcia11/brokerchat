"""add uazapi live-status fields to conexoes

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("conexoes", sa.Column("uazapi_status", sa.String(50), nullable=True))
    op.add_column("conexoes", sa.Column("profile_name", sa.String(255), nullable=True))
    op.add_column("conexoes", sa.Column("profile_pic_url", sa.Text(), nullable=True))
    op.add_column("conexoes", sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("conexoes", "synced_at")
    op.drop_column("conexoes", "profile_pic_url")
    op.drop_column("conexoes", "profile_name")
    op.drop_column("conexoes", "uazapi_status")
