"""add uazapi chat fields to chats table

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("chats", sa.Column("wa_chat_id", sa.String(255), nullable=True))
    op.add_column("chats", sa.Column("wa_unread_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("chats", sa.Column("wa_last_msg_timestamp", sa.BigInteger(), nullable=True))
    op.add_column("chats", sa.Column("wa_name", sa.String(255), nullable=True))

    # Unique constraint: one chat record per (conexao_id, wa_chat_id)
    # PostgreSQL allows multiple NULLs in a unique constraint, so rows without
    # wa_chat_id won't conflict with each other.
    op.create_unique_constraint(
        "uq_chat_conexao_wa_chat_id",
        "chats",
        ["conexao_id", "wa_chat_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_chat_conexao_wa_chat_id", "chats", type_="unique")
    op.drop_column("chats", "wa_name")
    op.drop_column("chats", "wa_last_msg_timestamp")
    op.drop_column("chats", "wa_unread_count")
    op.drop_column("chats", "wa_chat_id")
