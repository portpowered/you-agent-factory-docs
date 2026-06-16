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
5. `bun run validate:accessibility` → focused shell accessibility tests in `tests/unit/homepage-shell.test.tsx` and `tests/unit/docs-shell.test.tsx`
6. `bun run validate:static-export` → `scripts/validate-static-export.ts` (production build, `out/` presence, static export tests)
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

## Contract tests

- `tests/unit/quality-gate.test.ts` verifies the make/bun command contract and runs the full gate on the current baseline.
- `tests/helpers/make.ts` supports dry-run assertions against the root `Makefile`.
