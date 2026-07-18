.PHONY: setup check budget component-coverage dev lint format typecheck test test-verify-contract test-build-contract test-w20-contract-projection test-w20-content-registry test-w20-link-anchor test-w20-search-functional test-w20-a11y-responsive test-w20-static-export test-w20-pages-prefixed-export test-w20-budget test-w20-client-chunk-exclusion test-w20-ownership-migration test-w20-final-evidence test-website-static-search test-system test-integration test-reader-facing test-ci-contract coverage build benchmark-static-export guard-pages-deployed-artifact ci validate-data scaffold linkcheck verify-content-runtime-completeness validate-pdf build-search-index component-examples planner-conflict-hotspots audit-canonical-page-surface verify-architectural-checklist-mechanism-status a11y

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

# W20 focused contract + projection convergence (package acquisition +
# normalized reference projections). Reproduce with: make test-w20-contract-projection
test-w20-contract-projection:
	bun run test:w20-contract-projection

# W20 content + registry validation convergence (validate-data,
# content-runtime completeness, published Factory-reference route presence).
# Reproduce with: make test-w20-content-registry
test-w20-content-registry:
	bun run test:w20-content-registry

# W20 link + anchor validation convergence (make linkcheck + reference
# operation / schema / CLI / MCP / JS / event anchor suites).
# Reproduce with: make test-w20-link-anchor
test-w20-link-anchor:
	bun run test:w20-link-anchor

# Static-search bootstrap + export consumer path proofs (search domain).
# Also used as the W20 story 004 command gate.
test-website-static-search:
	bun run test:website:static-search

# W20 search functional convergence (static-search bootstrap + W16 item
# deep-link / representative query suites).
# Reproduce with: make test-w20-search-functional
test-w20-search-functional:
	bun run test:w20-search-functional

# W20 a11y / responsive / focused-payload-budget convergence (make a11y +
# W19 representative surfaces + narrow keyboard browser-path). Total-site
# budget remains story 008. Reproduce with: make test-w20-a11y-responsive
test-w20-a11y-responsive:
	bun run test:w20-a11y-responsive

# W20 full static export convergence (make build + FR-33 corpus / FR-34
# no-live-host proofs against out/). Reproduce with: make test-w20-static-export
test-w20-static-export:
	bun run test:w20-static-export

# W20 Pages-prefixed export + deployed-artifact guard convergence
# (GITHUB_PAGES_BASE_PATH=/you-agent-factory-docs make build then
# make guard-pages-deployed-artifact on the same out/). Reproduce with:
# make test-w20-pages-prefixed-export
test-w20-pages-prefixed-export:
	bun run test:w20-pages-prefixed-export

# W20 total-site + focused reference payload budget convergence
# (make budget against trusted out/; run make build first when out/ is
# missing). Reproduce with: make test-w20-budget
test-w20-budget:
	bun run test:w20-budget

# W20 package acquisition / resolver client-chunk exclusion convergence
# (browser-safe helpers stay clean; server-only resolver modules fail closed).
# Reproduce with: make test-w20-client-chunk-exclusion
test-w20-client-chunk-exclusion:
	bun run test:w20-client-chunk-exclusion

# W20 plan §9/§11 ownership map + W18 migration ledger closure convergence.
# Reproduce with: make test-w20-ownership-migration
test-w20-ownership-migration:
	bun run test:w20-ownership-migration

# W20 final evidence + upstream Worker/Workstation discriminated-schema
# follow-ups (make check + exported-surface browser verify). Reproduce with:
# make test-w20-final-evidence
test-w20-final-evidence:
	bun run test:w20-final-evidence

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
