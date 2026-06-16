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
	test -d out || (echo "Static export output missing: expected out/ after build" >&2; exit 1)

quality-gate:
	bun run quality-gate
