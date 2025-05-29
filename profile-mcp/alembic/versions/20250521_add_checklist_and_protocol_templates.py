"""add checklistitem and protocoltemplate

Revision ID: 20250521_add_checklist_and_protocol_templates
Revises: 
Create Date: 2025-05-21 14:45:00.000000

"""
from alembic import op
from sqlalchemy.dialects.postgresql import UUID
import sqlalchemy as sa

revision = '20250521_checklist_protocol'
down_revision = '0001'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'checklistitem',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('bucket_code', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default="pending"),
        sa.Column('data_ref', sa.JSON(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_table(
        'protocoltemplate',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('habit_type', sa.String(), nullable=False),
        sa.Column('cue', sa.String(), nullable=False),
        sa.Column('routine', sa.String(), nullable=False),
        sa.Column('reward', sa.String(), nullable=False),
        sa.Column('dd_protocol_json', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.sql.expression.true()),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

def downgrade():
    op.drop_table('protocoltemplate')
    op.drop_table('checklistitem')
