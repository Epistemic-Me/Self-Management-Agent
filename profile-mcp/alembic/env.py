from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys
# Ensure /app is on sys.path so 'from app import models' works
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import models

config = context.config
fileConfig(config.config_file_name)
target_metadata = models.SQLModel.metadata

def run_migrations_offline():
    context.configure(url=os.getenv("DATABASE_URL"), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

from sqlalchemy import create_engine

def run_migrations_online():
    db_url = os.getenv("DATABASE_URL").replace("postgresql+asyncpg", "postgresql+psycopg2")
    connectable = create_engine(db_url)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
