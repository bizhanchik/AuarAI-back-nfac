"""Add gender to clothing_items

Revision ID: b6e7011d14e1
Revises: 2cb2cbdd32d1
Create Date: 2025-06-18 03:57:03.653870

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6e7011d14e1'
down_revision: Union[str, None] = '2cb2cbdd32d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('clothing_items', sa.Column('gender', sa.String(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('clothing_items', 'gender')
    # ### end Alembic commands ###
