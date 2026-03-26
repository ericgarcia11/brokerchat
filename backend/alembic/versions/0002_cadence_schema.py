"""cadence schema

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-21 00:00:00.000000

"""
from typing import Sequence, Union

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tables created manually via SQL — migration stamped here for tracking.
    pass


def downgrade() -> None:
    pass
