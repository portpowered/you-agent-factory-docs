.PHONY: setup check test build

setup:
	bun install

check:
	bun run typecheck
	bun run lint

test:
	bun test

build:
	bun run build
