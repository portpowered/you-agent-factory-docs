.PHONY: setup check test build quality-gate component-coverage-boundary component-coverage

setup:
	bun install

check:
	bun run typecheck
	bun run lint

test:
	bun test

build:
	bun run scripts/build-static-export.ts

quality-gate:
	bun run quality-gate

component-coverage-boundary:
	bun run component-coverage:boundary

component-coverage:
	bun run component-coverage
