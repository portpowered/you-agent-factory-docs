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
- GitHub Pages base-path and route constants live in `src/lib/site.ts`; `next.config.ts` imports `SITE_BASE_PATH` from there so export settings stay aligned with link helpers.
- Static export uses `output: "export"` with `trailingSlash: true` and `images.unoptimized: true` for GitHub Pages compatibility.
- Unit tests live under `tests/unit/` and import source modules with relative paths.

## Package scripts

`package.json` scripts mirror the Makefile targets for direct Bun invocation:

- `bun run dev` — local dev server
- `bun run typecheck` — `tsc --noEmit`
- `bun run lint` — `biome check .`
- `bun run test` — `bun test`
- `bun run build` — `next build`
