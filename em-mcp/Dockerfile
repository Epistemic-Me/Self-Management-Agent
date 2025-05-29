FROM python:3.12-slim

WORKDIR /app

# Copy and install Python SDK first
COPY Python-SDK /tmp/python-sdk
RUN cd /tmp/python-sdk && pip install -e .

COPY Apps/self-management-agent/em-mcp/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Apps/self-management-agent/em-mcp .

EXPOSE 8120

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8120"] 