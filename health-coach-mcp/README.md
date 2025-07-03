# Health Coach MCP Service

The Health Coach MCP (Model Context Protocol) service provides AI-powered health coaching with hierarchical constraint-based evaluation.

## Architecture Overview

The Health Coach implements a hierarchical constraint system:

```
User Evolution Goal
├── Cohort (Current State)
│   └── Intent Classes
│       └── Categories (Sleep/Nutrition/Exercise)
│           └── Granular Sub-intents
│               └── Specific Prompts & Constraints
```

## Key Features

- **Hierarchical Intent Routing**: Multi-level classification (category → intent → sub-intent)
- **Constraint-Based Responses**: Each interaction bounded by specific constraints
- **Provenance Tracking**: Full trace of routing decisions and constraints applied
- **Integration with Self-Management Agent**: Leverages user profiles, beliefs, and health data
- **Evaluation Support**: Structured logging for open coding analysis

## Service Endpoints

- **Base URL**: `http://localhost:8130`
- **API Documentation**: `http://localhost:8130/docs`

### Core Endpoints

- `POST /chat` - Main conversational interface with provenance
- `GET /cohorts` - List available user cohorts
- `GET /intents` - Get intent hierarchy
- `POST /evaluate` - Evaluate response against constraints
- `GET /health` - Service health check

## Development

### Prerequisites

- Docker and Docker Compose
- Python 3.11+
- Redis
- PostgreSQL

### Quick Start

1. Copy environment file:
   ```bash
   cp env.example .env
   ```

2. Update `.env` with your configuration

3. Start the service:
   ```bash
   docker compose up health-coach-mcp
   ```

### Running Tests

```bash
# Unit tests
pytest tests/

# Integration tests
pytest tests/integration/

# With coverage
pytest --cov=app tests/
```

## Intent Classification

### Cohorts
- **Sedentary Beginner**: No regular health habits
- **Health Enthusiast**: Regular exercise, decent sleep
- **Optimizer**: Tracking metrics, experimenting
- **Biohacker**: Advanced protocols, continuous monitoring

### Intent Classes
- **Plan**: Habit changes and planning
- **Task**: Automation and reminders
- **Opinion Research**: Collating beliefs and opinions
- **Evidence Research**: Scientific evidence exploration

### Categories
- **Sleep**: Sleep patterns, quality, optimization
- **Nutrition**: Diet, meal planning, supplementation
- **Exercise**: Physical activity, training, recovery

## Provenance Structure

Each response includes provenance data:

```json
{
  "response": "...",
  "provenance": {
    "cohort": "health_enthusiast",
    "intent_class": "evidence_research",
    "category": "exercise",
    "sub_intent": "meta_analysis_strength",
    "constraints_applied": [...],
    "confidence": 0.95,
    "trace_id": "..."
  }
}
```

## Integration Points

- **Profile MCP**: User profiles and preferences
- **EM MCP**: Belief systems and dialectics
- **DD MCP**: Health data and biomarkers