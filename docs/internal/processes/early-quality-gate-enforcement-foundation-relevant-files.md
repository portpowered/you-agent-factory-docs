# Early quality-gate enforcement foundation — relevant files

## Authoritative gate path

- `make quality-gate` and `bun run quality-gate` are the single early enforcement entrypoints for contributors and future automation.
- `scripts/quality-gate.ts` orchestrates the enforced sequence and fails fast on the first failing step.
- `src/lib/quality-gate/deferred-phase8.ts` lists checks intentionally deferred to later Phase 8 work.

## Enforced foundation checks

The early gate currently runs, in order:

1. `bun run typecheck`
2. `bun run lint`
3. `bun run validate:localization` → `scripts/validate-localization.ts` → `src/lib/validation/shell-localization.ts`
4. `bun run validate:content` → `scripts/validate-content.ts` → `src/lib/validation/foundation-content.ts`
5. `bun run validate:accessibility` → `scripts/validate-accessibility.ts` → bounded expectations in `src/lib/validation/shell-accessibility.ts` plus focused shell tests in `tests/unit/homepage-shell.test.tsx`, `tests/unit/docs-shell.test.tsx`, and `tests/unit/shell-accessibility-validation.test.tsx`
6. `bun run validate:static-export` → `scripts/validate-static-export.ts` → `src/lib/validation/static-export.ts`, production build, `out/` presence, and `tests/unit/static-export.test.ts`
7. Remaining foundation unit tests (`tests/unit/project.test.ts`, `tests/unit/site.test.ts`)

`make check`, `make test`, and `make build` remain narrower helper targets. They are not substitutes for `make quality-gate`.

Contract tests in `tests/unit/quality-gate.test.ts` are run via `bun test` and are intentionally excluded from the gate orchestrator to avoid recursive self-invocation.

## Phase 8 boundary

Deferred from this early lane (see `DEFERRED_PHASE_8_QUALITY_CHECKS`):

- deploy-on-main automation
- Lighthouse performance and accessibility budgets
- broad package coverage policy enforcement
- full search-index validation
- launch-content completeness enforcement

Later localization message catalogs and canonical content-model validators should plug into the same `validate:localization` and `validate:content` scripts instead of introducing a parallel gate surface.

Pure validators accept injectable copy/metadata records (`getShellLocalizationCopy`, `getFoundationContentMetadata`) so unit tests can prove rejection without mutating production modules.

`src/lib/validation/gate-fixtures.ts` exposes `EARLY_GATE_VALIDATION_FIXTURE` values for subprocess failing-path proof in `tests/unit/quality-gate-validation-failing-path.test.ts`. Use this only in tests; production runs omit the env var.

## Contract tests

- `tests/unit/quality-gate.test.ts` verifies the make/bun command contract and runs the full gate on the current baseline.
- `tests/unit/quality-gate-validation-failing-path.test.ts` proves localization, content, accessibility, and static-export regressions fail through the shared validate scripts and that `make quality-gate` fails fast on a broken localization fixture.
- `src/lib/validation/shell-accessibility.ts` documents `FOCUSED_SHELL_ACCESSIBILITY_COVERAGE` and exports shared aria-label constants consumed by shell components.
- `src/lib/validation/static-export.ts` validates the GitHub Pages-safe Next.js export configuration before the production build step runs.
- `tests/helpers/make.ts` supports dry-run assertions against the root `Makefile`.
- `tests/helpers/validation.ts` runs `validate:localization` and `validate:content` with optional gate fixtures.
