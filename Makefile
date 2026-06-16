.PHONY: setup check test build quality-gate component-coverage-boundary component-coverage

setup:
	bun install

check:
	bun run typecheck
	bun run lint

test:
	bun test

build:
	rm -rf .next
	bun run build
	test -d out || (echo "Static export output missing: expected out/ after build" >&2; exit 1)

quality-gate:
	bun run quality-gate

component-coverage-boundary:
	bun run component-coverage:boundary

component-coverage:
	bun run component-coverage
