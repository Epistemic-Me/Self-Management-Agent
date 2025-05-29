# Troubleshooting Guide

Common issues and solutions for Profile MCP development and deployment.

## Development Environment Issues

### Docker and Container Problems

#### Container Won't Start

**Symptoms:**
- `docker-compose up` fails
- Container exits immediately
- Port binding errors

**Solutions:**

1. **Check Port Conflicts**
   ```bash
   # Find what's using the port
   lsof -i :8010
   lsof -i :5434
   lsof -i :6379
   
   # Kill conflicting processes
   sudo kill -9 <PID>
   
   # Or change ports in docker-compose.yml
   ```

2. **Clear Docker Cache**
   ```bash
   # Remove containers and rebuild
   docker-compose down
   docker system prune -f
   docker-compose up --build
   ```

3. **Check Docker Resources**
   ```bash
   # Ensure Docker has enough memory (4GB+ recommended)
   docker system df
   docker system prune -a
   ```

#### Database Connection Failures

**Symptoms:**
- `sqlalchemy.exc.OperationalError`
- Connection timeout errors
- "database does not exist" errors

**Solutions:**

1. **Verify Database Container**
   ```bash
   # Check if postgres is running
   docker-compose ps postgres
   
   # Check logs
   docker-compose logs postgres
   
   # Connect manually
   docker-compose exec postgres psql -U postgres
   ```

2. **Reset Database**
   ```bash
   # Stop services
   docker-compose down
   
   # Remove database volume
   docker volume rm profile-mcp_postgres_data
   
   # Restart and run migrations
   docker-compose up -d postgres
   docker-compose run --rm profile-mcp alembic upgrade head
   ```

3. **Check Environment Variables**
   ```bash
   # Verify .env file exists and has correct DATABASE_URL
   cat .env | grep DATABASE_URL
   
   # Test connection string format
   # Should be: postgresql+asyncpg://postgres:postgres@postgres:5432/profile_mcp
   ```

### Python and Dependency Issues

#### Import Errors

**Symptoms:**
- `ModuleNotFoundError`
- `ImportError: cannot import name`

**Solutions:**

1. **Check PYTHONPATH**
   ```bash
   # In container
   docker-compose exec profile-mcp env | grep PYTHONPATH
   
   # Should be /app
   export PYTHONPATH=/app
   ```

2. **Verify Dependencies**
   ```bash
   # Check if packages are installed
   docker-compose exec profile-mcp pip list
   
   # Reinstall requirements
   docker-compose run --rm profile-mcp pip install -r requirements.txt
   ```

3. **Rebuild Container**
   ```bash
   # Force rebuild with no cache
   docker-compose build --no-cache profile-mcp
   ```

#### Package Version Conflicts

**Symptoms:**
- `pip` dependency resolution errors
- Runtime errors with specific packages

**Solutions:**

1. **Pin Specific Versions**
   ```bash
   # In requirements.txt, specify exact versions
   fastapi==0.104.1
   sqlmodel==0.0.14
   ```

2. **Use Virtual Environment Locally**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

## Database Issues

### Migration Problems

#### Migration Conflicts

**Symptoms:**
- `alembic.util.exc.CommandError`
- "Multiple heads" error
- Migration fails to apply

**Solutions:**

1. **Check Migration History**
   ```bash
   docker-compose exec profile-mcp alembic history
   docker-compose exec profile-mcp alembic current
   ```

2. **Resolve Multiple Heads**
   ```bash
   # Create merge migration
   docker-compose exec profile-mcp alembic merge -m "merge heads" heads
   docker-compose exec profile-mcp alembic upgrade head
   ```

3. **Reset Migrations (Development Only)**
   ```bash
   # WARNING: This will lose all data
   docker-compose exec profile-mcp alembic downgrade base
   docker-compose exec postgres psql -U postgres -c "DROP DATABASE profile_mcp; CREATE DATABASE profile_mcp;"
   docker-compose exec profile-mcp alembic upgrade head
   ```

#### Schema Mismatch

**Symptoms:**
- `sqlalchemy.exc.ProgrammingError`
- "column does not exist" errors
- "relation does not exist" errors

**Solutions:**

1. **Check Current Schema**
   ```bash
   docker-compose exec postgres psql -U postgres -d profile_mcp -c "\dt"
   docker-compose exec postgres psql -U postgres -d profile_mcp -c "\d users"
   ```

2. **Force Schema Sync**
   ```bash
   # Generate new migration
   docker-compose exec profile-mcp alembic revision --autogenerate -m "sync schema"
   docker-compose exec profile-mcp alembic upgrade head
   ```

### Performance Issues

#### Slow Queries

**Symptoms:**
- API endpoints taking >2 seconds
- Database connection timeouts
- High CPU usage

**Solutions:**

1. **Enable Query Logging**
   ```python
   # In app/main.py or database config
   import logging
   logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
   ```

2. **Add Database Indexes**
   ```sql
   -- Common indexes for Profile MCP
   CREATE INDEX idx_users_dontdie_uid ON users(dontdie_uid);
   CREATE INDEX idx_measurements_user_id ON measurements(user_id);
   CREATE INDEX idx_measurements_type_captured_at ON measurements(type, captured_at);
   CREATE INDEX idx_beliefs_belief_system_id ON beliefs(belief_system_id);
   ```

3. **Optimize Queries**
   ```python
   # Use select with specific columns
   query = select(User.id, User.dontdie_uid).where(User.id == user_id)
   
   # Use eager loading for relationships
   query = select(User).options(selectinload(User.measurements))
   ```

## API and Authentication Issues

### Authentication Failures

**Symptoms:**
- 401 Unauthorized responses
- "Invalid token" errors
- Token not found in Redis

**Solutions:**

1. **Check Redis Connection**
   ```bash
   # Test Redis
   docker-compose exec redis redis-cli ping
   
   # Check if tokens exist
   docker-compose exec redis redis-cli keys "*"
   docker-compose exec redis redis-cli get "your-token"
   ```

2. **Set Test Token**
   ```bash
   # Set a development token
   docker-compose exec redis redis-cli set "test-token" "550e8400-e29b-41d4-a716-446655440000"
   
   # Test API call
   curl -H "Authorization: Bearer test-token" http://localhost:8010/getSelfModel?user_id=550e8400-e29b-41d4-a716-446655440000
   ```

3. **Check Token Format**
   ```bash
   # Token should be in Authorization header
   Authorization: Bearer your-token-here
   
   # Not:
   Authorization: your-token-here
   ```

### CORS Issues

**Symptoms:**
- Browser console CORS errors
- "Access-Control-Allow-Origin" errors
- Preflight request failures

**Solutions:**

1. **Check CORS Configuration**
   ```python
   # In app/main.py
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000", "https://yourdomain.com"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Verify Origin Headers**
   ```bash
   # Check what origin browser is sending
   curl -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS http://localhost:8010/getSelfModel
   ```

### File Upload Issues

**Symptoms:**
- File upload timeouts
- S3/MinIO connection errors
- "File too large" errors

**Solutions:**

1. **Check MinIO Connection**
   ```bash
   # Test MinIO
   docker-compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
   docker-compose exec minio mc ls local
   ```

2. **Verify Bucket Exists**
   ```bash
   # Create bucket if missing
   docker-compose exec minio mc mb local/profile-mcp-files
   ```

3. **Check File Size Limits**
   ```python
   # In FastAPI app
   app.add_middleware(
       TrustedHostMiddleware, 
       allowed_hosts=["*"]
   )
   
   # Increase file size limit
   @app.post("/uploadUserFile")
   async def upload_file(file: UploadFile = File(..., max_size=50_000_000)):  # 50MB
   ```

## Testing Issues

### Test Failures

#### Database Test Issues

**Symptoms:**
- Tests fail with database errors
- "table already exists" errors
- Test isolation problems

**Solutions:**

1. **Check Test Database Setup**
   ```python
   # In tests/conftest.py
   @pytest.fixture
   async def session():
       # Use separate test database
       engine = create_async_engine("sqlite+aiosqlite:///test.db")
       # ... setup code
   ```

2. **Clean Test Database**
   ```bash
   # Remove test database files
   rm -f test.db*
   
   # Run tests again
   docker-compose run --rm profile-mcp pytest
   ```

#### Import Errors in Tests

**Symptoms:**
- Tests can't import app modules
- `ModuleNotFoundError` in test files

**Solutions:**

1. **Check Test PYTHONPATH**
   ```bash
   # In pytest.ini
   [tool:pytest]
   pythonpath = .
   testpaths = tests
   ```

2. **Use Relative Imports**
   ```python
   # In test files
   from app.models import User
   from app.main import app
   ```

### Performance Test Issues

**Symptoms:**
- Tests take too long
- Memory issues during testing
- Timeout errors

**Solutions:**

1. **Use Test Markers**
   ```python
   # Mark slow tests
   @pytest.mark.slow
   def test_expensive_operation():
       pass
   
   # Run only fast tests
   pytest -m "not slow"
   ```

2. **Optimize Test Database**
   ```python
   # Use in-memory SQLite for tests
   engine = create_async_engine("sqlite+aiosqlite:///:memory:")
   ```

## Production Issues

### Performance Problems

#### High Response Times

**Symptoms:**
- API responses >2 seconds
- Timeout errors
- High server load

**Solutions:**

1. **Check Application Metrics**
   ```bash
   # Monitor container resources
   docker stats
   
   # Check application logs
   docker-compose logs profile-mcp --tail=100
   ```

2. **Database Performance**
   ```sql
   -- Check slow queries (PostgreSQL)
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;
   ```

3. **Add Caching**
   ```python
   # Cache expensive operations
   from functools import lru_cache
   
   @lru_cache(maxsize=128)
   async def get_cached_data(user_id: str):
       # Expensive operation
       pass
   ```

#### Memory Issues

**Symptoms:**
- Out of memory errors
- Container restarts
- Slow garbage collection

**Solutions:**

1. **Monitor Memory Usage**
   ```bash
   # Check container memory
   docker stats --no-stream
   
   # Check Python memory usage
   pip install memory-profiler
   python -m memory_profiler app/main.py
   ```

2. **Optimize Database Connections**
   ```python
   # Limit connection pool size
   engine = create_async_engine(
       DATABASE_URL,
       pool_size=10,
       max_overflow=20
   )
   ```

3. **Process Large Data in Batches**
   ```python
   # Instead of loading all data
   async def process_all_users():
       offset = 0
       batch_size = 100
       
       while True:
           users = await get_users(offset=offset, limit=batch_size)
           if not users:
               break
               
           for user in users:
               await process_user(user)
               
           offset += batch_size
   ```

### Deployment Issues

#### Container Startup Failures

**Symptoms:**
- Containers exit immediately
- Health check failures
- Service unavailable errors

**Solutions:**

1. **Check Container Logs**
   ```bash
   # Kubernetes
   kubectl logs deployment/profile-mcp
   
   # Docker Compose
   docker-compose logs profile-mcp
   ```

2. **Verify Environment Variables**
   ```bash
   # Check if all required env vars are set
   kubectl get secret profile-mcp-secrets -o yaml
   
   # Test locally with same env
   docker run --env-file .env.production profile-mcp:latest
   ```

3. **Health Check Configuration**
   ```python
   # Add health check endpoint
   @app.get("/health")
   async def health_check():
       try:
           # Test database connection
           async with get_session() as session:
               await session.exec(select(1))
           return {"status": "healthy"}
       except Exception as e:
           raise HTTPException(status_code=503, detail=f"Unhealthy: {e}")
   ```

## Monitoring and Alerting

### Setting Up Monitoring

1. **Application Metrics**
   ```python
   # Add Prometheus metrics
   from prometheus_fastapi_instrumentator import Instrumentator
   
   Instrumentator().instrument(app).expose(app)
   ```

2. **Log Aggregation**
   ```python
   # Structured logging
   import structlog
   
   logger = structlog.get_logger()
   logger.info("User created", user_id=user.id, action="create_user")
   ```

3. **Health Monitoring**
   ```bash
   # Simple health check script
   #!/bin/bash
   response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8010/health)
   if [ $response -ne 200 ]; then
       echo "Health check failed: $response"
       exit 1
   fi
   ```

### Common Alert Conditions

- **High Error Rate**: >5% 5xx responses in 5 minutes
- **High Response Time**: >2s p95 response time
- **Database Issues**: Connection failures or slow queries
- **Memory Usage**: >80% memory utilization
- **Disk Space**: >85% disk usage

## Getting Help

### Information to Gather

When reporting issues, include:

1. **Environment Details**
   ```bash
   # System info
   uname -a
   docker --version
   docker-compose --version
   
   # Application info
   git rev-parse HEAD
   docker-compose ps
   ```

2. **Error Logs**
   ```bash
   # Application logs
   docker-compose logs profile-mcp --tail=50
   
   # Database logs
   docker-compose logs postgres --tail=20
   ```

3. **Configuration**
   ```bash
   # Environment variables (sanitized)
   env | grep -E "(DATABASE|REDIS|MINIO)" | sed 's/=.*/=***/'
   ```

### Debugging Steps

1. **Reproduce Locally**
   - Use same environment configuration
   - Test with minimal data set
   - Enable debug logging

2. **Isolate the Problem**
   - Test individual components
   - Check dependencies
   - Verify network connectivity

3. **Check Recent Changes**
   - Review recent commits
   - Check if issue started after deployment
   - Compare with working version

Remember: When in doubt, check the logs first, then verify configuration, and finally test individual components in isolation.
