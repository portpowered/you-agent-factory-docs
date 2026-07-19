# Repair Static-Export Trailing-Slash Directory Routes — relevant files

GitHub Pages serves trailing-slash URLs as directory lookups
(`docs/factories/index.html`). Flat export HTML (`docs/factories.html`) returns
200 for `/docs/factories` but 404 for `/docs/factories/`.

## Policy

| Setting | Where | Effect |
| --- | --- | --- |
| `trailingSlash: true` | `staticExportNextConfig` in `src/lib/build/static-export.ts` | Static export emits `…/index.html` directory landings |
| Applied only when `NEXT_STATIC_EXPORT=1` | `resolveNextConfigForBuildMode` | Non-export `next dev` / `next build` do not inherit the policy |

`next.config.ts` spreads `resolveNextConfigForBuildMode()` — do not hardcode
`trailingSlash` outside the static-export helper.

## Owned files (this lane)

| Path | Role |
| --- | --- |
| `src/lib/build/static-export.ts` | `staticExportNextConfig.trailingSlash: true` + basePath/assetPrefix |
| `src/lib/build/static-export.test.ts` | Export-only trailingSlash + project-site basePath proofs |
| `src/lib/build/export-out-directory.ts` | `exportHtmlRelativePath` maps `/docs/factories` → `docs/factories/index.html` (root stays `index.html`) |
| `src/lib/build/export-out-directory.test.ts` | Directory-landing path mapping for collection indexes |
| `src/lib/build/verify-export-base-path.ts` | Nav href checker accepts trailing-slash Link forms from trailingSlash export |

Trailing-slash input (`/docs/factories/`) normalizes to the same landing as
non-slash. Do not reintroduce flat `${route}.html` mapping — Pages 404s on
directory URLs when only flat HTML exists.

Export fixtures and SEO/probe tests that write `out/` HTML should use
`exportHtmlRelativePath(route)` so they stay aligned with directory landings.

## Do not touch

Content copy, family-index intros, search ranking, chrome highlighting, or
retired you-config compatibility redirects.
