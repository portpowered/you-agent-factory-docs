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
- `scripts/enforce-component-coverage.ts` runs `bun test --coverage` with text and lcov reporters, then parses `coverage/lcov.info` and enforces the 90% aggregate line-coverage threshold from `src/lib/component-coverage/enforce.ts` using summed LF/LH totals rather than averaging per-file percentages.
- `COMPONENT_COVERAGE_ENFORCEMENT_TEST_IGNORE_PATTERNS` must exclude subprocess-heavy contract tests that re-enter root `make` or validation commands under the repo command lock. Keep `tests/unit/search-index-command-surface.test.ts`, `tests/unit/public-content-validation.test.ts`, `tests/unit/search-index-validation-failing-path.test.ts`, `tests/unit/static-export.test.ts`, and similar root-command tests out of the nested coverage run so `make test` and `make component-coverage` do not deadlock each other.
- Failure output uses the `Component coverage enforcement failed` prefix so threshold breaches are distinguishable from unrelated test, lint, or typecheck failures.
- `make component-coverage-boundary` remains the reviewer-visible boundary report; it does not run threshold enforcement.

## CI automation parity

- `.github/workflows/ci.yml` runs `make component-coverage` on push and pull request through the same root Makefile contract contributors use locally.
- `tests/unit/component-coverage-ci-automation-parity.test.ts` verifies the workflow invokes `make component-coverage` rather than a CI-only script path.
- `tests/unit/component-coverage-enforcement-failing-path.test.ts` proves coverage enforcement blocks regressions with explicit `Component coverage enforcement failed` output via the `below-threshold` fixture in `src/lib/component-coverage/fixtures.ts`.
- Set `COMPONENT_COVERAGE_ENFORCEMENT_FIXTURE=below-threshold` only for reviewer-verifiable failing-path proofs; normal local and CI runs omit it.

## Enforcement contract limitations and extension path

- `formatComponentCoverageContractLimitations()` in `src/lib/component-coverage/boundary.ts` is the shared source of truth for what the gate enforces now, which component-adjacent surfaces remain out of scope, and how later lanes extend coverage without replacing the command contract.
- `make component-coverage` prints the contract limitations at the start of every enforcement run so reviewers see the practical boundary on the same path used for threshold blocking.
- `make component-coverage-boundary` includes the same limitations block after the discovered file list and ignore patterns.
- The limitations text keeps the enforced threshold at 90% for `src/components`; out-of-scope surfaces are excluded from measurement rather than held to a lower bar.
- Extension guidance lives in `COMPONENT_COVERAGE_EXTENSION_PATH_STEPS`; widen scope by updating the boundary constants and keeping `bunfig.toml` ignore patterns aligned.
