# CI Pages deploy gate foundation — relevant files

## Canonical validation path

- Root `Makefile` is the shared entrypoint for local development and CI: `setup`, `check`, `test`, `build`.
- Main-branch automation must call those targets directly instead of inventing deploy-only validation commands.

## GitHub Actions workflow

- `.github/workflows/deploy-pages.yml` is the checked-in main-branch deploy path.
- `validate` runs `make setup`, `make check`, `make test`, and `make build` in sequence.
- `deploy` has `needs: validate`, so a failed validation run never starts the deploy job for that main update.
- Workflow triggers on `push` to `main` (including merges).

## Static export assumptions

- Next.js static export settings live in `next.config.ts` and import `SITE_BASE_PATH` from `src/lib/site.ts`.
- Production build output is written to `out/` and is the intended GitHub Pages artifact for later publish steps.
