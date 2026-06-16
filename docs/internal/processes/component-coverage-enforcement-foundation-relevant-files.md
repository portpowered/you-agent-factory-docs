# Component coverage enforcement foundation — relevant files

## Coverage boundary contract

- `src/lib/component-coverage/boundary.ts` is the source of truth for the practical component-package enforcement surface, the 90% threshold constant, explicit out-of-scope surfaces, and Bun coverage ignore patterns.
- `bunfig.toml` encodes `coveragePathIgnorePatterns` and `coverageSkipTestFiles` so coverage measurement stays scoped to `src/components/**` rather than unrelated app, lib, test, or factory surfaces.
- `make component-coverage-boundary` and `bun run component-coverage:boundary` print the reviewer-visible boundary report via `scripts/show-component-coverage-boundary.ts`.
- `tests/unit/component-coverage-boundary.test.ts` verifies discovered component files, path classification, report content, and bunfig pattern parity.

## Enforced surface (current repo)

- Root: `src/components`
- File glob: `src/components/**/*.{ts,tsx}`
- Current files: `src/components/landing/landing-shell.tsx`, `src/components/docs/docs-shell.tsx`

## Explicitly out of scope

Documented in `COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES`:

- `src/app/**` route entrypoints
- `src/lib/**` non-UI utilities and constants
- search generation and content loading pipelines
- localization catalogs and formatting hooks
- deployment, CI automation, and factory tooling

## Component coverage enforcement command

- `make component-coverage` and `bun run component-coverage` are the authoritative root entrypoints for threshold enforcement on the practical component-package surface.
- `scripts/enforce-component-coverage.ts` runs `bun test --coverage` (ignoring `tests/unit/component-coverage-enforcement.test.ts` to avoid recursive subprocess invocation), parses the scoped coverage table, and enforces the 90% aggregate line-coverage threshold from `src/lib/component-coverage/enforce.ts`.
- Failure output uses the `Component coverage enforcement failed` prefix so threshold breaches are distinguishable from unrelated test, lint, or typecheck failures.
- `make component-coverage-boundary` remains the reviewer-visible boundary report; it does not run threshold enforcement.

Later stories wire CI through the same `make component-coverage` command without replacing this enforcement module.
