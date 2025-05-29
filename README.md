# Self-Management Agent

A comprehensive microservices architecture designed to support personal health and wellness management through AI-powered agents and Model Context Protocol (MCP) interfaces.

## Overview

The Self-Management Agent is built around four main microservices that work together to provide a complete health and wellness management platform:

1. **profile-mcp**: Core user profile and data management service
2. **em-mcp**: Epistemic Me integration for dialectic conversations and belief management
3. **profile-mcp-eval**: Background worker for conversation simulation and evaluation
4. **DD-MCP**: Don't Die API integration service (included as git submodule)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   profile-mcp   │    │     DD-MCP      │    │     em-mcp      │
│   (Port 8010)   │    │   (Port 8090)   │    │   (Port 8120)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼───┐              ┌───▼───┐
    │Database │              │ Redis │              │ Redis │
    │Services │              │ Cache │              │ Cache │
    └─────────┘              └───┬───┘              └───────┘
         │                       │                       │
    ┌────▼────┐                  │                  ┌───▼───┐
    │PostgreSQL│                  │                  │ EM    │
    │  MinIO   │                  │                  │ SDK   │
    │  Redis   │                  │                  └───────┘
    └─────────┘                  │
                                 │
                         ┌───────▼───────┐
                         │profile-mcp-eval│
                         │ Background     │
                         │ Worker         │
                         │ (DeepEval)     │
                         └────────────────┘
```

## Features

### Core Services

- **User Profile Management**: Comprehensive user data, self-models, and belief systems
- **Health Data Integration**: Measurements, biomarkers, and wellness protocols
- **Dialectic Conversations**: AI-powered philosophical and health discussions
- **Conversation Simulation**: Automated testing and evaluation using DeepEval
- **File Management**: Secure S3-compatible storage for user documents
- **Progress Tracking**: Onboarding workflows and habit formation

### Technology Stack

- **Backend**: FastAPI with async/await support
- **Database**: PostgreSQL with SQLModel/SQLAlchemy ORM
- **Cache**: Redis for performance and job queuing
- **Storage**: MinIO S3-compatible object storage
- **Frontend**: Next.js React applications
- **Protocol**: Model Context Protocol (MCP) for AI agent interactions
- **Testing**: pytest with DeepEval conversation simulation

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git with submodule support
- Environment variables (see `.env.example`)

### Installation

1. **Clone the repository with submodules**:
```bash
git clone --recursive https://github.com/Epistemic-Me/Self-Management-Agent.git
cd Self-Management-Agent
```

2. **Set up environment variables**:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start all services**:
```bash
docker-compose up -d
```

4. **Initialize user data** (optional):
```bash
docker-compose run user-setup
```

### Service Endpoints

- **Profile MCP**: http://localhost:8010
- **DD-MCP**: http://localhost:8090  
- **EM-MCP**: http://localhost:8120
- **PostgreSQL**: localhost:5434
- **MinIO Console**: http://localhost:9001
- **Redis**: localhost:6379

## Development

### Working with Submodules

The DD-MCP service is included as a git submodule. To update it:

```bash
# Update submodule to latest
git submodule update --remote DD-MCP

# Or check out a specific version
cd DD-MCP
git checkout v1.0.0
cd ..
git add DD-MCP
git commit -m "Update DD-MCP to v1.0.0"
```

### Running Tests

```bash
# Start test environment
docker-compose up -d

# Run integration tests
docker-compose run test-runner pytest tests/integration/

# Run unit tests
docker-compose run test-runner pytest tests/unit/
```

### Individual Service Development

Each service can be developed independently:

```bash
# Profile MCP
cd profile-mcp
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010

# EM MCP  
cd em-mcp
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8120

# DD-MCP (submodule)
cd DD-MCP
pip install -r requirements.txt
uvicorn main:app --reload --port 8090
```

## Configuration

### Environment Variables

Key environment variables (see `env.example` for complete list):

- `DD_TOKEN`: Don't Die API token
- `DD_CLIENT_ID`: Don't Die client ID  
- `OPENAI_API_KEY`: OpenAI API key for evaluations
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `MINIO_*`: MinIO/S3 storage configuration

### Database Migrations

```bash
# Run migrations
docker-compose exec profile-mcp alembic upgrade head

# Create new migration
docker-compose exec profile-mcp alembic revision --autogenerate -m "Description"
```

## API Documentation

When services are running, API documentation is available at:

- Profile MCP: http://localhost:8010/docs
- DD-MCP: http://localhost:8090/docs
- EM-MCP: http://localhost:8120/docs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update submodules if needed
6. Submit a pull request

### Code Quality

```bash
# Python services
ruff format .
ruff check .
pytest

# Frontend (web-ui)
cd web-ui
npm run lint
npm run test
```

## Deployment

### Production Considerations

- Use external PostgreSQL, Redis, and S3 services
- Set up proper SSL/TLS certificates
- Configure environment-specific variables
- Set up monitoring and logging
- Use production WSGI server (uvicorn with workers)

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring and Logs

```bash
# View logs
docker-compose logs -f profile-mcp
docker-compose logs -f dd-mcp
docker-compose logs -f em-mcp

# Health checks
curl http://localhost:8010/health
curl http://localhost:8090/health
curl http://localhost:8120/health
```

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: Use GitHub issue tracker
- **Documentation**: See `/docs` directory
- **API Reference**: Available at service `/docs` endpoints 