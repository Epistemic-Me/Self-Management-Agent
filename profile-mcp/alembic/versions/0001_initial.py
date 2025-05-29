"""Initial tables

Revision ID: 0001
Revises: 
Create Date: 2025-05-20 00:44:40
"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'user',
        sa.Column('id', sa.Uuid, primary_key=True),
        sa.Column('dontdie_uid', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_table(
        'selfmodel',
        sa.Column('id', sa.Uuid, primary_key=True),
        sa.Column('user_id', sa.Uuid, sa.ForeignKey('user.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )
    op.create_table(
        'beliefsystem',
        sa.Column('id', sa.Uuid, primary_key=True),
        sa.Column('self_model_id', sa.Uuid, sa.ForeignKey('selfmodel.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
    )
    op.create_table(
        'belief',
        sa.Column('id', sa.Uuid, primary_key=True),
        sa.Column('belief_system_id', sa.Uuid, sa.ForeignKey('beliefsystem.id'), nullable=False),
        sa.Column('context_uuid', sa.String()),
        sa.Column('statement', sa.String(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
    )
    op.create_table(
        'measurement',
        sa.Column('id', sa.Uuid, primary_key=True),
        sa.Column('user_id', sa.Uuid, sa.ForeignKey('user.id'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('captured_at', sa.DateTime(), nullable=False),
    )
    op.create_table(
        'userfile',
        sa.Column('id', sa.Uuid, primary_key=True),
        sa.Column('user_id', sa.Uuid, sa.ForeignKey('user.id'), nullable=False),
        sa.Column('s3_key', sa.String(), nullable=False),
        sa.Column('mime', sa.String(), nullable=False),
        sa.Column('sha256', sa.String(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
    )

def downgrade():
    op.drop_table('userfile')
    op.drop_table('measurement')
    op.drop_table('belief')
    op.drop_table('beliefsystem')
    op.drop_table('selfmodel')
    op.drop_table('user')
