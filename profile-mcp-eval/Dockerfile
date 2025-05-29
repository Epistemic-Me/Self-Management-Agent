FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user and setup directories for DeepEval
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app && \
    mkdir -p /app/.deepeval && \
    mkdir -p /app/app/.deepeval && \
    chown -R appuser:appuser /app/.deepeval && \
    chown -R appuser:appuser /app/app/.deepeval

# Set environment for DeepEval
ENV DEEPEVAL_TELEMETRY_OPT_OUT=true
ENV HOME=/app

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import asyncio; from app.client import ProfileMCPClient; import os; asyncio.run(ProfileMCPClient(os.getenv('PROFILE_MCP_BASE', 'http://profile-mcp:8010'), os.getenv('TOKEN', 'SIM_WORKER_TOKEN')).health_check())" || exit 1

# Run the main application
CMD ["python", "/app/app/main.py"] 