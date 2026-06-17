# Bootstrap static export foundation — relevant files

## Contributor command path

- Root `Makefile` is the shared entrypoint for local development and CI: `setup`, `check`, `test`, `build`, and `quality-gate`.
- `make quality-gate` is the authoritative early enforcement path; see `docs/internal/processes/early-quality-gate-enforcement-foundation-relevant-files.md`.
- `make setup` runs `bun install`.
- `make check` runs `bun run typecheck` followed by `bun run lint` (Biome); content validation is enforced through `make quality-gate`.
- `make test` runs `bun test` directly (not a separate test runner).
- `make build` runs `bun run build` (Next.js production build) and fails when the static export directory `out/` is missing after the build.

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
- `validate:static-export` cleans `.next`, runs one production build under `withStaticExportBuildLock()`, then invokes `tests/unit/static-export.test.ts` with `STATIC_EXPORT_SKIP_BUILD=1` and `STATIC_EXPORT_BUILD_LOCK_HELD=1` so the served-export tests reuse that export without deadlocking on the parent-held lock.
- `src/lib/validation/static-export-build-lock.ts` serializes `.next`/`out/` production builds across concurrent test files and subprocessed quality-gate runs.
- `src/lib/validation/static-export-build-lock.ts` supports same-process nested acquisition; keep cross-process locking in one place rather than layering ad hoc file cleanup around callers.
- `buildStaticExport()` in `tests/helpers/static-export-server.ts` also cleans `.next` before building when a fresh export is required.
- `startStaticExportServer()` copies `out/` into a temp snapshot before serving it so export-backed suites do not observe a live shared `out/` while another test rebuilds the site.
- `tests/helpers/make-target.ts` wraps `make check` and `make build` in the same static-export build lock because those command-path tests shell out during `bun test` and otherwise race on `.next`.
- Browser verification for the reconciled baseline uses `@playwright/test` Chromium against the same `tests/helpers/static-export-server.ts` mount pattern; see `tests/unit/reconciled-export-browser.test.ts`.
- Manual browser verification for website changes follows `docs/internal/processes/manual-qa.md`; serve the export via a parent directory symlink (`you-agent-factory-docs -> out`) so `/you-agent-factory-docs/...` URLs resolve locally.

## Package scripts

`package.json` scripts mirror the Makefile targets for direct Bun invocation:

- `bun run dev` — local dev server
- `bun run typecheck` — `tsc --noEmit` on the bootstrap branch; the reconciled default baseline prefixes `next typegen` (see `reconcile-bootstrap-foundation-baseline-divergence.md`).
- `bun run lint` — `biome check .`
- `bun run test` — `bun test`
- `bun run build` — `next build`
