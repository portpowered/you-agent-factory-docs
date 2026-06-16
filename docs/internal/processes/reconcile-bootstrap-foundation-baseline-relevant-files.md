# Reconcile bootstrap foundation baseline — relevant files

## Reconciliation source and proof

- `bootstrap-static-export-foundation` is the source of truth for the delivered website foundation.
- The scaffold landed on the default baseline through merge commit `4ee2134` (PR #1). The reconciled tree matches the bootstrap branch tip with no additional scaffold edits.
- Reviewer-facing divergence record: `docs/internal/processes/reconcile-bootstrap-foundation-baseline-divergence.md` explicitly records that there is **no meaningful divergence** between bootstrap and the reconciled default baseline, lists reconciliation-only verification additions, and documents how preserved bootstrap behavior was re-verified.
- Reviewer proof that the default baseline inherits the foundation rather than planning-only artifacts:
  - `tests/unit/baseline-foundation.test.tsx` proves the homepage and `/docs` App Router entries render the delivered shells.
  - `tests/unit/root-command-path.test.ts` runs the documented `Makefile` targets (`setup`, `check`, `test`, `build`) from the repository root and asserts observable success outcomes instead of branch or file inventories.
  - Existing bootstrap tests under `tests/unit/` continue to cover static export, homepage shell, docs shell, project metadata, and site configuration.
  - `tests/unit/reconciled-export-browser.test.ts` serves the built static export under the GitHub Pages base path and uses Playwright Chromium to prove the homepage and `/docs` shell render and remain navigable from the reconciled default baseline.

## Root command path verification

- Documented contributor entrypoints live in the root `Makefile` and mirror `package.json` scripts (`setup`, `check`, `test`, `build`).
- `tests/helpers/make-target.ts` wraps `make <target>` via `spawnSync` so command-path proof stays at the process-outcome layer. Assert on combined `stdout` and `stderr` because `bun test` reports results on stderr.
- `tests/unit/root-command-path.test.ts` sets `VERIFYING_MAKE_TEST=1` when invoking `make test` so the nested run skips the recursive `make test` assertion while still executing the rest of the suite.
- No reconciliation-specific command-path divergence was required; the inherited bootstrap `Makefile` and scripts pass unchanged on the default baseline.

## Inherited foundation surfaces

- Root contributor command path: `Makefile` (`setup`, `check`, `test`, `build`) and matching `package.json` scripts.
- Next.js static-export scaffold: `next.config.ts`, `src/app/`, `src/components/`, `src/lib/`.
- Homepage shell: `src/components/landing/landing-shell.tsx` via `src/app/page.tsx`.
- Docs shell entry route: `src/components/docs/docs-shell.tsx` via `src/app/docs/page.tsx`.
- GitHub Pages base-path helpers: `src/lib/site.ts`.
- Shared shell copy and CTA constants: `src/lib/shell.ts`, `src/lib/project.ts`.
- Automated verification: `tests/unit/` plus `docs/internal/processes/bootstrap-static-export-foundation-relevant-files.md` for bootstrap-specific patterns.

## Reconciliation divergence

- `docs/internal/processes/reconcile-bootstrap-foundation-baseline-divergence.md` is the durable reviewer-facing record for reconciliation-specific differences.
- Current outcome: no meaningful behavior or command-path divergence beyond landing the scaffold on the default baseline.
- Reconciliation lane additions (tests, helpers, lane docs) are verification artifacts, not corrective scaffold edits.

## Scope guardrails

- Reconciliation carries forward the completed bootstrap scaffold only. It does not add localization, search, content modeling, shared-shell expansion, or CI changes beyond what bootstrap already delivered.
