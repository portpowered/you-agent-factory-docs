# CI-local command parity foundation — relevant files

## Contributor command path

- Root `Makefile` is the authoritative entrypoint for setup, verification, tests, and static build output.
- `make setup` runs `bun install` from the repository root.
- `make check` runs `bun run typecheck` then `bun run lint` and fails on the first verification error.
- `make test` runs `bun test` directly (not a separate test runner).
- `make build` runs `bun run build` and fails when the static export directory `out/` is missing after the build.

## Automation parity

- `.github/workflows/ci.yml` is the minimal verification workflow for this lane. It runs `make setup`, `make check`, `make test`, and `make build` in order without bypassing the root `Makefile`.
- PR CI installs Playwright Chromium after `make setup` and before `make test` so the root test path can launch the browser-backed export suite on Linux runners.
- The same workflow keeps `make quality-gate`, `make budget`, and `make component-coverage` as supplemental reviewer-visible gates after the required top-level path rather than replacing that path with narrower or indirect checks.
- Failures in typecheck, lint, tests, or static build surface through the same `make` targets contributors use locally.

## Contributor guidance

- `README.md` identifies `make setup`, `make check`, `make test`, and `make build` as the authoritative root workflow and explains when to use each command in terms of observable outcomes (dependency install, verification failures, automated tests, static export output).
- Contributor-facing guidance may still document `make quality-gate`, but only as a broader local-only sweep that intentionally goes beyond the pull request merge gate. Do not present it as the PR parity contract once `.github/workflows/ci.yml` is anchored on `make check`, `make test`, and `make build`.
- The documented command path matches `.github/workflows/ci.yml` so contributors do not need alternate `bun` verification commands to match automation.

## Proof tests

- `tests/unit/root-workflow.test.ts` uses `make -n` to prove each target delegates through the Bun-first command path and runs `make check` as a smoke test.
- `tests/unit/pr-ci-command-parity.test.ts` reads `.github/workflows/ci.yml` only to discover the `verify` job's root `run` commands, then proves the checked-in PR contract behaviorally by executing the required `make setup` / `make check` / `make test` / `make build` path through those same root targets and asserting the retained supplemental gates stay later in the workflow command sequence.
- Keep this suite focused on executable command-surface proof. It may use the workflow file as the reviewer-visible source of which commands PR automation claims to run, but it should not regress into exact README phrasing checks or step-name inventory assertions that only prove checked-in text.
- `tests/unit/root-command-path.test.ts` runs `make setup`, `make check`, and `make build` from the repository root, and proves `make test` through `make -n` output so the command-path suite does not recursively spawn the full test suite from inside itself.
- `tests/unit/automation-parity.test.ts` behaviorally proves automation parity by executing the same ordered root `make` targets CI uses (`setup`, `check`, `build`), asserting `make test` delegates to `bun test` via `make -n`, and verifying failures surface through the root command path.
- `tests/unit/contributor-guidance.test.ts` behaviorally proves contributor-facing observable outcomes for each root command (dependency install, verification output, `bun test` delegation, static export output) without reading `README.md` or workflow YAML. Keep expensive root-command smoke tests singular: once `tests/unit/root-workflow.test.ts` already proves the real `make check` subprocess succeeds, companion suites should prove the same command wiring with `make -n` output instead of duplicating another full subprocess run under the suite-wide artifact lock.
- Any test that deletes `.next` or `tsconfig.tsbuildinfo` before invoking `make check` or `make build` should do that cleanup inside the shared static-export build lock because other suites mutate the same generated artifacts.
- `tests/helpers/make.ts` and `tests/helpers/make-target.ts` centralize Makefile invocations for contributor and automation parity tests. Only real `make quality-gate`, `make check`, and `make build` subprocesses should acquire the shared command/build locks; dry-run parity proofs must stay lock-free so `make -n` assertions do not time out behind unrelated long-running validation.
- `tests/helpers/repo-command-lock.ts` serializes command-heavy repo-root subprocesses across concurrent Bun test workers. Use it for helpers that invoke real `make`, validation, or quality-gate commands so one suite does not invalidate another suite's shared `.next`, `out/`, or root-command expectations mid-run. Leave `make -n` dry runs and `make setup` outside that lock unless they start mutating shared build artifacts.
- Dry-run command-surface helpers must also skip narrower long-lived locks reserved for real subprocess work, such as the quality-gate lock in `tests/helpers/make.ts`; otherwise `make -n quality-gate` can block behind a real quality-gate subprocess and time out despite not mutating repo state.
- Served static-export tests build through `make build` via `tests/helpers/static-export-server.ts`.
- `src/lib/validation/static-export-build-lock.ts` is the shared lock surface for any test or helper that runs `make check` or `make build` against the repo root; use it to serialize access to `.next/`, `tsconfig.tsbuildinfo`, and `out/` across concurrent suites. Treat the lock as non-reentrant: cleanup or subprocess setup that must share the critical section belongs inside the helper that acquires the lock, not in a separate outer wrapper.
- `ensureStaticExportBuilt()` serializes export builds with an in-process promise on top of `withStaticExportBuildLock(...)` so export/browser suites reuse one repo-root static build instead of racing on shared output; when it resets build artifacts it must clear both `.next/` and `tsconfig.tsbuildinfo` to avoid stale route-type references on the next `next build`.
- Suites that call `ensureStaticExportBuilt()` or real repo-root `make check` under the full Bun suite may need explicit test or hook budgets above the default timeout because they can spend meaningful time waiting on the shared repo-root build lock even when the underlying command is healthy.
