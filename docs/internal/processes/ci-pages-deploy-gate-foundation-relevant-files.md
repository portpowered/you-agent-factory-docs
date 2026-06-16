# CI Pages deploy gate foundation — relevant files

## Canonical validation path

- Root `Makefile` is the shared entrypoint for local development and CI: `setup`, `check`, `test`, `build`.
- Main-branch automation must call those targets directly instead of inventing deploy-only validation commands.

## GitHub Actions workflow

- `.github/workflows/deploy-pages.yml` is the checked-in main-branch deploy path.
- `validate` runs `make setup`, `make check`, `make test`, and `make build` in sequence.
- After `make build`, `validate` uploads the `out/` static export with `actions/upload-pages-artifact`.
- `deploy` has `needs: validate` and publishes that artifact with `actions/deploy-pages`; a failed validation run never starts deploy for that main update.
- Workflow triggers on `push` to `main` (including merges).

## Static export assumptions

- Next.js static export settings live in `next.config.ts` and import `SITE_BASE_PATH` from `src/lib/site.ts`.
- Production build output is written to `out/` and is the GitHub Pages artifact handed from validation to deployment.
- `actions/configure-pages` runs in `validate` before artifact upload so the Pages publish path matches repository settings.
