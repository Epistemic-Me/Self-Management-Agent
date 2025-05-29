# Profile MCP: Implementation Overview

This document provides a detailed architectural and implementation overview of the **Profile MCP** microservice, which manages user-centric data and relationships for the Self-Manager Bedrock agent and Epistemic Me Proto.

---

## Dependency Management & Compatibility
- All dependencies are strictly pinned in `requirements.txt` for reproducibility.
- Uses `fastapi-mcp` for seamless MCP/OpenAPI integration.
- Migrated to Pydantic v2 for SQLModel/FastAPI compatibility. All test and runtime warnings are resolved.
- If you see plugin errors (e.g., langsmith), ensure your environment is isolated from LLM tooling, or disable plugins via `pytest.ini`.

## Table of Contents
1. [Architecture](#architecture)
2. [Core Technologies](#core-technologies)
3. [Database Models](#database-models)
4. [API Endpoints](#api-endpoints)
5. [Authentication](#authentication)
6. [File Storage](#file-storage)
7. [Migrations](#migrations)
8. [Testing](#testing)
9. [Development Workflow](#development-workflow)
10. [Features](#features)

---

## 1. Architecture
- **FastAPI** app, organized as a microservice.
- **Async SQLModel** ORM with PostgreSQL for persistent data.
- **Redis** for authentication token cache.
- **MinIO** (S3-compatible) for large file storage.
- **Alembic** for database migrations.
- Docker Compose for local orchestration.

## 2. Core Technologies
- **Python 3.11**
- [FastAPI](https://fastapi.tiangolo.com/): Web framework
- [SQLModel](https://sqlmodel.tiangolo.com/): Async ORM
- [Alembic](https://alembic.sqlalchemy.org/): DB migrations
- [Redis](https://redis.io/): Token cache
- [MinIO](https://min.io/): S3-compatible file storage
- [Pytest](https://docs.pytest.org/): Testing
- [Docker Compose](https://docs.docker.com/compose/): Local dev

## 3. Database Models
- **User**: Root entity with UUID primary key, `dontdie_uid`, and timestamps.
- **SelfModel**: Linked to User (FK), represents a user's self-model.
- **BeliefSystem**: Linked to SelfModel (FK), contains beliefs.
- **Belief**: Linked to BeliefSystem (FK), stores statements and confidence.
- **Measurement**: Linked to User (FK), stores health/wellness metrics.
- **UserFile**: Linked to User (FK), stores file metadata for MinIO uploads.
- **ChecklistItem**: Onboarding progress; fields: `user_id`, `bucket_code`, `status` (pending/complete), `data_ref` (JSON), `source`, `updated_at`.
- **ProtocolTemplate**: Habit/routine templates; fields: `habit_type`, `cue`, `routine`, `reward`, `dd_protocol_json` (JSON), `is_active`, `created_at`.

All relationships are managed via SQLModel with explicit foreign keys and back_populates for bidirectional navigation.

## 4. API Endpoints
All endpoints are async and OpenAPI 3.1 compliant, decorated for MCP compatibility.

- `POST /upsertSelfModel`: Upserts a user's SelfModel.
- `POST /upsertBelief`: Upserts a Belief in a BeliefSystem.
- `GET /getSelfModel`: Fetches a SelfModel by user_id.
- `POST /upsertMeasurement`: Upserts a Measurement for a user.
- `GET /getCohortStats`: Aggregates cohort stats (windowed).
- `GET /getProgress`: Returns profile completeness percent.
- `POST /uploadUserFile`: Uploads a file to MinIO/S3.
- **Checklist**
  - `GET /getChecklistProgress`: Returns required onboarding buckets, completed, and item details for a user.
  - `POST /markChecklistItem`: Upserts (marks) a checklist item as complete/incomplete, with optional metadata.
- **Protocols**
  - `GET /listProtocolTemplates`: List all active protocol templates, filterable by `habit_type`.
  - `POST /generateProtocol`: Generate a personalized protocol for a user based on a template (returns protocol JSON).
- **Trends**
  - `GET /getProgressTrend`: Returns a trend analysis (slope, sparkline) of user progress metrics over a window.

## 5. Authentication
- **Bearer token** (dev mode):
  - Tokens are mapped to user IDs in Redis.
  - Endpoints depend on a valid token in the `Authorization` header.
  - Token validation is performed via a dependency (`get_current_user`).

## 6. File Storage
- **MinIO** is used as an S3-compatible object store.
- Files are uploaded via `/uploadUserFile` endpoint and metadata is stored in the `UserFile` table.
- Credentials and endpoint are configured via environment variables.

## 7. Migrations
- **Alembic** is used for schema migrations.
- Migrations are run inside the Docker container to ensure all dependencies are available.
- Use `psycopg2` for Alembic (sync) migrations, and `asyncpg` for runtime async DB access.

## 8. Testing
- **Pytest** is used for both unit and integration tests.
- Integration tests run in Docker Compose with all services (Postgres, Redis, MinIO) available.
- Example: `docker compose run --rm profile-mcp pytest`
- Tests use `httpx.AsyncClient` for endpoint testing and direct DB access for setup/teardown.

## 9. Development Workflow
1. Copy `.env.example` to `.env` and set secrets/connection info.
2. Start services: `docker-compose up --build`
3. Run Alembic migrations: `docker compose exec profile-mcp alembic upgrade head`
4. Run tests: `docker compose run --rm profile-mcp pytest`
5. Use the OpenAPI docs at `/docs` for interactive exploration.

---

## Features
- **Onboarding Checklist:** Track and update user onboarding progress with required buckets and checklist items.
- **Protocol Templates:** Create, list, and generate personalized protocols for user habits/routines.
- **Progress Trends:** Analyze user progress metrics over time, with caching for efficiency.
- **Strict Dependency Pinning:** All dependencies are pinned for reproducibility and stability.
- **Clean Test Output:** Pytest config ensures no obsolete warnings or plugin conflicts; all tests pass in Docker.

For further details, see the codebase and endpoint docstrings. Contributions and questions are welcome!
