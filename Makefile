.PHONY: setup check budget component-coverage dev lint format typecheck test test-verify-contract test-build-contract test-system test-integration coverage build ci validate-data scaffold linkcheck verify-content-runtime-completeness validate-pdf build-search-index component-examples planner-conflict-hotspots audit-canonical-page-surface verify-architectural-checklist-mechanism-status

# CI / Pages contract targets (see .github/workflows/ci.yml and deploy-pages.yml).
# Local maintainers and automation share these entrypoints.

setup:
	bun install --frozen-lockfile

check: typecheck lint

budget:
	@echo "budget: exported-site budget gate temporarily skipped during rewrite foundation"
	@exit 0

component-coverage:
	@echo "component-coverage: coverage gate temporarily skipped during rewrite foundation"
	@exit 0

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

test-verify-contract:
	bun run test:verify-contract

test-build-contract:
	bun run test:build-contract

test-system:
	bun run test:system

test-integration:
	bun run test:integration

coverage:
	bun run coverage

# CI / Pages contract: static export that emits out/ for upload-pages-artifact.
# Reuses package.json build:export (NEXT_STATIC_EXPORT). Atlas/Phase-1 route
# verifiers were retired with rewrite-delete-atlas-domain and are not chained here.
build:
	bun run build:export

verify-architectural-checklist-mechanism-status:
	bun run verify:architectural-checklist-mechanism-status

ci: lint typecheck test test-verify-contract coverage test-build-contract test-integration validate-data linkcheck

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
