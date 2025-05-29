# Self-Management Agent Integration Tests

This directory contains comprehensive integration tests for the Self-Management Agent microservices architecture, validating end-to-end behavior across **profile-mcp**, **dd-mcp**, and **em-mcp** services.

## Overview

The integration test suite validates:

- **Cross-service communication** between all three MCP services
- **Authentication and caching** via Redis token management
- **Database operations** with PostgreSQL persistence
- **Self-model synchronization** between em-mcp and profile-mcp
- **Dialectic conversation workflows** through em-mcp
- **Onboarding and checklist management** in profile-mcp
- **Protocol generation and forwarding** to dd-mcp
- **Trend analysis and cohort statistics** in profile-mcp

## Test Structure

```
tests/
├── conftest.py                    # Common fixtures and utilities
├── integration/
│   ├── test_onboarding.py        # Onboarding checklist workflows
│   ├── test_self_model_sync.py   # Self-model creation and sync
│   ├── test_dialectic_flow.py    # Dialectic conversation workflows
│   ├── test_trend_and_stats.py   # Analytics and trend analysis
│   ├── test_protocol_generation.py # Protocol templates and generation
│   └── test_auth_cache.py        # Authentication and Redis caching
├── pytest.ini                    # Pytest configuration
├── requirements.txt              # Test dependencies
└── README.md                     # This file
```

## Prerequisites

1. **Docker and Docker Compose** installed
2. **Make** utility (optional, for convenience commands)
3. All three MCP services built and configured

## Environment Setup

The tests assume:

- **Docker Compose project name**: `sma` (Self-Management Agent)
- **Test token**: `TEST_TOKEN` maps to user `user-0001` in Redis
- **Service URLs**:
  - profile-mcp: `http://localhost:8010`
  - dd-mcp: `http://localhost:8090`
  - em-mcp: `http://localhost:8120`
- **Redis cache pattern**: `token:<token>` → `<user_id>`

## Running Tests

### Quick Start

```bash
# Build and start all services, then run tests
make test

# Or step by step:
make setup          # Build and start services
make test-integration  # Run integration tests only
make test-e2e       # Run end-to-end tests only
```

### Manual Execution

```bash
# Start services
docker compose up -d

# Wait for services to be ready (10-15 seconds)
sleep 10

# Run all integration tests
docker compose run --rm test-runner pytest tests/ -m "integration or e2e" -v

# Run specific test files
docker compose run --rm test-runner pytest tests/integration/test_onboarding.py -v

# Run with coverage
docker compose run --rm test-runner pytest tests/ --cov=app --cov-report=html
```

### Local Development

```bash
# Install test dependencies locally
pip install -r tests/requirements.txt

# Run tests against running services
pytest tests/ -m "integration or e2e" -v
```

## Test Categories

### Integration Tests (`@pytest.mark.integration`)

Standard integration tests that validate service interactions:

- **Onboarding**: Checklist creation, bucket completion
- **Self-model sync**: EM → Profile synchronization
- **Authentication**: Token caching, validation, expiration
- **Measurements**: Data storage, trend analysis
- **Protocols**: Template listing, generation, forwarding

### End-to-End Tests (`@pytest.mark.e2e`)

Complete workflow tests spanning multiple services:

- **Dialectic workflows**: Create → Update → Belief sync
- **Full user journeys**: Registration → Onboarding → Protocol generation

## Test Fixtures

### Core Fixtures (conftest.py)

- `async_client`: HTTP client for service requests
- `token`: Test authentication token (`TEST_TOKEN`)
- `user_id`: Test user ID (`user-0001`)
- `reset_state`: Cleans Redis and database between tests
- `service_urls`: Service endpoint URLs
- `auth_headers`: Authentication headers with test token

### Helper Functions

- `get_row_helper`: Query database rows directly
- `redis_get_helper`: Retrieve Redis cache values

## Test Data Management

### State Reset

Each test uses the `reset_state` fixture which:

1. **Flushes Redis** cache completely
2. **Truncates database tables** in dependency order
3. **Sets up test token** mapping in Redis
4. **Cleans up** after test completion

### Database Tables

Tests interact with these PostgreSQL tables:

- `users` - User accounts
- `self_models` - User self-models
- `belief_systems` - Belief system containers
- `beliefs` - Individual beliefs
- `measurements` - Health measurements
- `checklist_items` - Onboarding progress
- `protocol_templates` - Protocol templates
- `user_files` - File storage metadata

## Service Dependencies

### External APIs

Some tests interact with external APIs:

- **Don't Die API**: dd-mcp tests may fail if API is unavailable
- **Epistemic Me API**: em-mcp tests use SDK integration

Tests are designed to handle external API failures gracefully.

### Service Health

Tests include basic health checks and wait for services to be ready before execution.

## Debugging

### View Service Logs

```bash
# All services
make logs

# Specific service
docker compose logs -f profile-mcp
docker compose logs -f dd-mcp
docker compose logs -f em-mcp
```

### Database Inspection

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U postgres -d postgres

# View tables
\dt

# Query data
SELECT * FROM users;
SELECT * FROM checklist_items;
```

### Redis Inspection

```bash
# Connect to Redis
docker compose exec redis redis-cli

# View all keys
KEYS *

# Check token mapping
GET token:TEST_TOKEN
```

### Test Debugging

```bash
# Run single test with verbose output
docker compose run --rm test-runner pytest tests/integration/test_onboarding.py::test_auto_create_checklist -v -s

# Run with pdb debugging
docker compose run --rm test-runner pytest tests/integration/test_onboarding.py --pdb

# Run with print statements
docker compose run --rm test-runner pytest tests/integration/test_onboarding.py -v -s --capture=no
```

## Coverage Reports

```bash
# Generate HTML coverage report
make test-coverage

# View coverage
open htmlcov/index.html
```

## Continuous Integration

For CI/CD pipelines:

```bash
# CI command
docker compose up -d
docker compose run --rm test-runner pytest tests/ -m "integration or e2e" --junitxml=test-results.xml
docker compose down
```

## Troubleshooting

### Common Issues

1. **Services not ready**: Increase wait time before running tests
2. **Port conflicts**: Ensure ports 8010, 8090, 8120, 5434, 6379, 9000-9001 are available
3. **Database connection**: Check PostgreSQL container health
4. **Redis connection**: Verify Redis container is running
5. **External API failures**: Don't Die/EM API unavailability is handled gracefully

### Service Health Checks

```bash
# Check service status
make status

# Test service endpoints
curl http://localhost:8010/docs
curl http://localhost:8090/docs  
curl http://localhost:8120/docs
```

### Reset Environment

```bash
# Complete reset
make clean
make setup
```

## Contributing

When adding new tests:

1. **Use appropriate markers**: `@pytest.mark.integration` or `@pytest.mark.e2e`
2. **Include `reset_state` fixture**: Ensures clean test environment
3. **Test both success and failure cases**: Handle external API failures
4. **Verify database state**: Use `get_row_helper` for assertions
5. **Document test purpose**: Clear docstrings explaining what is tested

### Test Naming Convention

- `test_<feature>_<scenario>`: e.g., `test_onboarding_auto_create_checklist`
- Use descriptive names that explain the test purpose
- Group related tests in the same file

## Performance

- **Test execution time**: ~2-3 minutes for full suite
- **Service startup time**: ~10-15 seconds
- **Individual test time**: 1-5 seconds each

## Security

- Tests use isolated test tokens and user IDs
- Database is reset between tests
- No production data is used or affected 