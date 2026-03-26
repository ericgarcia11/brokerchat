.PHONY: help up down build logs shell migrate seed test lint format

help: ## Mostra esta ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Sobe todos os serviços
	docker compose up -d

down: ## Para todos os serviços
	docker compose down

build: ## Builda as imagens
	docker compose build

rebuild: ## Builda sem cache
	docker compose build --no-cache

logs: ## Mostra logs de todos os serviços
	docker compose logs -f

logs-api: ## Mostra logs da API
	docker compose logs -f api

logs-worker: ## Mostra logs do worker
	docker compose logs -f worker

shell: ## Abre shell no container da API
	docker compose exec api bash

db-shell: ## Abre psql no banco externo
	psql -h $${POSTGRES_HOST:-localhost} -U $${POSTGRES_USER:-wwp} -d $${POSTGRES_DB:-wwp}

redis-cli: ## Abre redis-cli
	docker compose exec redis redis-cli

migrate: ## Roda migrations
	docker compose exec api alembic upgrade head

migrate-create: ## Cria nova migration (uso: make migrate-create MSG="descricao")
	docker compose exec api alembic revision --autogenerate -m "$(MSG)"

seed: ## Roda seeds
	docker compose exec api python -m scripts.seed

test: ## Roda testes
	docker compose exec api pytest -v --tb=short

test-cov: ## Roda testes com cobertura
	docker compose exec api pytest -v --cov=app --cov-report=term-missing

lint: ## Roda linter
	docker compose exec api ruff check app/ tests/

format: ## Formata código
	docker compose exec api ruff format app/ tests/

restart-api: ## Reinicia apenas a API
	docker compose restart api

restart-worker: ## Reinicia o worker
	docker compose restart worker

health: ## Checa health da API
	curl -s http://localhost:8000/health | python -m json.tool

ready: ## Checa readiness da API
	curl -s http://localhost:8000/ready | python -m json.tool
