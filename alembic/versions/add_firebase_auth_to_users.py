"""add firebase auth to users

Revision ID: firebase_auth_001
Revises: db44f74ed18f
Create Date: 2024-01-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'firebase_auth_001'
down_revision = 'b6e7011d14e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add Firebase authentication fields to users table
    op.add_column('users', sa.Column('firebase_uid', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email', sa.String(), nullable=True))
    op.add_column('users', sa.Column('display_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('photo_url', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), default=False, nullable=True))
    op.add_column('users', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(), nullable=True))
    
    # Make legacy fields nullable for Firebase users
    op.alter_column('users', 'username', nullable=True)
    op.alter_column('users', 'hashed_password', nullable=True)
    
    # Create unique indexes for Firebase fields
    op.create_index('ix_users_firebase_uid', 'users', ['firebase_uid'], unique=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    # Set default values for existing columns
    op.execute("UPDATE users SET email_verified = false WHERE email_verified IS NULL")
    op.execute("UPDATE users SET created_at = NOW() WHERE created_at IS NULL")
    op.execute("UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL")


def downgrade() -> None:
    # Remove Firebase fields
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_firebase_uid', table_name='users')
    
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'photo_url')
    op.drop_column('users', 'display_name')
    op.drop_column('users', 'email')
    op.drop_column('users', 'firebase_uid')
    
    # Restore nullable constraints
    op.alter_column('users', 'username', nullable=False)
    op.alter_column('users', 'hashed_password', nullable=False) 