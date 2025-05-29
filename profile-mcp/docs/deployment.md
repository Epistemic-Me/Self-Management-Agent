# Deployment Guide

Production deployment strategies and configurations for Profile MCP.

## Production Environment Setup

### Prerequisites

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **PostgreSQL** (v15+) - managed service recommended
- **Redis** (v7+) - managed service recommended  
- **S3-compatible storage** - AWS S3, MinIO, or equivalent
- **Load balancer** - nginx, AWS ALB, or equivalent
- **SSL certificates** for HTTPS

### Environment Configuration

#### Production .env Template

```bash
# Database
DATABASE_URL=postgresql+asyncpg://username:password@db-host:5432/profile_mcp

# Redis Cache
REDIS_URL=redis://redis-host:6379/0

# S3 Storage
MINIO_ENDPOINT=https://s3.amazonaws.com
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=profile-mcp-files

# Security
JWT_SECRET_KEY=your-super-secure-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
WORKERS=4
```

## Deployment Strategies

### 1. Docker Compose (Simple)

For small to medium deployments with managed external services.

#### docker-compose.prod.yml

```yaml
services:
  profile-mcp:
    build: .
    ports:
      - "8010:8010"
    env_file:
      - .env.production
    environment:
      - PYTHONPATH=/app
      - WORKERS=4
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8010/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - profile-mcp
    restart: unless-stopped
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream profile_mcp {
        server profile-mcp:8010;
    }

    server {
        listen 80;
        server_name api.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://profile_mcp;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            proxy_pass http://profile_mcp;
        }
    }
}
```

### 2. Kubernetes Deployment

For scalable production deployments.

#### k8s/namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: profile-mcp
```

#### k8s/configmap.yaml

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: profile-mcp-config
  namespace: profile-mcp
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
  WORKERS: "4"
```

#### k8s/secret.yaml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: profile-mcp-secrets
  namespace: profile-mcp
type: Opaque
stringData:
  DATABASE_URL: "postgresql+asyncpg://username:password@db-host:5432/profile_mcp"
  REDIS_URL: "redis://redis-host:6379/0"
  MINIO_ACCESS_KEY: "your-access-key"
  MINIO_SECRET_KEY: "your-secret-key"
  JWT_SECRET_KEY: "your-super-secure-secret-key"
```

#### k8s/deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: profile-mcp
  namespace: profile-mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: profile-mcp
  template:
    metadata:
      labels:
        app: profile-mcp
    spec:
      containers:
      - name: profile-mcp
        image: profile-mcp:latest
        ports:
        - containerPort: 8010
        envFrom:
        - configMapRef:
            name: profile-mcp-config
        - secretRef:
            name: profile-mcp-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8010
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8010
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### k8s/service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: profile-mcp-service
  namespace: profile-mcp
spec:
  selector:
    app: profile-mcp
  ports:
  - port: 80
    targetPort: 8010
  type: ClusterIP
```

#### k8s/ingress.yaml

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: profile-mcp-ingress
  namespace: profile-mcp
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: profile-mcp-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: profile-mcp-service
            port:
              number: 80
```

### 3. AWS ECS Deployment

#### task-definition.json

```json
{
  "family": "profile-mcp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "profile-mcp",
      "image": "your-ecr-repo/profile-mcp:latest",
      "portMappings": [
        {
          "containerPort": 8010,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"},
        {"name": "LOG_LEVEL", "value": "INFO"},
        {"name": "WORKERS", "value": "4"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:profile-mcp/database-url"
        },
        {
          "name": "REDIS_URL", 
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:profile-mcp/redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/profile-mcp",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8010/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

## Database Migration Strategy

### Production Migration Process

1. **Backup Database**
   ```bash
   pg_dump -h db-host -U username -d profile_mcp > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test Migrations in Staging**
   ```bash
   # Apply migrations to staging environment first
   docker run --rm -e DATABASE_URL=$STAGING_DB_URL profile-mcp:latest alembic upgrade head
   ```

3. **Apply to Production**
   ```bash
   # During maintenance window
   docker run --rm -e DATABASE_URL=$PROD_DB_URL profile-mcp:latest alembic upgrade head
   ```

### Zero-Downtime Migration Strategy

For critical production systems:

1. **Blue-Green Deployment**
   - Deploy new version to green environment
   - Run migrations on green database
   - Switch traffic to green environment
   - Keep blue environment as rollback option

2. **Rolling Updates**
   - Ensure migrations are backward compatible
   - Deploy new version gradually
   - Monitor for issues during rollout

## Security Considerations

### Network Security

- Use private subnets for database and Redis
- Implement security groups/firewall rules
- Enable VPC flow logs for monitoring

### Application Security

- Use strong JWT secret keys (256-bit minimum)
- Implement rate limiting at load balancer level
- Enable CORS only for trusted domains
- Use HTTPS everywhere with valid certificates

### Data Security

- Encrypt data at rest (database, S3, Redis)
- Use encrypted connections (SSL/TLS)
- Implement proper backup encryption
- Regular security updates for base images

### Secrets Management

- Use managed secret services (AWS Secrets Manager, Azure Key Vault)
- Rotate secrets regularly
- Never commit secrets to version control
- Use least privilege access principles

## Monitoring and Observability

### Health Checks

Add health check endpoint to your FastAPI app:

```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }
```

### Logging

Configure structured logging:

```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        return json.dumps(log_entry)

logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
    format='%(message)s'
)
```

### Metrics Collection

Integrate with monitoring systems:

- **Prometheus**: Use `prometheus-fastapi-instrumentator`
- **DataDog**: Use `ddtrace` for APM
- **New Relic**: Use `newrelic` agent

### Alerting

Set up alerts for:
- High error rates (>5% 5xx responses)
- High response times (>2s p95)
- Database connection failures
- Memory/CPU usage (>80%)
- Disk space (>85% full)

## Backup and Recovery

### Database Backups

```bash
# Daily automated backup
#!/bin/bash
BACKUP_DIR="/backups/profile-mcp"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h $DB_HOST -U $DB_USER -d profile_mcp | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Retain backups for 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### S3 Backup

- Enable versioning on S3 buckets
- Configure lifecycle policies for cost optimization
- Set up cross-region replication for disaster recovery

### Recovery Testing

- Test backup restoration monthly
- Document recovery procedures
- Maintain RTO/RPO targets

## Performance Optimization

### Database Optimization

- Use connection pooling (SQLModel handles this)
- Add appropriate indexes for query patterns
- Monitor slow queries and optimize
- Consider read replicas for analytics

### Caching Strategy

- Use Redis for session data and frequently accessed data
- Implement application-level caching for expensive operations
- Consider CDN for static assets

### Scaling Considerations

- Horizontal scaling: Add more application instances
- Database scaling: Read replicas, sharding if needed
- File storage: Use CDN for file distribution
- Monitor and scale based on metrics

## Troubleshooting

### Common Issues

1. **Database Connection Timeouts**
   - Check connection pool settings
   - Verify network connectivity
   - Monitor database performance

2. **High Memory Usage**
   - Check for memory leaks
   - Optimize database queries
   - Adjust container memory limits

3. **File Upload Failures**
   - Verify S3 credentials and permissions
   - Check file size limits
   - Monitor S3 service status

### Debug Mode

Never enable debug mode in production. For troubleshooting:

```bash
# Temporarily increase log level
kubectl set env deployment/profile-mcp LOG_LEVEL=DEBUG

# View logs
kubectl logs -f deployment/profile-mcp

# Reset log level
kubectl set env deployment/profile-mcp LOG_LEVEL=INFO
```

## Rollback Procedures

### Application Rollback

```bash
# Kubernetes
kubectl rollout undo deployment/profile-mcp

# Docker Compose
docker-compose down
docker-compose up -d --scale profile-mcp=0
# Deploy previous version
docker-compose up -d
```

### Database Rollback

```bash
# Restore from backup
pg_restore -h $DB_HOST -U $DB_USER -d profile_mcp backup_YYYYMMDD_HHMMSS.sql

# Run down migrations if needed
docker run --rm -e DATABASE_URL=$PROD_DB_URL profile-mcp:previous-version alembic downgrade -1
```

Remember to test all deployment procedures in staging environments before applying to production.
