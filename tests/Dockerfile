FROM python:3.11-slim

WORKDIR /app

# Copy and install profile-mcp dependencies first
COPY profile-mcp/requirements.txt /tmp/profile-requirements.txt
RUN pip install --no-cache-dir -r /tmp/profile-requirements.txt

# Copy and install test dependencies
COPY tests/requirements.txt /tmp/test-requirements.txt
RUN pip install --no-cache-dir -r /tmp/test-requirements.txt

# Copy profile-mcp app code
COPY profile-mcp/app /app/app

# Copy test files
COPY tests /app/tests

CMD ["sleep", "infinity"] 