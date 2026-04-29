.PHONY: build test lint check install dev clean help

build:
	pnpm build

test:
	pnpm test

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

help:
	@echo "Available commands:"
	@echo "  make build    - Build the project"
	@echo "  make test     - Run tests"
	@echo "  make lint     - Run linters"
	@echo "  make check    - Run type checker"
	@echo "  make install  - Install dependencies"
	@echo "  make dev      - Start development server"
	@echo "  make clean    - Clean build artifacts"
