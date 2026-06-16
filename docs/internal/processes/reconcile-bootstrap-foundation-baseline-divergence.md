# Reconcile bootstrap foundation baseline — divergence record

## Scope

This record documents reconciliation-specific differences between `bootstrap-static-export-foundation` and the reconciled default baseline. It is intentionally narrow: it does not audit full branch history or unrelated factory wiring.

## Source of truth

| Item | Value |
| --- | --- |
| Source branch | `bootstrap-static-export-foundation` |
| Reconciled onto | Default baseline via merge commit `4ee2134` (PR #1) |
| Bootstrap tip at reconciliation | `c6094b7` |

## Meaningful divergence

**No meaningful divergence.**

The reconciled default baseline preserves the delivered bootstrap scaffold without behavioral or command-path changes:

| Surface | Divergence |
| --- | --- |
| Static-export scaffold (`next.config.ts`, `src/app/`, `src/components/`, `src/lib/`) | None — carried forward unchanged via PR #1 merge |
| Root command path (`Makefile`, `package.json` scripts) | None |
| Homepage shell behavior | None |
| `/docs` shell entry route behavior | None |
| Static export and GitHub Pages route/asset handling | None |

## Reconciliation lane additions (not behavioral divergence)

The reconciliation lane added reviewer proof on top of the unchanged scaffold. These files verify and document the inherited foundation; they do not change runtime behavior, export output, or contributor commands relative to bootstrap:

- `tests/unit/baseline-foundation.test.tsx` — route-to-shell rendering proof
- `tests/unit/root-command-path.test.ts` — `make setup`, `make check`, `make test`, and `make build` command-path proof
- `tests/unit/reconciled-export-browser.test.ts` — Playwright browser verification of the static export
- `tests/helpers/make-target.ts` — helper for command-path tests
- `docs/internal/processes/reconcile-bootstrap-foundation-baseline-relevant-files.md` — lane documentation

## Re-verification of preserved bootstrap behavior

Bootstrap-preserved behavior was re-verified on the reconciled baseline through:

- `make check`, `make test`, and `make build` from the repository root
- `tests/unit/baseline-foundation.test.tsx` and existing bootstrap unit tests
- `tests/unit/reconciled-export-browser.test.ts` for homepage and `/docs` navigability in the built export

## Default baseline as new source of truth

Later website lanes should branch from the default baseline and treat it as the foundation source of truth. Use this record when checking whether reconciliation introduced a justified corrective adjustment; do not re-compare branches unless a new reconciliation is required.
