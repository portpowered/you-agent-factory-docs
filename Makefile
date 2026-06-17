.PHONY: setup check test build budget quality-gate component-coverage-boundary component-coverage

setup:
	bun install

check:
	bun run typecheck
	bun run lint

test:
	bun test --max-concurrency 4

build:
	bun run build
	test -d out || (echo "Static export output missing: expected out/ after build" >&2; exit 1)

budget:
	bun run budget

quality-gate:
	bun run quality-gate

component-coverage-boundary:
	bun run component-coverage:boundary

component-coverage:
	bun run component-coverage
