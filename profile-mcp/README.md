# profile-mcp

A FastAPI microservice for managing User → SelfModel → BeliefSystem trees, Don't Die measurements, and large user files. Designed for the Self-Manager Bedrock agent and compatible with Epistemic Me Proto.

 

## Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Available Ports**: 8010 (API), 5434 (PostgreSQL), 9000-9001 (MinIO), 6379 (Redis)
- **System Requirements**: 4GB RAM, 2GB disk space
- **Optional**: Python 3.11+ for local development

 

## Features

- Async SQLModel/Postgres for data
- MinIO S3 for file storage
- Redis for token cache
- Bearer token (dev) auth
- Alembic migrations
- OpenAPI 3.1, MCP-decorated endpoints
- **Onboarding Checklist**: Track user onboarding progress with checklist items and buckets
- **Protocol Templates**: Dynamic, personalized protocol generation for user habits/routines
- **Progress Trends**: Analyze user progress over time with cached trend endpoints
- **Simulation Job Queue**: Redis-based job queue for DeepEval conversation simulations

 

## Quick Start

 

### 1. Environment Setup

```bash
# Clone and navigate to the project
git clone <repository-url>
cd profile-mcp

# Copy environment configuration
cp .env.example .env
# Edit .env if needed for custom configuration
```

### 2. Start Services

```bash
# Build and start all services
docker-compose up --build

# Expected output: Services starting on ports 8010, 5434, 9000-9001, 6379
# Wait for "Application startup complete" message
```

### 3. Run Database Migrations

```bash
# Apply database schema
docker compose exec profile-mcp alembic upgrade head
```

### 4. Verify Installation

```bash
# Check API documentation
curl http://localhost:8010/docs

# Run test suite
docker compose run --rm profile-mcp pytest
```

## Development Setup

For **live code reloading** and **IDE support** with proper linting and autocomplete:

📖 **See [Development Guide](docs/development.md)** for:
- **Docker live reloading** configuration
- **Local virtual environment** setup for IDE support
- **VS Code/PyCharm** configuration
- **Linting and formatting** setup

**Quick IDE Setup:**
```bash
# Create local environment for IDE support
./setup-dev-env.sh

# Configure your IDE to use: .venv/bin/python
```

 

## API Usage Examples

 

### Authentication

```bash
# For development, tokens map to user IDs in Redis
# Set a test token (replace with your user ID)
docker compose exec redis redis-cli set "test-token-123" "your-user-id"
```

 

### Core Endpoints

```bash
# Create a SelfModel
curl -X POST "http://localhost:8010/upsertSelfModel" \
  -H "Authorization: Bearer test-token-123" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-user-id"}'

# Upload a file
curl -X POST "http://localhost:8010/uploadUserFile" \
  -H "Authorization: Bearer test-token-123" \
  -F "file=@example.txt"

# Get onboarding progress
curl -X GET "http://localhost:8010/getChecklistProgress" \
  -H "Authorization: Bearer test-token-123"
```

 

## Endpoints

- `POST /upsertSelfModel` — Upsert a SelfModel (Proto)
- `POST /upsertBelief` — Upsert a Belief (Proto)
- `GET /getSelfModel` — Fetch SelfModel by user_id
- `POST /upsertMeasurement` — Upsert a Measurement
- `GET /getCohortStats` — Cohort stats (window agg)
- `GET /getProgress` — Profile completeness %
- `POST /uploadUserFile` — Upload user file to MinIO
- **Checklist**
  - `GET /getChecklistProgress` — Get onboarding progress and bucket/item statuses
  - `POST /markChecklistItem` — Mark or update a checklist item (status, metadata)
- **Protocols**
  - `GET /listProtocolTemplates` — List protocol templates (filterable)
  - `POST /generateProtocol` — Generate personalized protocol from template
- **Trends**
  - `GET /getProgressTrend` — Get user progress trend (slope, sparkline)
- **Conversations & Dialectics**
  - `POST /startConversation` — Start a new conversation (auto-creates checklist items)
  - `POST /appendTurn` — Add a turn to a conversation (with optional close)
  - `GET /listConversations` — List conversations with filtering
  - `GET /getConversation` — Get conversation with all turns
  - `POST /startDialectic` — Start a dialectic session (with optional conversation link)
  - `POST /appendDialecticTurn` — Add interaction to dialectic
  - `GET /getDialectic` — Get dialectic with all interactions
  - `GET /listDialectics` — List dialectics with filtering
- **Simulation**
  - `POST /simulateConversation` — Enqueue DeepEval simulation jobs for background processing

 

## Storing Conversations & Dialectics

The profile-mcp service now supports persistent storage of conversations and dialectic sessions, enabling full transcript queries for chat UIs and DeepEval analysis.

### Conversation Management

```bash
# Start a new conversation
curl -X POST "http://localhost:8010/startConversation" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "meta": {"model": "gpt-4", "template": "health_coach"}
  }'

# Add turns to the conversation
curl -X POST "http://localhost:8010/appendTurn" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv-uuid",
    "role": "user",
    "content": "I want to improve my health",
    "extra_json": {"timestamp": "2024-01-01T10:00:00Z"}
  }'

# Get full conversation transcript
curl -X GET "http://localhost:8010/getConversation?conversation_id=conv-uuid"

# List user conversations
curl -X GET "http://localhost:8010/listConversations?user_id=your-user-id&limit=10"
```

### Dialectic Session Management

```bash
# Start a dialectic session
curl -X POST "http://localhost:8010/startDialectic" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "learning_objective": {
      "description": "Learn about user health beliefs",
      "topics": ["health", "fitness", "exercise"],
      "target_belief_type": "FALSIFIABLE"
    }
  }'

# Add Q&A interactions
curl -X POST "http://localhost:8010/appendDialecticTurn" \
  -H "Content-Type: application/json" \
  -d '{
    "dialectic_id": "dialectic-uuid",
    "role": "question",
    "content": "What is your opinion on daily exercise?",
    "extra_json": {"question_type": "open_ended"}
  }'

curl -X POST "http://localhost:8010/appendDialecticTurn" \
  -H "Content-Type: application/json" \
  -d '{
    "dialectic_id": "dialectic-uuid",
    "role": "answer",
    "content": "I think daily exercise is essential for good health",
    "extra_json": {"confidence": 0.9}
  }'

# Get full dialectic transcript
curl -X GET "http://localhost:8010/getDialectic?dialectic_id=dialectic-uuid"
```

### Linking Conversations and Dialectics

```bash
# Start a dialectic linked to a conversation
curl -X POST "http://localhost:8010/startDialectic" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "conversation_id": "conv-uuid",
    "learning_objective": {
      "description": "Explore beliefs within conversation context"
    }
  }'
```

### Key Features

- **Auto-Checklist Creation**: Starting a conversation automatically creates 7 required onboarding checklist items if none exist
- **Flexible Linking**: Dialectics can be linked to conversations or exist independently
- **Rich Metadata**: Both conversations and dialectics support JSON metadata for context
- **Learning Objectives**: Dialectics can include structured learning objectives matching Proto format
- **Full Transcripts**: Complete conversation and dialectic histories for analysis
- **Filtering & Pagination**: List endpoints support user filtering and pagination

 

## Simulation Job Queue

The profile-mcp service now includes a Redis-based job queue system for enqueuing DeepEval conversation simulations. This enables web-ui and other clients to request background simulation processing.

### Enqueuing Simulation Jobs

```bash
# Enqueue a conversation simulation job
curl -X POST "http://localhost:8010/simulateConversation" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-user-id",
    "template": "default_sleep"
  }'

# Response
{
  "status": "ok",
  "data": {
    "queued": true
  }
}
```

### Job Schema

```python
class SimRequest(BaseModel):
    user_id: UUID       # Target user for simulation
    template: str       # Simulation template (default: "default")
```

### Redis Integration

- **Queue Name**: `simulation_jobs`
- **Redis Database**: Database 1 (separate from auth cache)
- **Job Format**: JSON serialized SimRequest objects
- **Processing**: Jobs consumed by `profile-mcp-eval` background worker
- **Environment Variable**: `SIM_JOB_QUEUE_URL=redis://redis:6379/1`

### Authentication

The simulation endpoint requires Bearer token authentication and uses the same authentication flow as other profile-mcp endpoints.

 

## Development Workflow

 

### Local Development

```bash
# Start services in background
docker-compose up -d

# Run migrations
docker compose exec profile-mcp alembic upgrade head

# View logs
docker compose logs -f profile-mcp

# Run tests
docker compose run --rm profile-mcp pytest

# Access database
docker compose exec postgres psql -U postgres

# Access Redis CLI
docker compose exec redis redis-cli

# Access MinIO CLI
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
```

 

### Making Changes

```bash
# Rebuild after code changes
docker-compose up --build profile-mcp

# Create new migration
docker compose exec profile-mcp alembic revision --autogenerate -m "Description"

# Run specific tests
docker compose run --rm profile-mcp pytest tests/test_specific.py -v

# Test simulation job queue
docker compose run --rm profile-mcp pytest tests/integration/test_sim_queue.py -v
```

 

### Troubleshooting

- **Port conflicts**: Check if ports 8010, 5434, 9000-9001, 6379 are available
- **Database connection**: Ensure PostgreSQL is ready before running migrations
- **File uploads**: Verify MinIO credentials in .env match docker-compose.yml
- **Token errors**: Check Redis connection and token format

 

## Dependency Management

All dependencies are pinned in `requirements.txt` for reproducibility and stability. This includes:

- `fastapi-mcp` for MCP/OpenAPI integration
- `pydantic>=2.10.6` for FastAPI/SQLModel compatibility
- Matching versions for SQLModel, asyncpg, Alembic, etc.

If you update dependencies, always rebuild your Docker image and rerun tests to catch incompatibilities early.

 

## Clean Test Output & CI

- All warnings from Pydantic, SQLModel, and Starlette are resolved.
- No plugin or config warnings in CI/test output.
- If you see plugin errors (e.g., langsmith), ensure your environment does not mix LLM tooling with this service.

 

## Tests

- `pytest` for async/unit
- `docker-compose run --rm profile-mcp pytest` for integration

 

## Documentation

- [Technical Overview](docs/overview.md) - Detailed architecture and implementation
- [API Documentation](docs/api.md) - Complete endpoint reference
- [Deployment Guide](docs/deployment.md) - Production deployment strategies
- [Developer Guide](docs/development.md) - Contributing and development setup
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

 

## License

MIT
