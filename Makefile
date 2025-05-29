.PHONY: help build up down test test-integration test-e2e clean logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	docker compose build

up: ## Start all services
	docker compose up -d

down: ## Stop all services
	docker compose down

clean: ## Stop services and remove volumes
	docker compose down -v
	docker compose rm -f

logs: ## Show logs from all services
	docker compose logs -f

test: up ## Run all integration tests
	@echo "Waiting for services to be ready..."
	@sleep 10
	docker compose run --rm test-runner pytest tests/ -m "integration or e2e" -v

test-integration: up ## Run integration tests only
	@echo "Waiting for services to be ready..."
	@sleep 10
	docker compose run --rm test-runner pytest tests/integration/ -m "integration" -v

test-e2e: up ## Run end-to-end tests only
	@echo "Waiting for services to be ready..."
	@sleep 10
	docker compose run --rm test-runner pytest tests/integration/ -m "e2e" -v

test-local: ## Run tests against local services (assumes services are running)
	cd tests && python -m pytest -m "integration or e2e" -v

test-coverage: up ## Run tests with coverage report
	@echo "Waiting for services to be ready..."
	@sleep 10
	docker compose run --rm test-runner pytest tests/ -m "integration or e2e" --cov=app --cov-report=html --cov-report=term

install-test-deps: ## Install test dependencies locally
	pip install -r tests/requirements.txt

setup: build up ## Build and start all services
	@echo "Self-Management Agent is ready!"
	@echo "Services:"
	@echo "  - profile-mcp: http://localhost:8010/docs"
	@echo "  - dd-mcp: http://localhost:8090/docs"
	@echo "  - em-mcp: http://localhost:8120/docs"
	@echo "  - MinIO Console: http://localhost:9001"
	@echo ""
	@echo "Run 'make test' to execute integration tests"

status: ## Show status of all services
	docker compose ps 