.PHONY: setup check budget component-coverage dev lint format typecheck test test-verify-contract test-build-contract test-system test-integration test-reader-facing test-ci-contract coverage build benchmark-static-export guard-pages-deployed-artifact ci validate-data scaffold linkcheck verify-content-runtime-completeness validate-pdf build-search-index component-examples planner-conflict-hotspots audit-canonical-page-surface verify-architectural-checklist-mechanism-status a11y

# CI / Pages contract targets (see .github/workflows/ci.yml and deploy-pages.yml).
# Local maintainers and automation share these entrypoints.

setup:
	bun install --frozen-lockfile

check: typecheck lint

budget:
	bun run budget

component-coverage:
	bun run coverage

dev:
	bun run dev

lint:
	bun run lint

format:
	bun run format

typecheck:
	bun run typecheck

test:
	bun run test

# Critical-route accessibility / responsive / layout-snapshot suite.
# Required by `make ci` and `.github/workflows/ci.yml`. On failure, reproduce
# with: make a11y  (or: bun run test:a11y)
a11y:
	bun run test:a11y

test-verify-contract:
	bun run test:verify-contract

test-build-contract:
	bun run test:build-contract

test-system:
	bun run test:system

test-integration:
	bun run test:integration

test-reader-facing:
	bun run test:reader-facing

test-ci-contract:
	bun run test:ci-contract

coverage:
	bun run coverage

# CI / Pages contract: static export that emits out/ for upload-pages-artifact.
# Reuses package.json build:export (NEXT_STATIC_EXPORT). Atlas/Phase-1 route
# verifiers were retired with rewrite-delete-atlas-domain and are not chained here.
build:
	bun run build:export

# Optional local static-export benchmark (not part of CI/Pages). Requires MODE=clean|warm.
# Clean wipes .next/out/.source/ignored generated outputs (deps stay installed);
# warm leaves artifacts in place. Prints a stable timing summary with mode=.
# Example: make benchmark-static-export MODE=clean
MODE ?=
benchmark-static-export:
	@if [ "$(MODE)" != "clean" ] && [ "$(MODE)" != "warm" ]; then \
		echo "benchmark-static-export requires MODE=clean or MODE=warm"; \
		exit 2; \
	fi
	bun run benchmark:static-export -- --mode=$(MODE)

# Pages deploy guard: reuse existing out/ (no second full export) and HTTP-probe
# project-site prefix correctness. deploy-pages.yml runs this after make build
# and before actions/upload-pages-artifact.
guard-pages-deployed-artifact:
	bun run guard:pages-deployed-artifact

verify-architectural-checklist-mechanism-status:
	bun run verify:architectural-checklist-mechanism-status

# Aligned with .github/workflows/ci.yml required suites (see src/lib/ci-required-path.ts).
# build produces one trusted out/ for test-integration + budget.
ci: lint typecheck test test-reader-facing a11y test-ci-contract test-verify-contract test-build-contract build test-integration budget component-coverage validate-data linkcheck

validate-data:
	bun run validate-data

scaffold:
	bun ./scripts/scaffold-doc-page.ts $(ARGS)

linkcheck:
	bun run linkcheck

verify-content-runtime-completeness:
	bun run verify:content-runtime-completeness

validate-pdf:
	@echo "validate-pdf: skipped (not yet implemented in scaffold)"
	@exit 0

build-search-index:
	bun run build:search-index

component-examples:
	bun ./scripts/component-examples.ts

planner-conflict-hotspots:
	bun run report:planner-conflict-hotspots

audit-canonical-page-surface:
	bun run audit:canonical-page-surface -- $(ARGS)
