# CI-local command parity foundation — relevant files

## Contributor command path

- Root `Makefile` is the authoritative entrypoint for setup, verification, tests, and static build output.
- `make setup` runs `bun install` from the repository root.
- `make check` runs `bun run typecheck` then `bun run lint` and fails on the first verification error.
- `make test` runs `bun test` directly (not a separate test runner).
- `make build` runs `bun run build` and fails when the static export directory `out/` is missing after the build.

## Automation parity

- `.github/workflows/ci.yml` is the minimal verification workflow for this lane. It runs `make setup`, `make check`, `make test`, and `make build` in order without bypassing the root `Makefile`.
- CI installs Playwright Chromium after `make setup` so reconciled baseline browser tests in `make test` can launch a browser on Linux runners.
- Failures in typecheck, lint, tests, or static build surface through the same `make` targets contributors use locally.

## Contributor guidance

- `README.md` identifies `make setup`, `make check`, `make test`, and `make build` as the authoritative root workflow and explains when to use each command in terms of observable outcomes (dependency install, verification failures, automated tests, static export output).
- The documented command path matches `.github/workflows/ci.yml` so contributors do not need alternate `bun` verification commands to match automation.

## Proof tests

- `tests/unit/root-workflow.test.ts` uses `make -n` to prove each target delegates through the Bun-first command path and runs `make check` as a smoke test.
- `tests/unit/root-command-path.test.ts` runs `make setup`, `make check`, and `make build` from the repository root, and proves `make test` through `make -n` output so the command-path suite does not recursively spawn the full test suite from inside itself.
- Long-running root command-path checks need explicit timeout budgets that match real command latency on a clean workspace: use at least 120 seconds for `make check` assertions that trigger serialized `next typegen`, and at least 480 seconds for nested `make test` assertions that rerun the full suite through the root workflow.
- `tests/unit/automation-parity.test.ts` behaviorally proves automation parity by executing the same ordered root `make` targets CI uses (`setup`, `check`, `build`), asserting `make test` delegates to `bun test` via `make -n`, and verifying failures surface through the root command path.
- `tests/unit/contributor-guidance.test.ts` behaviorally proves contributor-facing observable outcomes for each root command (dependency install, verification output, `bun test` delegation, static export output) without reading `README.md` or workflow YAML. Keep expensive root-command smoke tests singular: once `tests/unit/root-workflow.test.ts` already proves the real `make check` subprocess succeeds, companion suites should prove the same command wiring with `make -n` output instead of duplicating another full subprocess run under the suite-wide artifact lock.
- Any test that deletes `.next` or `tsconfig.tsbuildinfo` before invoking `make check` should do that cleanup inside `withNextTypeArtifactLock(...)` so concurrent suites do not race on generated type artifacts.
- `tests/helpers/make.ts` and `tests/helpers/make-target.ts` centralize Makefile invocations for contributor and automation parity tests.
- Served static-export tests build through `make build` via `tests/helpers/static-export-server.ts`.
- `src/lib/validation/static-export-build-lock.ts` is the shared lock surface for any test or helper that runs `make build` against the repo root; use it to serialize access to `.next/` and `out/` across concurrent suites.
- `src/lib/validation/next-type-artifact-lock.ts` guards direct `make check` subprocesses that regenerate `.next` type artifacts during tests.
- `scripts/typecheck.ts` and `src/lib/validation/typecheck-lock.ts` serialize `next typegen` and `tsc --noEmit` behind `.typecheck.lock` so nested `make check` and `make quality-gate` subprocesses do not race on `.next` type artifacts during the full suite.
- `ensureStaticExportBuilt()` serializes export builds with an in-process promise on top of `withStaticExportBuildLock(...)` so export/browser suites reuse one repo-root static build instead of racing on shared output; when it resets build artifacts it must clear both `.next/` and `tsconfig.tsbuildinfo` to avoid stale route-type references on the next `next build`.
