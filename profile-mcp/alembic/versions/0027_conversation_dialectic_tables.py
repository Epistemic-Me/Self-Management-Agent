"""add conversation and dialectic tables

Revision ID: 0027_conversation_dialectic_tables
Revises: 20250521_checklist_protocol
Create Date: 2025-01-27 10:00:00.000000

"""
from alembic import op
from sqlalchemy.dialects.postgresql import UUID
import sqlalchemy as sa

revision = '0027_conv_dialectic'
down_revision = '20250521_checklist_protocol'
branch_labels = None
depends_on = None

def upgrade():
    # Create conversation table
    op.create_table(
        'conversation',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('started_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('closed', sa.Boolean(), nullable=False, server_default=sa.sql.expression.false()),
        sa.Column('meta', sa.JSON(), nullable=True),
    )
    
    # Create turn table
    op.create_table(
        'turn',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('conversation_id', UUID(as_uuid=True), sa.ForeignKey('conversation.id'), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('extra_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    
    # Create dialectic table
    op.create_table(
        'dialectic',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('self_model_id', UUID(as_uuid=True), sa.ForeignKey('selfmodel.id'), nullable=True),
        sa.Column('learning_objective', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('closed', sa.Boolean(), nullable=False, server_default=sa.sql.expression.false()),
        sa.Column('conversation_id', UUID(as_uuid=True), sa.ForeignKey('conversation.id'), nullable=True),
    )
    
    # Create dialecticinteraction table
    op.create_table(
        'dialecticinteraction',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('dialectic_id', UUID(as_uuid=True), sa.ForeignKey('dialectic.id'), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('extra_json', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )

def downgrade():
    op.drop_table('dialecticinteraction')
    op.drop_table('dialectic')
    op.drop_table('turn')
    op.drop_table('conversation') 