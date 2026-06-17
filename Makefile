.PHONY: setup check test build

setup:
	bun install

check:
	bun run scripts/run-check.ts

test:
	bun test

build:
	bun run build
