.PHONY: build test lint check install dev clean help docs benchmark security audit docker perf

build:
	pnpm build

test:
	pnpm test

test:coverage:
	pnpm test:coverage

lint:
	pnpm lint

check:
	pnpm check

install:
	pnpm install

dev:
	pnpm dev

clean:
	rm -rf dist node_modules

docs:
	pnpm docs:dev

docs:build:
	pnpm docs:build

benchmark:
	pnpm benchmark

security:audit:
	pnpm audit

security:fix:
	pnpm audit fix

docker:build:
	docker build -t openclaw .

docker:run:
	docker run -p 3000:3000 openclaw

perf:check:
	node scripts/perf-budget-check.js

help:
	@echo "Available commands:"
	@echo "  make build         - Build the project"
	@echo "  make test          - Run tests"
	@echo "  make test:coverage - Run tests with coverage"
	@echo "  make lint          - Run linters"
	@echo "  make check         - Run type checker"
	@echo "  make install       - Install dependencies"
	@echo "  make dev           - Start development server"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make docs          - Start documentation dev server"
	@echo "  make docs:build    - Build documentation"
	@echo "  make benchmark     - Run benchmarks"
	@echo "  make security:audit - Run security audit"
	@echo "  make security:fix   - Fix security vulnerabilities"
	@echo "  make docker:build   - Build Docker image"
	@echo "  make docker:run     - Run Docker container"
	@echo "  make perf:check     - Check performance budgets"
