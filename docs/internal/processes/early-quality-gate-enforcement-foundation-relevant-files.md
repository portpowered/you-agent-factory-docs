# Early quality-gate enforcement foundation — relevant files

## Authoritative gate path

- `make quality-gate` and `bun run quality-gate` are the single early enforcement entrypoints for contributors and automation.
- `scripts/quality-gate.ts` orchestrates the enforced sequence and fails fast on the first failing step.
- `src/lib/quality-gate/deferred-phase8.ts` lists checks intentionally deferred to later Phase 8 work.
- `.github/workflows/ci.yml` runs `make setup` then `make quality-gate` without bypassing the root `Makefile`.
- `README.md` documents the same authoritative path, lists the enforced foundation checks, and marks deferred Phase 8 work out of scope for this lane.

## Enforced foundation checks

The early gate currently runs, in order:

1. `bun run typecheck`
2. `bun run lint`
3. `bun run validate:localization` → `scripts/validate-localization.ts` → `src/localization/lib/validate-messages.ts`
4. `bun run validate:content` → `scripts/validate-content.ts` → `src/lib/content/load-starter-content.ts` and `src/lib/content/starter.ts`
5. `bun run validate:accessibility` → `scripts/validate-accessibility.ts` → bounded expectations in `src/lib/validation/shell-accessibility.ts` plus focused shell tests in `tests/unit/homepage-shell.test.tsx`, `tests/unit/docs-route-shell.test.tsx`, `tests/unit/docs-route-chrome.test.tsx`, and `tests/unit/shell-accessibility-validation.test.tsx`
6. `bun run validate:static-export` → `scripts/validate-static-export.ts` → `src/lib/validation/static-export.ts`, one cleaned `make build` production export under `withStaticExportBuildLock()`, `out/` presence, and `tests/unit/static-export.test.ts` with `STATIC_EXPORT_SKIP_BUILD=1` so served-export tests reuse the gate build output
7. `bun run validate:search-index` → `scripts/validate-search-index.ts` → `src/lib/validation/search-index.ts` for dedicated generated-search-data contract validation reused by the broader gate
8. Remaining foundation unit tests (`tests/unit/project.test.ts`, `tests/unit/site.test.ts`)

`make check`, `make test`, `make build`, and `make validate-search-index` remain narrower helper targets. They are not substitutes for `make quality-gate`.

Contract tests in `tests/unit/quality-gate.test.ts` are run via `bun test` and are intentionally excluded from the gate orchestrator to avoid recursive self-invocation.

## Phase 8 boundary

Deferred from this early lane (see `DEFERRED_PHASE_8_QUALITY_CHECKS`):

- broad package coverage policy enforcement
- launch-content completeness enforcement
- broader route coverage and richer performance instrumentation beyond the current narrow budget gate

Later localization and canonical content foundations plug into the same `validate:localization` and `validate:content` scripts instead of introducing a parallel gate surface.

`src/lib/validation/gate-fixtures.ts` exposes `EARLY_GATE_VALIDATION_FIXTURE` values for subprocess failing-path proof in `tests/unit/quality-gate-validation-failing-path.test.ts`. Use this only in tests; production runs omit the env var.
`src/lib/validation/quality-gate-command-lock.ts` serializes full `quality-gate` subprocess tests without deadlocking the inner `.next` or static-export locks that the gate acquires itself.

## Contract tests

- `tests/unit/quality-gate.test.ts` verifies the make/bun command contract and observes enforced step order from quality-gate subprocess stdout, including search-index contract reuse.
- `tests/unit/quality-gate-validation-failing-path.test.ts` proves localization, content, accessibility, static-export, and search-index regressions fail through the shared validate scripts, confirms `validate:static-export` builds through `make build`, and shows `make quality-gate` fails fast on a broken search-index fixture with distinct search-contract output.
- Real `runValidationScript(...)` failing-path tests in `tests/unit/quality-gate-validation-failing-path.test.ts` need explicit timeouts above Bun's default because they run through the shared repo-command lock and can wait behind other root validation subprocesses under the full suite.
- Failing-path subprocess assertions should read the combined `stdout` plus `stderr` stream when they are proving user-visible failure text; Bun and nested `make` paths can surface the same validation error on either channel depending on the command path and environment.
- `tests/unit/early-gate-automation-parity.test.ts` verifies `make quality-gate` delegates to `bun run quality-gate` and that the quality-gate script emits ordered foundation steps through subprocess output.
- `tests/unit/early-gate-automation-parity.test.ts` verifies `make quality-gate` delegates to `bun run quality-gate` and keeps the ordered contract lightweight by asserting `EARLY_FOUNDATION_GATE_STEPS` directly instead of spawning a second full quality-gate subprocess inside the broader suite.
- `tests/unit/early-gate-contributor-guidance.test.ts` verifies the quality-gate script announces deferred Phase 8 checks and foundation step coverage through subprocess output.
- `src/lib/validation/shell-accessibility.ts` documents `FOCUSED_SHELL_ACCESSIBILITY_COVERAGE` and exports shared aria-label constants consumed by shell components.
- `src/lib/validation/static-export.ts` validates the GitHub Pages-safe Next.js export configuration before the production build step runs.
- `tests/helpers/make.ts` supports dry-run assertions against the root `Makefile` and serializes `make quality-gate` subprocess tests through the dedicated quality-gate command lock.
- `tests/helpers/validation.ts` runs validate scripts and the quality-gate script with optional gate fixtures and step-output helpers under the same quality-gate command lock.
