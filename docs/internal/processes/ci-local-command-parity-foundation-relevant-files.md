# CI-local command parity foundation — relevant files

## Contributor command path

- Root `Makefile` is the authoritative entrypoint for setup, verification, tests, and static build output.
- `make setup` runs `bun install` from the repository root.
- `make check` runs `bun run typecheck` then `bun run lint` and fails on the first verification error.
- `make test` runs `bun test` directly (not a separate test runner).
- `make build` runs `bun run build` and fails when the static export directory `out/` is missing after the build.

## Automation parity

- `.github/workflows/ci.yml` is the minimal verification workflow for this lane. It runs `make setup`, `make check`, `make test`, and `make build` in order without bypassing the root `Makefile`.
- Failures in typecheck, lint, tests, or static build surface through the same `make` targets contributors use locally.

## Proof tests

- `tests/unit/root-workflow.test.ts` uses `make -n` to prove each target delegates through the Bun-first command path and runs `make check` as a smoke test.
- `tests/unit/automation-parity.test.ts` reads `.github/workflows/ci.yml` to prove automation invokes the same `make` targets in order, does not call divergent `bun` verification commands directly, and inherits `bun test` through `make test`.
- `tests/helpers/make.ts` centralizes Makefile invocations for contributor and automation parity tests.
- Served static-export tests build through `make build` via `tests/helpers/static-export-server.ts`.
