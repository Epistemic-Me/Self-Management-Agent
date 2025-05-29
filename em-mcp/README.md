# em-mcp

FastAPI + fastapi-mcp proxy for Epistemic Me

## Overview

The `em-mcp` service provides a thin, MCP-compliant façade over the Epistemic Me server using the integrated Python SDK. It uses the official Epistemic Me SDK for direct gRPC communication and hides Protobuf ↔ JSON conversion so Bedrock agents can call simple REST tools. It forwards successful writes to profile-mcp to keep the user profile as the source of truth.

## Features

- **Integrated SDK**: Uses the official Epistemic Me Python SDK from the `Python-SDK` directory
- **Self Model Management**: Create, retrieve, and sync self models
- **Belief Management**: Create, update, list, and delete beliefs and belief systems
- **Dialectic Management**: Create and update dialectics with learning objectives
- **MCP Compliance**: OpenAPI 3.1 specification with operation IDs ≤ 64 chars
- **Token Caching**: Redis-based token→user ID caching with 24-hour TTL
- **Profile Sync**: Forward successful writes to profile-mcp service

## API Endpoints

| Route | Method | Description | SDK Support |
|-------|--------|-------------|-------------|
| `/createSelfModel` | POST | Create a new self model via EM SDK | ✅ Full |
| `/getSelfModel` | GET | Retrieve self model from EM SDK | ✅ Full |
| `/syncSelfModelToProfile` | POST | Sync self model from EM to profile-mcp | ✅ Full |
| `/updateBelief` | POST | Create a belief via EM SDK (update=create) | ⚠️ Limited |
| `/listBeliefSystems` | GET | Get belief system for a user | ✅ Full |
| `/deleteBelief` | DELETE | Delete a belief (not supported by SDK) | ❌ Not supported |
| `/createDialectic` | POST | Create a new dialectic with optional learning objective | ✅ Full |
| `/updateDialectic` | POST | Update dialectic with user answer and get next question | ✅ Full |

### SDK Limitations

- **Belief Updates**: The SDK only supports creating beliefs, not updating them. The `updateBelief` endpoint treats all requests as creates.
- **Belief Deletion**: The SDK does not support deleting beliefs. The `deleteBelief` endpoint returns an error.
- **Belief Systems**: The SDK returns a single belief system per user, not a list.

### Dialectic Functionality

The service supports full dialectic management through the Epistemic Me SDK:

#### Creating Dialectics

Create a new dialectic conversation with optional learning objectives:

```bash
POST /createDialectic
{
  "user_id": "user-123",
  "dialectic_type": "DEFAULT",
  "learning_objective": {
    "description": "Learn about user's health beliefs",
    "topics": ["health", "fitness", "exercise"],
    "target_belief_type": "FALSIFIABLE",
    "completion_percentage": 0.0
  }
}
```

**Response:**
```json
{
  "status": "ok",
  "data": {
    "id": "di_abc123",
    "self_model_id": "user-123",
    "agent": {
      "agent_type": "AGENT_TYPE_GPT_LATEST",
      "dialectic_type": "DEFAULT"
    },
    "user_interactions": [
      {
        "id": "interaction-1",
        "status": "PENDING_ANSWER",
        "type": "QUESTION_ANSWER",
        "interaction": {
          "question_answer": {
            "question": {
              "question": "What are your thoughts on exercise?"
            }
          }
        }
      }
    ],
    "learning_objective": { ... },
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Updating Dialectics

Answer questions and continue the dialectic conversation:

```bash
POST /updateDialectic
{
  "dialectic_id": "di_abc123",
  "user_id": "user-123",
  "answer": "I think exercise is very important for health",
  "custom_question": "What is your opinion on meditation?",  // optional
  "dry_run": false  // optional
}
```

**Response:**
```json
{
  "status": "ok",
  "data": {
    "id": "di_abc123",
    "user_interactions": [
      {
        "id": "interaction-1",
        "status": "ANSWERED",
        "interaction": {
          "question_answer": {
            "question": { "question": "What are your thoughts on exercise?" },
            "answer": { "user_answer": "I think exercise is very important for health" }
          }
        }
      },
      {
        "id": "interaction-2",
        "status": "PENDING_ANSWER",
        "interaction": {
          "question_answer": {
            "question": { "question": "How often do you exercise?" }
          }
        }
      }
    ],
    "updated_at": "2024-01-01T01:00:00Z"
  }
}
```

#### Learning Objectives

Learning objectives help guide the dialectic conversation:

- **`description`**: Human-readable description of what to learn
- **`topics`**: Array of topic keywords to focus on
- **`target_belief_type`**: Type of beliefs to target (e.g., "FALSIFIABLE")
- **`completion_percentage`**: Progress tracking (0.0 to 1.0)

## Setup

1. Copy environment variables:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your configuration:
   ```
   EM_API_BASE=http://localhost:8080
   EM_API_KEY=your-em-api-key
   REDIS_URL=redis://redis:6379/0
   PROFILE_MCP_URL=http://profile-mcp:8010
   PORT=8120
   ```

3. Start the service:
   ```bash
   docker-compose up --build
   ```

## Development

### Code Structure

The project follows a clean architecture pattern:

```
app/
├── main.py              # FastAPI application and lifespan management
├── em_sdk_client.py     # Integrated SDK client with async wrappers
├── proto_adapter.py     # Protocol buffer adapters
├── routers/
│   ├── self_model.py    # Self model management endpoints
│   ├── belief.py        # Belief management endpoints
│   └── dialectic.py     # Dialectic management endpoints
└── tests/
    ├── integration/     # Integration tests with mocked external APIs
    └── test_*.py        # Unit tests
```

**Key Files:**
- **`em_sdk_client.py`**: The heart of the service - wraps the official Epistemic Me SDK with async support and Redis caching
- **Routers**: Clean separation of concerns with dedicated routers for different entity types
- **Tests**: Comprehensive test suite covering unit, integration, and real E2E scenarios

### Running Tests

The project includes comprehensive unit and integration tests:

```bash
# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run only unit tests (faster)
pytest app/tests --ignore=app/tests/integration

# Run only integration tests
pytest app/tests/integration

# Run with coverage
pytest --cov=app --cov-report=term-missing
```

#### Test Runner Script

Use the included test runner for different test suites:

```bash
# Run all tests
python run_tests.py --suite all

# Run only unit tests
python run_tests.py --suite unit

# Run only integration tests  
python run_tests.py --suite integration

# Quick unit tests (stop on first failure)
python run_tests.py --suite quick

# Run with verbose output
python run_tests.py --verbose

# Run with coverage reporting
python run_tests.py --coverage
```

#### Test Types

**Unit Tests** (`app/tests/test_*.py`):
- Test individual components in isolation
- Mock external dependencies
- Fast execution
- 16 tests covering routers and core functionality

**Integration Tests** (`app/tests/integration/`):
- Test real HTTP calls and Redis integration **with mocked external APIs**
- Test complete workflows end-to-end
- Test error handling and recovery
- 29 tests covering:
  - API endpoint integration
  - Redis token caching
  - End-to-end workflows
  - Error recovery scenarios

**Real End-to-End Tests** (`app/tests/integration/test_real_e2e.py`):
- Test against **actual running EM server** at `http://localhost:8080`
- No mocking of external APIs
- Requires real services to be running
- Tests actual integration with live systems

#### Running Real E2E Tests

To run tests against the actual EM server:

```bash
# Set environment variables
export EM_REAL_E2E_TESTS=1
export EM_API_BASE=http://localhost:8080
export EM_API_KEY=your-real-api-key
export EM_TEST_TOKEN=your-test-token

# Run real E2E tests
python run_tests.py --suite real-e2e

# Or with pytest directly
pytest app/tests/integration/test_real_e2e.py -v
```

**Prerequisites for Real E2E Tests:**
1. EM server running at `http://localhost:8080`
2. Redis running at `redis://localhost:6380/0`
3. Valid API key and test token
4. `EM_REAL_E2E_TESTS=1` environment variable set

### API Documentation

Once running, visit:
- API Docs: http://localhost:8120/docs
- OpenAPI Spec: http://localhost:8120/openapi.json

### Authentication

All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-token>
```

The service caches token→user_id mappings in Redis for 24 hours.

## Architecture

The service has been simplified to use the integrated SDK approach:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │───▶│   em-mcp    │───▶│ Epistemic   │
│  (Bedrock)  │    │ (Port 8120) │    │ Me Server   │
└─────────────┘    └─────────────┘    └─────────────┘
                           │                   │
                           │            ┌─────────────┐
                           │            │ Python SDK  │
                           │            │ (Integrated)│
                           │            └─────────────┘
                           ▼
                   ┌─────────────┐
                   │ profile-mcp │
                   │ (Port 8010) │
                   └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │    Redis    │
                   │ (Port 6379) │
                   └─────────────┘
```

### Key Components

- **`em_sdk_client.py`**: Integrated SDK client that wraps the official Epistemic Me Python SDK
- **Redis Integration**: Token caching and session management
- **Router Layer**: REST API endpoints that translate to SDK calls
- **Profile Sync**: Automatic forwarding of writes to profile-mcp service

## Response Format

All endpoints return JSON in the format:
```json
{
  "status": "ok",
  "data": <payload>
}
```

Or for errors:
```json
{
  "status": "error", 
  "message": <error-message>
}
```

## Testing Strategy

The test suite ensures reliability through:

1. **Unit Testing**: Fast, isolated tests for individual components
2. **Integration Testing**: Real service interactions with mocked external APIs
3. **End-to-End Testing**: Complete workflow validation
4. **Error Testing**: Failure scenarios and recovery
5. **Performance Testing**: Token caching and concurrent request handling

All tests use pytest with async support and comprehensive mocking via respx for HTTP calls.

## Recent Changes

### SDK Integration (Latest)

The service has been updated to use the integrated Epistemic Me Python SDK approach:

**✅ Completed:**
- Migrated from custom HTTP client (`em_client.py`) to integrated SDK (`em_sdk_client.py`)
- All functionality now uses the official Python SDK from the `Python-SDK` directory
- Maintained Redis caching for token management
- Preserved all existing API endpoints and functionality
- Updated all tests to use the new SDK client

**Benefits:**
- **Consistency**: Uses the same SDK as other components in the ecosystem
- **Maintainability**: Reduces custom HTTP handling code
- **Reliability**: Leverages the official SDK's error handling and retry logic
- **Type Safety**: Better typing support through the SDK

**Migration Notes:**
- All imports updated from `em_client` to `em_sdk_client`
- Function signatures remain the same for backward compatibility
- Redis integration and token caching preserved
- All tests continue to pass without modification 