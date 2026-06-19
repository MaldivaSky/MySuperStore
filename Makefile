.PHONY: help dev stop build migrate makemigrations seed shell test lint fmt

help:
	@echo ""
	@echo "  MySuperStore — comandos disponíveis"
	@echo ""
	@echo "  make dev              Sobe todos os serviços (API, Postgres, Redis, Meilisearch)"
	@echo "  make stop             Para os serviços"
	@echo "  make build            Reconstrói as imagens Docker"
	@echo "  make migrate          Roda as migrations pendentes"
	@echo "  make makemigrations   Cria migrations a partir das mudanças nos models"
	@echo "  make seed             Importa dados do banco antigo (SQLite legado)"
	@echo "  make shell            Abre o shell do Django (shell_plus)"
	@echo "  make test             Roda a suite de testes com pytest"
	@echo "  make lint             Roda ruff (linter) e mypy (types)"
	@echo "  make fmt              Formata o código com ruff format"
	@echo ""

dev:
	docker-compose up

stop:
	docker-compose down

build:
	docker-compose build

migrate:
	docker-compose run --rm api python manage.py migrate

makemigrations:
	docker-compose run --rm api python manage.py makemigrations

seed:
	docker-compose run --rm api python manage.py seed_data

seed-legacy:
	MSYS_NO_PATHCONV=1 docker-compose run --rm api python manage.py seed_from_legacy --db /legacy_db.sqlite3

shell:
	docker-compose run --rm api python manage.py shell_plus

test:
	docker-compose run --rm api pytest --cov=apps --cov-report=term-missing

lint:
	docker-compose run --rm api ruff check . && mypy .

fmt:
	docker-compose run --rm api ruff format .

superuser:
	docker-compose run --rm api python manage.py createsuperuser

collectstatic:
	docker-compose run --rm api python manage.py collectstatic --noinput

logs:
	docker-compose logs -f api

psql:
	docker-compose exec postgres psql -U postgres -d mysuperstore
