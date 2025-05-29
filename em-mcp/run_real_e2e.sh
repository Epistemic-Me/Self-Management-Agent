#!/bin/bash

# Script to run real end-to-end tests against live EM server
# 
# Prerequisites:
# 1. EM server running at http://localhost:8080
# 2. Redis running (or use docker compose)
# 3. Valid API credentials

echo "🚀 Running Real End-to-End Tests"
echo "================================="

# Check if EM server is running
echo "Checking EM server availability..."
if curl -s -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ EM server is running at http://localhost:8080"
else
    echo "❌ EM server not available at http://localhost:8080"
    echo "Please start the EM server before running real E2E tests"
    exit 1
fi

# Set environment variables for real E2E tests
export EM_REAL_E2E_TESTS=1
export EM_API_BASE=${EM_API_BASE:-http://localhost:8080}
export EM_API_KEY=${EM_API_KEY:-test-api-key}
export EM_TEST_TOKEN=${EM_TEST_TOKEN:-test-token}
export REDIS_URL=${REDIS_URL:-redis://localhost:6380/0}

echo ""
echo "Environment Configuration:"
echo "EM_API_BASE: $EM_API_BASE"
echo "EM_API_KEY: $EM_API_KEY"
echo "EM_TEST_TOKEN: $EM_TEST_TOKEN"
echo "REDIS_URL: $REDIS_URL"
echo ""

# Run the real E2E tests
echo "Running real E2E tests..."
docker compose run --rm \
    -e EM_REAL_E2E_TESTS=1 \
    -e EM_API_BASE="$EM_API_BASE" \
    -e EM_API_KEY="$EM_API_KEY" \
    -e EM_TEST_TOKEN="$EM_TEST_TOKEN" \
    -e REDIS_URL="$REDIS_URL" \
    em-mcp python run_tests.py --suite real-e2e --verbose

echo ""
echo "Real E2E tests completed!"
echo ""
echo "Note: These tests hit the actual EM server and will show real responses."
echo "If tests fail, check:"
echo "1. EM server is running and accessible"
echo "2. API credentials are valid"
echo "3. Redis is available" 