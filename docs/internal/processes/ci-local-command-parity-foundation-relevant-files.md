# CI-local command parity foundation — relevant files

## Contributor command path

- Root `Makefile` is the authoritative entrypoint for setup, verification, tests, and static build output.
- `make setup` runs `bun install` from the repository root.
- `make check` runs `bun run typecheck` then `bun run lint` and fails on the first verification error.
- `make test` runs `bun test` directly (not a separate test runner).
- `make build` runs `bun run build` and fails when the static export directory `out/` is missing after the build.
- In detached worktrees, `next build` can still infer the parent repository as the workspace root because of the outer `bun.lock`; keep worktree CSS/PostCSS build dependencies aligned with the root-level config that build will resolve.

## Automation parity

- `.github/workflows/ci.yml` is the minimal verification workflow for this lane. It runs `make setup`, `make check`, `make test`, and `make build` in order without bypassing the root `Makefile`.
- CI installs Playwright Chromium after `make setup` so reconciled baseline browser tests in `make test` can launch a browser on Linux runners.
- Failures in typecheck, lint, tests, or static build surface through the same `make` targets contributors use locally.

## Contributor guidance

- `README.md` identifies `make setup`, `make check`, `make test`, and `make build` as the authoritative root workflow and explains when to use each command in terms of observable outcomes (dependency install, verification failures, automated tests, static export output).
- The documented command path matches `.github/workflows/ci.yml` so contributors do not need alternate `bun` verification commands to match automation.

## Proof tests

- `tests/unit/root-workflow.test.ts` uses `make -n` to prove each target delegates through the Bun-first command path and runs `make check` as a smoke test.
- `tests/unit/root-command-path.test.ts` runs `make setup`, `make check`, `make test`, and `make build` from the repository root and asserts observable CLI success outcomes.
- `tests/unit/automation-parity.test.ts` behaviorally proves automation parity by executing the same ordered root `make` targets CI uses (`setup`, `check`, `build`), asserting `make test` delegates to `bun test` via `make -n`, and verifying failures surface through the root command path.
- `tests/unit/contributor-guidance.test.ts` behaviorally proves contributor-facing observable outcomes for each root command (dependency install, verification output, `bun test` delegation, static export output) without reading `README.md` or workflow YAML; `make build` assertions should run under the shared static-export build lock because other suites also mutate `.next/` and `out/`.
- `tests/helpers/make.ts`, `tests/helpers/make-target.ts`, and `tests/helpers/validation.ts` centralize repo-root verification subprocesses for contributor, automation, and quality-gate parity tests.
- `tests/helpers/repo-root-command-lock.ts` serializes repo-root `make check`, `make build`, `make quality-gate`, and validation subprocesses across the suite so tests that shell out from parallel Bun workers do not race on `.next/` and `tsconfig.tsbuildinfo`.
- Served static-export tests build through `make build` via `tests/helpers/static-export-server.ts`.
- `src/lib/validation/static-export-build-lock.ts` is the shared lock surface for any test or helper that runs `make build` against the repo root; use it to serialize access to `.next/` and `out/` across concurrent suites.
- `ensureStaticExportBuilt()` serializes export builds with an in-process promise on top of `withStaticExportBuildLock(...)` so export/browser suites reuse one repo-root static build instead of racing on shared output; when it resets build artifacts it must clear both `.next/` and `tsconfig.tsbuildinfo` to avoid stale route-type references on the next `next build`.
- When a test shells out to repo-root verification commands from inside `bun test`, serialize those subprocesses with the repo-root command lock in addition to any build-specific lock; the Bun suite can schedule multiple worker subprocesses that would otherwise mutate the same Next.js artifacts concurrently.
- Local verification should not run `make check` in parallel with `bun test` against the same worktree: type generation, `.next/`, and `tsconfig.tsbuildinfo` are shared mutable artifacts, so concurrent runs can create false failing-path results that do not reproduce in isolated CI-style execution.
