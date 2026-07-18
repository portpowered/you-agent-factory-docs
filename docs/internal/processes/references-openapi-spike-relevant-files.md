# References OpenAPI spike — relevant files

Non-production W01 single-page OpenAPI spike helpers. Do not treat this tree as
the shipped `/docs/references/api` surface.

## Dependency selection

- `src/lib/references-openapi-spike/dependency-selection.ts` — temporary
  `fumadocs-openapi` pin (`10.10.3` on Fumadocs 16.9) plus coordinated upgrade
  candidate (`11.2.2` with Fumadocs 16.10). Status is
  `non-production-temporary`; W08 chooses production pins.
- `src/lib/references-openapi-spike/dependency-selection.test.ts` — asserts
  installed package versions match the recorded selection and upgrade-risk
  notes.
- Narrative findings for planners: `docs/temp/references/` (gitignored local
  planner state). Commit machine-checkable selection constants; keep long-form
  measurements and risk writeups under `docs/temp/references/`.

## Single-page route projection

- `src/lib/references-openapi-spike/resolve-openapi-artifact.ts` — resolves the
  installed OpenAPI YAML via the package's `manifest` JSON export + known
  relative path (do not `require.resolve` the `.yaml` export from Next-bundled
  modules; fumadocs-mdx/webpack will try to parse YAML as JS). Normalizes
  Turbopack `[project]/` virtual paths before `fs` reads.
- `src/lib/references-openapi-spike/openapi-server.ts` — `createOpenAPI` loads
  the packaged YAML via Bun into a schema-map input (avoids happy-dom file-URL
  breakage under `bun test`), then `openapiSource(..., { per: "file" })`
  projects every operation onto one virtual page.
- `src/lib/references-openapi-spike/api-page.tsx` — `createAPIPage` binder;
  wraps each operation in `<section id={operationId}>` via
  `content.renderPageLayout` and enables `schemaUI.showExample`.
- `src/app/(dev)/references-openapi-spike/page.tsx` — isolated non-production
  spike route (`/references-openapi-spike`). Hidden in production unless
  `ENABLE_OPENAPI_SPIKE=1`. Does not edit shared nav/search/sitemap inventories.
- `src/lib/references-openapi-spike/single-page-route.test.ts` — proves package
  resolution and that `per:"file"` yields one page with every published op.

## Anchors, schemas, and examples

- `src/lib/references-openapi-spike/operation-anchors.ts` — pure deterministic
  anchor helpers: fumadocs heading ids
  (`slug(summary || idToTitle(operationId))`) plus spike deep-link ids
  (`operationId`). Collision detection throws with method+path detail.
- `src/lib/references-openapi-spike/spike-anchor-inventory.ts` — aligns
  projection ops with packaged YAML metadata (schema/example presence).
- `src/lib/references-openapi-spike/assert-anchors-schemas-examples.ts` —
  happy-dom-safe child-process proof for collision-free anchors +
  schema/example inventory (run with plain `bun`, not `bun test`).
- Nested fumadocs section ids (`request-body`, `response`, …) are not scoped
  per operation on the single page (`AnchorSection` is not a public export).
  Prefer `operationId` section deep links for stable hash navigation.

## Playground suppression (static-only)

- `src/lib/references-openapi-spike/playground-suppression.ts` — shared
  `SPIKE_PLAYGROUND_OPTIONS` (`enabled: false`) and `SPIKE_PROXY_POLICY`
  (no `proxyUrl`, forbidden App Router proxy segments).
- `src/lib/references-openapi-spike/api-page.tsx` — passes
  `playground: SPIKE_PLAYGROUND_OPTIONS` into `createAPIPage` so fumadocs
  replaces the try-it form with a static method+path bar while usage-tab
  `<pre>` examples remain.
- `src/lib/references-openapi-spike/openapi-server.ts` — intentionally omits
  `proxyUrl` on `createOpenAPI`.
- `src/lib/references-openapi-spike/assert-playground-suppression.ts` —
  starts an isolated Next dev server, curls `/references-openapi-spike`
  (`--max-time 60`), asserts zero playground Send buttons / auth panels and
  retained `<pre>` examples. Run with plain `bun`, not inside `bun test`.
- Do not add `src/app/api/proxy` (or similar) for the spike.

## Theme / customization (factory tokens)

- `src/lib/references-openapi-spike/theme-customization.ts` — machine-checkable
  inventory of supported vs blocked `createAPIPage` hooks, semantic token
  classes, and dual shiki theme options (`github-light` / `github-dark`,
  `defaultColor: false`).
- `src/lib/references-openapi-spike/spike-code-block.tsx` — `renderCodeBlock`
  hook using `ServerCodeBlock` + `docs-code-block` markers (SSR highlight;
  no page-only hex).
- `src/lib/references-openapi-spike/api-page.tsx` — wires
  `renderOperationLayout`, `renderCodeBlock`, `schemaUI.showExample`, and
  `shikiOptions`. `renderHeading` is deprecated/unused; MethodLabel colors are
  remapped in CSS.
- `src/features/docs/styles/references-openapi-spike-theme.css` — scoped under
  `[data-openapi-spike-theme]`; remaps MethodLabel Tailwind colors to
  `var(--primary|secondary|accent|destructive|foreground)` only.
- `src/lib/references-openapi-spike/assert-theme-customization.ts` — HTML probe
  for theme root, operation-layout, schema-slot, code-block markers, and dual
  shiki CSS vars. Run with plain `bun`, not `bun test`.
- Host product is `html.dark` + `data-color-palette="factory-dark"`;
  fumadocs-ui `shadcn.css` already maps `--color-fd-*` → host semantic tokens.

## Mobile navigation and export / search costs

- `src/lib/references-openapi-spike/mobile-navigation.ts` — phone viewport
  (390×844), collapsible `<details>` contract, and pure HTML markup probe.
- `src/lib/references-openapi-spike/cost-measurements.ts` — reproducible
  measurement method (HTML bytes, Next static JS bytes, DOMContentLoaded
  hydration proxy, search-projection delta). Search delta is **0** while
  shared nav/search/sitemap inventories exclude the spike.
- Spike page wraps operation deep links in collapsed-by-default `<details>`
  with a `max-h-[50vh]` scroll list so phone readers can reach content without
  scrolling past 45 links; `min-w-0` + `overflow-x-hidden` on `<main>`.
- `src/lib/references-openapi-spike/assert-mobile-and-costs.ts` — starts an
  isolated Next dev server, measures HTML/JS, and uses Playwright at 390×844
  for overflow + nav expand/reachability + hydration proxy. Run with plain
  `bun`, not `bun test` (`OPENAPI_SPIKE_PROBE_PORT=3466`).
- Spike SSR HTML is multi-megabyte; treat that as a W08 productionization risk,
  not a CI budget gate for this non-production route.

## Temporary install policy

- Spike may add exact `fumadocs-openapi` and required peers (for example
  `@scalar/api-client-react`) to `package.json` / lockfile for render evidence.
- Do not treat those pins as the final production OpenAPI dependency set.
- Do not install `fumadocs-openapi` 11.2 while remaining on Fumadocs 16.9;
  upgrade requires a coordinated `fumadocs-core` + `fumadocs-ui` 16.10 bump.
- Temporary CSS import: `fumadocs-openapi/css/preset.css` plus
  `references-openapi-spike-theme.css` in `globals.css` for the spike only;
  revert or relocate when W08 productionizes references UI.
- Document-object `createOpenAPI` input (load packaged YAML with Node `fs` +
  `js-yaml`) avoids absolute file-path input. Under `bun test`, happy-dom's URL
  polyfill still breaks fumadocs-openapi's ref-parser — run projection
  assertions via plain `bun` child process
  (`assert-single-page-projection.ts`) instead of calling `openapiSource`
  inside happy-dom.
- `github-slugger` is a direct spike dependency so heading-id helpers match
  fumadocs without relying on a transitive import.
