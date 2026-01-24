# CS2Inspect Makefile
# Provides convenient shortcuts for common development tasks

.PHONY: help install dev build start preview test lint typecheck clean db-push db-studio docker-build docker-up docker-down deploy setup validate-env logs

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)CS2Inspect - Available Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Installation & Setup

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	bun install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

setup: ## Run interactive setup wizard
	@echo "$(BLUE)Starting setup wizard...$(NC)"
	./scripts/setup-wizard.sh

validate-env: ## Validate environment configuration
	@echo "$(BLUE)Validating environment...$(NC)"
	./scripts/validate-env.sh

##@ Development

dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	bun run dev

build: ## Build for production
	@echo "$(BLUE)Building application...$(NC)"
	bun run build
	@echo "$(GREEN)✅ Build completed$(NC)"

preview: ## Preview production build
	@echo "$(BLUE)Starting preview server...$(NC)"
	bun run preview

start: build preview ## Build and start production server

##@ Testing & Quality

test: ## Run all tests
	@echo "$(BLUE)Running tests...$(NC)"
	bun test

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	bun test --watch

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	bun test --coverage

lint: ## Run ESLint
	@echo "$(BLUE)Running linter...$(NC)"
	bun run lint

lint-fix: ## Run ESLint and fix issues
	@echo "$(BLUE)Running linter with auto-fix...$(NC)"
	bun run lint -- --fix
	@echo "$(GREEN)✅ Linting completed$(NC)"

typecheck: ## Run TypeScript type checking
	@echo "$(BLUE)Running type check...$(NC)"
	bun run typecheck

format: ## Format code with Prettier (if installed)
	@echo "$(BLUE)Formatting code...$(NC)"
	@if command -v prettier &> /dev/null; then \
		prettier --write "**/*.{js,ts,vue,css,md}"; \
		echo "$(GREEN)✅ Code formatted$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Prettier not installed$(NC)"; \
	fi

check: lint typecheck test ## Run all checks (lint, typecheck, test)
	@echo "$(GREEN)✅ All checks passed$(NC)"

##@ Database

db-push: ## Push database schema changes
	@echo "$(BLUE)Pushing database schema...$(NC)"
	bun run db:push
	@echo "$(GREEN)✅ Database schema updated$(NC)"

db-generate: ## Generate database migrations
	@echo "$(BLUE)Generating migrations...$(NC)"
	bun run db:generate

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	bun run db:migrate

db-studio: ## Open Drizzle Studio
	@echo "$(BLUE)Opening Drizzle Studio...$(NC)"
	bun run db:studio

db-reset: ## Reset database (WARNING: deletes all data)
	@echo "$(YELLOW)⚠️  WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		bun run db:push --force; \
		echo "$(GREEN)✅ Database reset$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

##@ Docker

docker-build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker compose build
	@echo "$(GREEN)✅ Docker images built$(NC)"

docker-up: ## Start Docker containers
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✅ Containers started$(NC)"

docker-down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker compose down
	@echo "$(GREEN)✅ Containers stopped$(NC)"

docker-logs: ## View Docker logs
	@echo "$(BLUE)Viewing Docker logs...$(NC)"
	docker compose logs -f

docker-restart: docker-down docker-up ## Restart Docker containers

docker-clean: ## Remove Docker containers and volumes
	@echo "$(YELLOW)⚠️  WARNING: This will remove all containers and volumes!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker compose down -v; \
		echo "$(GREEN)✅ Containers and volumes removed$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

docker-dev-up: ## Start development Docker environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Development environment started$(NC)"

docker-prod-up: ## Start production Docker environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Production environment started$(NC)"

##@ Deployment

deploy: ## Deploy to production (app branch)
	@echo "$(BLUE)Deploying to production...$(NC)"
	./scripts/deploy-app.sh
	@echo "$(GREEN)✅ Deployment completed$(NC)"

##@ Logs & Monitoring

logs: ## View application logs
	@echo "$(BLUE)Viewing logs...$(NC)"
	@if command -v pm2 &> /dev/null; then \
		pm2 logs cs2inspect; \
	else \
		tail -f logs/*.log; \
	fi

logs-error: ## View error logs only
	@echo "$(BLUE)Viewing error logs...$(NC)"
	@if [ -f logs/err.log ]; then \
		tail -f logs/err.log; \
	else \
		echo "$(YELLOW)No error logs found$(NC)"; \
	fi

logs-access: ## View access logs
	@echo "$(BLUE)Viewing access logs...$(NC)"
	@if [ -f logs/access.log ]; then \
		tail -f logs/access.log; \
	else \
		echo "$(YELLOW)No access logs found$(NC)"; \
	fi

health: ## Check application health
	@echo "$(BLUE)Checking application health...$(NC)"
	@curl -s http://localhost:3000/api/health/ready | python3 -m json.tool || echo "$(YELLOW)Application not responding$(NC)"

status: ## Check application status
	@echo "$(BLUE)Application Status:$(NC)"
	@if command -v pm2 &> /dev/null; then \
		pm2 list; \
	elif docker compose ps | grep -q "cs2inspect"; then \
		docker compose ps; \
	else \
		echo "$(YELLOW)No running processes found$(NC)"; \
	fi

##@ Maintenance

clean: ## Clean build artifacts and cache
	@echo "$(BLUE)Cleaning...$(NC)"
	rm -rf .nuxt .output node_modules/.cache dist
	@echo "$(GREEN)✅ Cleaned$(NC)"

clean-all: clean ## Clean everything including node_modules
	@echo "$(YELLOW)⚠️  WARNING: This will remove node_modules!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		rm -rf node_modules; \
		echo "$(GREEN)✅ Everything cleaned$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled$(NC)"; \
	fi

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	bun update
	@echo "$(GREEN)✅ Dependencies updated$(NC)"

audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	bun audit

##@ Documentation

docs-dev: ## Start documentation site in development mode
	@echo "$(BLUE)Starting documentation site...$(NC)"
	bun run docs:dev

docs-build: ## Build documentation site
	@echo "$(BLUE)Building documentation site...$(NC)"
	bun run docs:build

docs-preview: ## Preview documentation site
	@echo "$(BLUE)Previewing documentation site...$(NC)"
	bun run docs:preview

##@ Utilities

backup-db: ## Backup database
	@echo "$(BLUE)Creating database backup...$(NC)"
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	mkdir -p backups; \
	if [ -f .env ]; then \
		. .env; \
		mysqldump -h$$DATABASE_HOST -u$$DATABASE_USER -p$$DATABASE_PASSWORD $$DATABASE_NAME | gzip > backups/backup_$$TIMESTAMP.sql.gz; \
		echo "$(GREEN)✅ Backup created: backups/backup_$$TIMESTAMP.sql.gz$(NC)"; \
	else \
		echo "$(YELLOW).env file not found$(NC)"; \
	fi

restore-db: ## Restore database from backup (use BACKUP_FILE=path)
	@echo "$(BLUE)Restoring database...$(NC)"
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(YELLOW)Usage: make restore-db BACKUP_FILE=backups/backup_YYYYMMDD_HHMMSS.sql.gz$(NC)"; \
		exit 1; \
	fi
	@if [ -f .env ]; then \
		. .env; \
		gunzip < $(BACKUP_FILE) | mysql -h$$DATABASE_HOST -u$$DATABASE_USER -p$$DATABASE_PASSWORD $$DATABASE_NAME; \
		echo "$(GREEN)✅ Database restored from $(BACKUP_FILE)$(NC)"; \
	else \
		echo "$(YELLOW).env file not found$(NC)"; \
	fi

info: ## Display project information
	@echo "$(BLUE)CS2Inspect Project Information$(NC)"
	@echo ""
	@echo "  Node version:     $$(node --version)"
	@echo "  npm version:      $$(npm --version)"
	@if command -v docker &> /dev/null; then \
		echo "  Docker version:   $$(docker --version)"; \
	fi
	@if command -v pm2 &> /dev/null; then \
		echo "  PM2 version:      $$(pm2 --version)"; \
	fi
	@echo ""
	@if [ -f package.json ]; then \
		echo "  App version:      $$(node -p "require('./package.json').version")"; \
	fi
	@echo ""
