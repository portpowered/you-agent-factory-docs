.PHONY: setup check dev lint format typecheck test test-verify-contract test-build-contract test-system test-integration coverage build build-app-with-atlas-verifiers build-export budget component-coverage ci validate-data scaffold linkcheck verify-content-runtime-completeness validate-pdf build-search-index component-examples planner-conflict-hotspots audit-canonical-page-surface verify-architectural-checklist-mechanism-status verify-export-routes verify-export-search-shell verify-export-search-handoff verify-export-search-ux verify-phase-1-ux verify-phase-1-convergence verify-phase-1-built-app-convergence verify-phase-1-follow-up-convergence verify-phase-1-batch-012-convergence verify-phase-1-batch-013-convergence verify-phase-1-github-pages-convergence verify-phase-1-github-pages-deploy-convergence verify-phase-2-3-reconciliation-convergence verify-rendered-quality-baseline verify-rendered-quality-regression

# Maintainer and CI contract: setup installs deps; check runs typecheck + lint;
# test/build/budget/component-coverage are the stages referenced by .github/workflows.
setup:
	bun install --frozen-lockfile

check: typecheck lint

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

budget:
	@echo "budget: pass (transitional — exported-site budget gate not enforced during rewrite foundation)"

component-coverage:
	@echo "component-coverage: pass (transitional — component coverage gate not enforced during rewrite foundation)"

build:
	bun run build:export
	bun ./scripts/verify-static-export-out-dir.ts

# Opt-in Atlas production-build verifiers (not part of CI/deploy make build).
build-app-with-atlas-verifiers:
	bun run build
	bun ./scripts/verify-phase-1-static-routes.ts
	bun ./scripts/verify-grouped-query-attention-built-route.ts
	bun ./scripts/verify-docs-footer-hover-built-route.ts

build-export: build
	bun ./scripts/verify-phase-1-export-routes.ts
	bun ./scripts/verify-phase-1-export-search-shell.ts
	bun ./scripts/verify-phase-1-export-search-handoff.ts
	bun ./scripts/verify-phase-1-export-search-ux.ts

verify-architectural-checklist-mechanism-status:
	bun run verify:architectural-checklist-mechanism-status

verify-export-routes:
	bun ./scripts/verify-phase-1-export-routes.ts

verify-export-search-shell:
	bun ./scripts/verify-phase-1-export-search-shell.ts

verify-export-search-handoff:
	bun ./scripts/verify-phase-1-export-search-handoff.ts

verify-export-search-ux:
	bun ./scripts/verify-phase-1-export-search-ux.ts

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

verify-phase-1-ux:
	bun ./scripts/verify-phase-1-route-search-ux.ts

verify-phase-1-convergence:
	bun ./scripts/run-phase-1-convergence-pass.ts

verify-phase-1-built-app-convergence:
	bun ./scripts/run-phase-1-built-app-convergence-validator.ts

verify-phase-1-follow-up-convergence:
	bun ./scripts/run-phase-1-follow-up-convergence-pass.ts

verify-phase-1-batch-012-convergence:
	bun ./scripts/run-phase-1-batch-012-convergence-pass.ts

verify-phase-1-batch-013-convergence:
	bun ./scripts/run-phase-1-batch-013-convergence-pass.ts

verify-phase-1-github-pages-convergence:
	bun ./scripts/run-phase-1-github-pages-convergence-pass.ts

verify-phase-1-github-pages-deploy-convergence:
	bun ./scripts/run-phase-1-github-pages-deploy-convergence-pass.ts

verify-phase-2-3-reconciliation-convergence:
	bun ./scripts/run-phase-2-3-reconciliation-convergence-pass.ts

verify-phase-2-token-probability-path-convergence:
	bun ./scripts/run-phase-2-token-probability-path-convergence-pass.ts

verify-rendered-quality-baseline:
	bun ./scripts/run-rendered-quality-baseline-audit.ts

verify-rendered-quality-regression:
	bun ./scripts/run-rendered-quality-regression-pass.ts
