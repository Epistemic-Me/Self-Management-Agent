"""add trace_file table

Revision ID: 20250622_add_trace_file_table
Revises: 20250530_add_dd_data_sync_tables
Create Date: 2025-06-22 12:00:00.000000

"""
from alembic import op
from sqlalchemy.dialects.postgresql import UUID
import sqlalchemy as sa

revision = '20250622_trace_file'
down_revision = '20250530_add_dd_data_sync_tables'
branch_labels = None
depends_on = None

def upgrade():
    # Create trace_file table
    op.create_table(
        'trace_file',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('s3_key', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(), nullable=False),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('validation_status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('validation_errors', sa.Text(), nullable=True),
        sa.Column('trace_count', sa.Integer(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
    )
    
    # Create index on user_id for efficient querying
    op.create_index('ix_trace_file_user_id', 'trace_file', ['user_id'])
    
    # Create index on validation_status for filtering
    op.create_index('ix_trace_file_validation_status', 'trace_file', ['validation_status'])

def downgrade():
    # Drop indexes first
    op.drop_index('ix_trace_file_validation_status', 'trace_file')
    op.drop_index('ix_trace_file_user_id', 'trace_file')
    
    # Drop table
    op.drop_table('trace_file')