"""add personalization context tables

Revision ID: 20250708_add_personalization_tables
Revises: 20250622_add_trace_file_table
Create Date: 2025-07-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250708_add_personalization_tables'
down_revision = '20250622_add_trace_file_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create personalization_context_cache table
    op.create_table('personalization_context_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('context_type', sa.String(), nullable=False),
        sa.Column('context_data', sa.JSON(), nullable=True),
        sa.Column('token_count', sa.Integer(), nullable=False),
        sa.Column('data_sources', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('is_valid', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], )
    )
    
    # Create indexes for personalization_context_cache
    op.create_index(op.f('ix_personalization_context_cache_user_id'), 'personalization_context_cache', ['user_id'], unique=False)
    op.create_index(op.f('ix_personalization_context_cache_context_type'), 'personalization_context_cache', ['context_type'], unique=False)
    op.create_index('ix_personalization_context_cache_user_context', 'personalization_context_cache', ['user_id', 'context_type'], unique=False)
    
    # Create context_requirements table
    op.create_table('context_requirements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('context_type', sa.String(), nullable=False),
        sa.Column('data_source', sa.String(), nullable=False),
        sa.Column('requirement_type', sa.String(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('token_weight', sa.Float(), nullable=False),
        sa.Column('max_items', sa.Integer(), nullable=True),
        sa.Column('freshness_hours', sa.Integer(), nullable=True),
        sa.Column('conditions', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for context_requirements
    op.create_index(op.f('ix_context_requirements_context_type'), 'context_requirements', ['context_type'], unique=False)
    op.create_index('ix_context_requirements_context_source', 'context_requirements', ['context_type', 'data_source'], unique=False)
    
    # Create personalization_metrics table
    op.create_table('personalization_metrics',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('context_type', sa.String(), nullable=False),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('context_preparation_ms', sa.Integer(), nullable=False),
        sa.Column('token_utilization', sa.Float(), nullable=False),
        sa.Column('data_sources_included', sa.Integer(), nullable=False),
        sa.Column('cache_hit', sa.Boolean(), nullable=False),
        sa.Column('relevance_score', sa.Float(), nullable=True),
        sa.Column('user_satisfaction', sa.Float(), nullable=True),
        sa.Column('effectiveness_score', sa.Float(), nullable=True),
        sa.Column('context_size_tokens', sa.Integer(), nullable=False),
        sa.Column('data_freshness_hours', sa.Float(), nullable=True),
        sa.Column('compression_ratio', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], )
    )
    
    # Create indexes for personalization_metrics
    op.create_index(op.f('ix_personalization_metrics_user_id'), 'personalization_metrics', ['user_id'], unique=False)
    op.create_index(op.f('ix_personalization_metrics_context_type'), 'personalization_metrics', ['context_type'], unique=False)
    op.create_index('ix_personalization_metrics_user_context', 'personalization_metrics', ['user_id', 'context_type'], unique=False)
    op.create_index('ix_personalization_metrics_created_at', 'personalization_metrics', ['created_at'], unique=False)


def downgrade():
    # Drop indexes first
    op.drop_index('ix_personalization_metrics_created_at', table_name='personalization_metrics')
    op.drop_index('ix_personalization_metrics_user_context', table_name='personalization_metrics')
    op.drop_index(op.f('ix_personalization_metrics_context_type'), table_name='personalization_metrics')
    op.drop_index(op.f('ix_personalization_metrics_user_id'), table_name='personalization_metrics')
    
    op.drop_index('ix_context_requirements_context_source', table_name='context_requirements')
    op.drop_index(op.f('ix_context_requirements_context_type'), table_name='context_requirements')
    
    op.drop_index('ix_personalization_context_cache_user_context', table_name='personalization_context_cache')
    op.drop_index(op.f('ix_personalization_context_cache_context_type'), table_name='personalization_context_cache')
    op.drop_index(op.f('ix_personalization_context_cache_user_id'), table_name='personalization_context_cache')
    
    # Drop tables
    op.drop_table('personalization_metrics')
    op.drop_table('context_requirements')
    op.drop_table('personalization_context_cache')