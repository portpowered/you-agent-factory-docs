# Reconcile bootstrap foundation baseline — relevant files

## Reconciliation source and proof

- `bootstrap-static-export-foundation` is the source of truth for the delivered website foundation.
- The scaffold landed on the default baseline through merge commit `4ee2134` (PR #1). The reconciled tree matches the bootstrap branch tip with no additional scaffold edits.
- Reviewer proof that the default baseline inherits the foundation rather than planning-only artifacts:
  - `make setup`, `make check`, `make test`, and `make build` succeed from the repository root.
  - `tests/unit/baseline-foundation.test.tsx` proves the homepage and `/docs` App Router entries render the delivered shells.
  - Existing bootstrap tests under `tests/unit/` continue to cover static export, homepage shell, docs shell, project metadata, and site configuration.

## Inherited foundation surfaces

- Root contributor command path: `Makefile` (`setup`, `check`, `test`, `build`) and matching `package.json` scripts.
- Next.js static-export scaffold: `next.config.ts`, `src/app/`, `src/components/`, `src/lib/`.
- Homepage shell: `src/components/landing/landing-shell.tsx` via `src/app/page.tsx`.
- Docs shell entry route: `src/components/docs/docs-shell.tsx` via `src/app/docs/page.tsx`.
- GitHub Pages base-path helpers: `src/lib/site.ts`.
- Shared shell copy and CTA constants: `src/lib/shell.ts`, `src/lib/project.ts`.
- Automated verification: `tests/unit/` plus `docs/internal/processes/bootstrap-static-export-foundation-relevant-files.md` for bootstrap-specific patterns.

## Scope guardrails

- Reconciliation carries forward the completed bootstrap scaffold only. It does not add localization, search, content modeling, shared-shell expansion, or CI changes beyond what bootstrap already delivered.
