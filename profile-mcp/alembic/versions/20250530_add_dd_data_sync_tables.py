"""add dd data sync tables

Revision ID: 20250530_add_dd_data_sync_tables
Revises: 20250521_checklist_protocol
Create Date: 2025-01-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250530_add_dd_data_sync_tables'
down_revision = '20250521_checklist_protocol'
branch_labels = None
depends_on = None


def upgrade():
    # Create dd_user_data table
    op.create_table('dd_user_data',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('dontdie_uid', sa.String(), nullable=False),
        sa.Column('measurements', sa.Text(), nullable=True),
        sa.Column('capabilities', sa.Text(), nullable=True),
        sa.Column('biomarkers', sa.Text(), nullable=True),
        sa.Column('protocols', sa.Text(), nullable=True),
        sa.Column('dd_scores', sa.Text(), nullable=True),
        sa.Column('last_synced', sa.DateTime(), nullable=False),
        sa.Column('sync_status', sa.String(), nullable=False),
        sa.Column('sync_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for dd_user_data
    op.create_index(op.f('ix_dd_user_data_user_id'), 'dd_user_data', ['user_id'], unique=False)
    op.create_index(op.f('ix_dd_user_data_dontdie_uid'), 'dd_user_data', ['dontdie_uid'], unique=False)
    
    # Create dd_sync_log table
    op.create_table('dd_sync_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('sync_type', sa.String(), nullable=False),
        sa.Column('endpoint', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('records_synced', sa.Integer(), nullable=False),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for dd_sync_log
    op.create_index(op.f('ix_dd_sync_log_user_id'), 'dd_sync_log', ['user_id'], unique=False)


def downgrade():
    # Drop indexes first
    op.drop_index(op.f('ix_dd_sync_log_user_id'), table_name='dd_sync_log')
    op.drop_index(op.f('ix_dd_user_data_dontdie_uid'), table_name='dd_user_data')
    op.drop_index(op.f('ix_dd_user_data_user_id'), table_name='dd_user_data')
    
    # Drop tables
    op.drop_table('dd_sync_log')
    op.drop_table('dd_user_data') 