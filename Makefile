.PHONY: setup check test build quality-gate

setup:
	bun install

check:
	bun run typecheck
	bun run lint

test:
	bun test

build:
	bun run build

quality-gate:
	bun run quality-gate
