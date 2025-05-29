# Developer Guide

Contributing and development setup guide for Profile MCP.

## Development Environment Setup

### Prerequisites

- **Python 3.11+**
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Git**
- **IDE/Editor** with Python support (VS Code recommended)

### Quick Start

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd profile-mcp
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your local settings if needed
   ```

3. **Start Development Services**
   ```bash
   docker-compose up --build
   ```

4. **Run Initial Migrations**
   ```bash
   docker compose exec profile-mcp alembic upgrade head
   ```

5. **Verify Setup**
   ```bash
   # Check API
   curl http://localhost:8010/docs
   
   # Run tests
   docker compose run --rm profile-mcp pytest
   ```

## Docker Development Configuration

### Live Code Reloading

The Docker Compose configuration supports **live code reloading** for efficient development:

**Key Features:**
- **Volume Mounts**: Local code changes sync instantly with container
- **Auto-restart**: FastAPI server restarts automatically on code changes
- **Cache Isolation**: Python cache directories are isolated for better performance
- **No Rebuilds**: Code changes don't require container rebuilds

**Configuration Details:**
```yaml
# docker-compose.yml
services:
  profile-mcp:
    volumes:
      - .:/app                    # Sync local code to container
      - /app/__pycache__          # Isolate Python cache
      - /app/.pytest_cache        # Isolate pytest cache
    command: uvicorn app.main:app --host 0.0.0.0 --port 8010 --reload
```

**Benefits:**
- ⚡ **Instant feedback** - See changes immediately
- 🔄 **No rebuilds** - Faster development cycle
- 🧪 **Live testing** - Tests reflect current code state
- 🐛 **Live debugging** - Debug with current code

### Development Workflow

1. **Make code changes** in your local editor
2. **Save files** - Changes sync to container automatically
3. **Server restarts** automatically (watch for restart logs)
4. **Test immediately** - No rebuild required

## IDE Setup for Linting and IntelliSense

### Problem: Missing Package Imports

By default, your IDE may show linting errors because Python packages are only installed in the Docker container, not locally.

### Solution: Local Virtual Environment

**Step 1: Create Local Environment**
```bash
# Run the setup script
./setup-dev-env.sh

# Or manually:
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Step 2: Configure Your IDE**

#### VS Code Setup
1. **Copy settings template:**
   ```bash
   mkdir -p .vscode
   cp vscode-settings.json .vscode/settings.json
   ```

2. **Select Python interpreter:**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Python: Select Interpreter"
   - Choose `.venv/bin/python`

#### PyCharm Setup
1. **Go to Settings** → Project → Python Interpreter
2. **Add Interpreter** → Existing Environment
3. **Select** `.venv/bin/python`

#### Other IDEs
Point your IDE's Python interpreter to: `./profile-mcp/.venv/bin/python`

### IDE Benefits After Setup

- ✅ **Accurate autocomplete** and IntelliSense
- ✅ **Proper import resolution** for FastAPI, SQLModel, etc.
- ✅ **Type checking** with mypy
- ✅ **Code formatting** with black
- ✅ **Import sorting** with isort
- ✅ **No false linting errors**

### Development vs Runtime Separation

- **Local `.venv/`**: For IDE support (linting, autocomplete)
- **Docker container**: For running the application
- **Best of both worlds**: Great IDE experience + consistent runtime environment

## Project Structure

```
profile-mcp/
├── app/                    # Main application code
│   ├── __init__.py
│   ├── main.py            # FastAPI app and startup
│   ├── models.py          # SQLModel database models
│   ├── crud.py            # Database operations
│   ├── deps.py            # Dependencies and utilities
│   └── routers/           # API route handlers
│       ├── belief.py
│       ├── checklist.py
│       ├── file.py
│       ├── measurement.py
│       ├── protocols.py
│       ├── selfmodel.py
│       └── trend.py
├── alembic/               # Database migrations
│   ├── versions/          # Migration files
│   └── env.py            # Alembic configuration
├── tests/                 # Test suite
│   ├── conftest.py       # Test configuration
│   ├── test_*.py         # Test files
├── docs/                  # Documentation
├── requirements.txt       # Python dependencies
├── docker-compose.yml     # Local development setup
├── Dockerfile            # Container definition
├── alembic.ini           # Alembic configuration
└── pytest.ini           # Test configuration
```

## Code Style and Standards

### Python Style Guide

We follow PEP 8 with some modifications:

- **Line length**: 88 characters (Black default)
- **Import order**: isort with Black compatibility
- **Type hints**: Required for all public functions
- **Docstrings**: Google style for all public functions/classes

### Code Formatting

```bash
# Install development tools
pip install black isort mypy

# Format code
black app/ tests/
isort app/ tests/

# Type checking
mypy app/

# Or use pre-commit hooks (recommended)
pip install pre-commit
pre-commit install
```

### Example Code Style

```python
from typing import Optional, List
from uuid import UUID
from sqlmodel import Session, select
from app.models import User, SelfModel


async def get_user_self_models(
    session: Session, 
    user_id: UUID, 
    limit: Optional[int] = None
) -> List[SelfModel]:
    """Retrieve self models for a user.
    
    Args:
        session: Database session
        user_id: UUID of the user
        limit: Optional limit on number of results
        
    Returns:
        List of SelfModel objects
        
    Raises:
        ValueError: If user_id is invalid
    """
    query = select(SelfModel).where(SelfModel.user_id == user_id)
    if limit:
        query = query.limit(limit)
    
    result = await session.exec(query)
    return result.all()
```

## Database Development

### Model Changes

1. **Modify Models**
   ```python
   # app/models.py
   class User(SQLModel, table=True):
       id: UUID = Field(default_factory=uuid.uuid4, primary_key=True)
       dontdie_uid: str
       # Add new field
       email: Optional[str] = None
   ```

2. **Generate Migration**
   ```bash
   docker compose exec profile-mcp alembic revision --autogenerate -m "Add email field to User"
   ```

3. **Review Migration**
   ```bash
   # Check generated migration in alembic/versions/
   # Edit if needed for data migrations or complex changes
   ```

4. **Apply Migration**
   ```bash
   docker compose exec profile-mcp alembic upgrade head
   ```

### Database Operations

```python
# Example CRUD operations
from sqlmodel import Session, select
from app.models import User

async def create_user(session: Session, dontdie_uid: str) -> User:
    user = User(dontdie_uid=dontdie_uid)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

async def get_user_by_id(session: Session, user_id: UUID) -> Optional[User]:
    result = await session.exec(select(User).where(User.id == user_id))
    return result.first()
```

## API Development

### Adding New Endpoints

1. **Create Router Module**
   ```python
   # app/routers/new_feature.py
   from fastapi import APIRouter, Depends
   from sqlmodel import Session
   from app.deps import get_session, get_current_user
   
   router = APIRouter(prefix="/new-feature", tags=["new-feature"])
   
   @router.get("/")
   async def list_items(
       session: Session = Depends(get_session),
       current_user: str = Depends(get_current_user)
   ):
       # Implementation here
       return {"items": []}
   ```

2. **Register Router**
   ```python
   # app/main.py
   from app.routers import new_feature
   
   app.include_router(new_feature.router)
   ```

3. **Add Tests**
   ```python
   # tests/test_new_feature.py
   import pytest
   from httpx import AsyncClient
   
   @pytest.mark.asyncio
   async def test_list_items(client: AsyncClient, auth_headers):
       response = await client.get("/new-feature/", headers=auth_headers)
       assert response.status_code == 200
   ```

### Request/Response Models

```python
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class CreateItemRequest(BaseModel):
    name: str
    description: Optional[str] = None

class ItemResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime

@router.post("/", response_model=ItemResponse)
async def create_item(
    request: CreateItemRequest,
    session: Session = Depends(get_session)
):
    # Implementation
    pass
```

## Testing

### Test Structure

```python
# tests/test_example.py
import pytest
from httpx import AsyncClient
from sqlmodel import Session

@pytest.mark.asyncio
async def test_endpoint_success(client: AsyncClient, session: Session, auth_headers):
    """Test successful endpoint call."""
    # Arrange
    # Create test data
    
    # Act
    response = await client.get("/endpoint", headers=auth_headers)
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert "expected_field" in data

@pytest.mark.asyncio
async def test_endpoint_validation_error(client: AsyncClient, auth_headers):
    """Test endpoint with invalid input."""
    response = await client.post(
        "/endpoint", 
        json={"invalid": "data"}, 
        headers=auth_headers
    )
    assert response.status_code == 422
```

### Running Tests

```bash
# Run all tests
docker compose run --rm profile-mcp pytest

# Run specific test file
docker compose run --rm profile-mcp pytest tests/test_specific.py

# Run with coverage
docker compose run --rm profile-mcp pytest --cov=app

# Run tests with verbose output
docker compose run --rm profile-mcp pytest -v

# Run tests matching pattern
docker compose run --rm profile-mcp pytest -k "test_user"
```

### Test Database

Tests use a separate test database that's automatically created and cleaned up:

```python
# tests/conftest.py
@pytest.fixture
async def session():
    """Create test database session."""
    # Test database setup
    engine = create_async_engine("sqlite+aiosqlite:///test.db")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        yield session
    
    # Cleanup
    await engine.dispose()
```

## Debugging

### Local Debugging

1. **Add Debug Breakpoints**
   ```python
   import pdb; pdb.set_trace()  # Python debugger
   # or
   breakpoint()  # Python 3.7+
   ```

2. **Run with Debugger**
   ```bash
   # Attach to running container
   docker compose exec profile-mcp python -m pdb app/main.py
   ```

3. **VS Code Debugging**
   ```json
   // .vscode/launch.json
   {
       "version": "0.2.0",
       "configurations": [
           {
               "name": "Python: FastAPI",
               "type": "python",
               "request": "attach",
               "port": 5678,
               "host": "localhost",
               "pathMappings": [
                   {
                       "localRoot": "${workspaceFolder}",
                       "remoteRoot": "/app"
                   }
               ]
           }
       ]
   }
   ```

### Logging

```python
import logging

logger = logging.getLogger(__name__)

@router.get("/debug-endpoint")
async def debug_endpoint():
    logger.info("Processing request")
    logger.debug("Debug information")
    logger.warning("Warning message")
    
    try:
        # Some operation
        pass
    except Exception as e:
        logger.error(f"Error occurred: {e}", exc_info=True)
        raise
```

## Performance Considerations

### Database Optimization

```python
# Use select with specific columns
from sqlmodel import select

# Instead of: select(User)
query = select(User.id, User.dontdie_uid).where(User.created_at > date)

# Use eager loading for relationships
query = select(User).options(selectinload(User.self_models))

# Use pagination for large datasets
query = select(User).offset(skip).limit(limit)
```

### Async Best Practices

```python
# Use async/await consistently
async def process_users():
    async with get_session() as session:
        users = await session.exec(select(User))
        
        # Process in batches for large datasets
        for user in users:
            await process_user(user)

# Use asyncio.gather for concurrent operations
import asyncio

async def process_multiple_users(user_ids: List[UUID]):
    tasks = [process_user(user_id) for user_id in user_ids]
    results = await asyncio.gather(*tasks)
    return results
```

## Contributing Guidelines

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature-name
   ```

2. **Make Changes**
   - Follow code style guidelines
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/new-feature-name
   # Create pull request on GitHub/GitLab
   ```

### Commit Message Format

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Pull Request Checklist

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)
- [ ] Migration files included if needed
- [ ] Performance impact considered

## Common Development Tasks

### Adding New Dependencies

1. **Add to requirements.txt**
   ```bash
   echo "new-package==1.0.0" >> requirements.txt
   ```

2. **Rebuild Container**
   ```bash
   docker-compose up --build profile-mcp
   ```

3. **Test Integration**
   ```bash
   docker compose run --rm profile-mcp pytest
   ```

### Environment Variables

```python
# app/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    new_setting: str = "default_value"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Background Tasks

```python
from fastapi import BackgroundTasks

@router.post("/process-data")
async def process_data(
    background_tasks: BackgroundTasks,
    data: ProcessDataRequest
):
    background_tasks.add_task(process_data_async, data)
    return {"message": "Processing started"}

async def process_data_async(data: ProcessDataRequest):
    # Long-running task
    pass
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Ensure PYTHONPATH is set
   export PYTHONPATH=/app
   ```

2. **Database Connection Issues**
   ```bash
   # Check database is running
   docker compose ps postgres
   
   # Check connection
   docker compose exec postgres psql -U postgres -c "SELECT 1"
   ```

3. **Migration Conflicts**
   ```bash
   # Reset migrations (development only)
   docker compose exec profile-mcp alembic downgrade base
   docker compose exec profile-mcp alembic upgrade head
   ```

4. **Port Conflicts**
   ```bash
   # Check what's using ports
   lsof -i :8010
   lsof -i :5434
   ```

### Getting Help

- Check existing issues and documentation
- Run tests to isolate problems
- Use logging to debug issues
- Ask team members for code review

Remember to always test changes thoroughly before submitting pull requests!
