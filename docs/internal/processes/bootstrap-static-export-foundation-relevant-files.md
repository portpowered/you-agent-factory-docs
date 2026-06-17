# Bootstrap static export foundation — relevant files

## Contributor command path

- Root `Makefile` is the shared entrypoint for local development and CI: `setup`, `check`, `test`, `build`, `budget`, and `quality-gate`.
- `make quality-gate` is the authoritative early enforcement path; see `docs/internal/processes/early-quality-gate-enforcement-foundation-relevant-files.md`.
- `make budget` is the checked-in exported-site budget path for this lane and is invoked directly from CI and deploy workflows.
- `make setup` runs `bun install`.
- `make check` runs `bun run typecheck` followed by `bun run lint` (Biome); content validation is enforced through `make quality-gate`.
- `make test` runs `bun test` directly (not a separate test runner).
- `make build` runs `bun run build` (Next.js production build) and fails when the static export directory `out/` is missing after the build.
- `make budget` runs `bun run budget`, which builds the static export, serves a snapshot of `out/` under the GitHub Pages base path on an available localhost port, audits the homepage plus docs entry route from that exported surface, enforces the checked-in `_next/static` JavaScript payload budget, and prints the current protected scope plus explicit limitations before the measured results.

## Application scaffold

- Next.js App Router lives under `src/app/`.
- Shared non-UI constants start in `src/lib/` (for example `src/lib/project.ts`).
- Shared homepage and docs-shell copy, CTA labels, and external links live in `src/lib/shared-shell-config.ts` via `sharedShellConfig`; later localization and docs navigation lanes extend that canonical config (see `src/lib/shared-shell-extension-points.ts`) instead of route-local shell wiring. `src/lib/shell.ts` remains a deprecated re-export for legacy imports. The GitHub CTA points at the public `you-agent-factory` repository while the docs repo may remain private during bootstrap.
- The homepage landing shell lives in `src/components/landing/landing-shell.tsx` and is rendered from `src/app/page.tsx`.
- The docs shell lives in `src/components/docs/docs-shell.tsx` and is rendered from `src/app/docs/page.tsx`.
- Docs-owned diagram fixtures live in `src/content/`; wrappers own projection concerns while checked-in Mermaid or graph definitions remain reviewer-visible source of truth.
- Mermaid rendering is isolated behind `src/lib/mermaid-loader.ts` and the client wrapper `src/components/docs/mermaid-diagram.tsx` so docs pages can stay declarative while static export still renders explicit loading and error states before hydration.
- React Flow docs graphs live in `src/components/docs/react-flow-diagram.tsx`; the wrapper projects checked-in nodes and edges into `@xyflow/react` with explicit viewport sizing, fit-view behavior, and accessibility labels so static export and hydration stay deterministic.
- GitHub Pages base-path and route constants live in `src/lib/site.ts`; `next.config.ts` imports `SITE_BASE_PATH` from there so export settings stay aligned with link helpers.
- Site budget route coverage, checked-in route thresholds, exported static-asset thresholds, scope guidance, and measurement helpers live in `src/lib/site-budget.ts`; the checked-in scope is the homepage (`/`), the docs entry route (`/docs`), and total emitted JavaScript bytes under `out/_next/static`, and the gate fails by route or asset dimension when that exported surface regresses.
- Current budget-lane limitations are explicit in the checked-in guidance and command output: broader route coverage, richer bundle analysis, search-index budgets, and deeper platform-level performance instrumentation are intentionally out of scope for this phase.
- Static export uses `output: "export"` with `trailingSlash: true` and `images.unoptimized: true` for GitHub Pages compatibility.
- Reusable static-export build and local serving helpers live in `src/lib/static-export.ts`; tests reuse the same module through `tests/helpers/static-export-server.ts`.
- Unit tests live under `tests/unit/` and import source modules with relative paths.
- Component behavior tests use `@testing-library/react` with `@happy-dom/global-registrator` preloaded from `bunfig.toml` (`tests/setup/happydom.ts`, `tests/setup/testing-library.ts`).
- Served static-export navigation tests build once, mount `out/` under the base path, and use Bun's native `fetch` via `tests/helpers/http.ts` (happy-dom's fetch blocks cross-origin local requests).
- `validate:static-export` cleans `.next`, runs one production build under `withStaticExportBuildLock()`, then invokes `tests/unit/static-export.test.ts` with `STATIC_EXPORT_SKIP_BUILD=1` and `STATIC_EXPORT_BUILD_LOCK_HELD=1` so the served-export tests reuse that export without deadlocking on the parent-held lock.
- `src/lib/validation/static-export-build-lock.ts` serializes `.next`/`out/` production builds across concurrent test files and subprocessed quality-gate runs.
- `src/lib/validation/static-export-build-lock.ts` supports same-process nested acquisition; keep cross-process locking in one place rather than layering ad hoc file cleanup around callers.
- `buildStaticExport()` in `src/lib/static-export.ts` also cleans `.next` before building when a fresh export is required.
- `startStaticExportServer()` copies `out/` into a temp snapshot before serving it so export-backed suites do not observe a live shared `out/` while another test rebuilds the site.
- Browser verification for the reconciled baseline uses `@playwright/test` Chromium against the same `tests/helpers/static-export-server.ts` mount pattern; see `tests/unit/reconciled-export-browser.test.ts`.
- Manual browser verification for website changes follows `docs/internal/processes/manual-qa.md`; serve the export via a parent directory symlink (`you-agent-factory-docs -> out`) so `/you-agent-factory-docs/...` URLs resolve locally.

## Package scripts

`package.json` scripts mirror the Makefile targets for direct Bun invocation:

- `bun run dev` — local dev server
- `bun run budget` — exported-site route and asset budget gate
- `bun run typecheck` — `next typegen && tsc --noEmit`
- `bun run lint` — `biome check .`
- `bun run test` — `bun test`
- `bun run build` — `bun run generate:search-index && next build`
- `bun run quality-gate` — early foundation quality gate
