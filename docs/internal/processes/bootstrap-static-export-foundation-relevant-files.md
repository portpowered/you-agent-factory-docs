# Bootstrap static export foundation — relevant files

## Contributor command path

- Root `Makefile` is the shared entrypoint for local development and future CI: `setup`, `check`, `test`, `build`.
- `make setup` runs `bun install`.
- `make check` runs `bun run typecheck` then `bun run lint` (Biome).
- `make test` runs `bun test` directly (not a separate test runner).
- `make build` runs `bun run build` (Next.js production build).

## Application scaffold

- Next.js App Router lives under `src/app/`.
- Shared non-UI constants start in `src/lib/` (for example `src/lib/project.ts`).
- Shared homepage and docs-shell copy, CTA labels, and external links live in `src/lib/shared-shell-config.ts` via `sharedShellConfig`; later localization and docs navigation lanes extend that canonical config (see `src/lib/shared-shell-extension-points.ts`) instead of route-local shell wiring. `src/lib/shell.ts` remains a deprecated re-export for legacy imports. The GitHub CTA points at the public `you-agent-factory` repository while the docs repo may remain private during bootstrap.
- The homepage landing shell lives in `src/components/landing/landing-shell.tsx` and is rendered from `src/app/page.tsx`.
- The docs shell lives in `src/components/docs/docs-shell.tsx` and is rendered from `src/app/docs/page.tsx`.
- GitHub Pages base-path and route constants live in `src/lib/site.ts`; `next.config.ts` imports `SITE_BASE_PATH` from there so export settings stay aligned with link helpers.
- Static export uses `output: "export"` with `trailingSlash: true` and `images.unoptimized: true` for GitHub Pages compatibility.
- Unit tests live under `tests/unit/` and import source modules with relative paths.
- Component behavior tests use `@testing-library/react` with `@happy-dom/global-registrator` preloaded from `bunfig.toml` (`tests/setup/happydom.ts`, `tests/setup/testing-library.ts`).
- Served static-export navigation tests build once, mount `out/` under the base path, and use Bun's native `fetch` via `tests/helpers/http.ts` (happy-dom's fetch blocks cross-origin local requests).
- Manual browser verification for website changes follows `docs/internal/processes/manual-qa.md`; serve the export via a parent directory symlink (`you-agent-factory-docs -> out`) so `/you-agent-factory-docs/...` URLs resolve locally.

## Package scripts

`package.json` scripts mirror the Makefile targets for direct Bun invocation:

- `bun run dev` — local dev server
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` — `biome check .`
- `bun run test` — `bun test`
- `bun run build` — `next build`
