# W01 OpenAPI single-page spike — consolidated findings

**Status: non-production temporary spike evidence.**

This document is **not** the shipped `/docs/references/api` surface. The
isolated route `/references-openapi-spike` exists only to prove Fumadocs OpenAPI
can host all packaged HTTP operations on one static page. Do not merge this
spike as production reference UI.

Recorded: 2026-07-18T09:20:00Z (UTC)

Machine-checkable publication contract:
`src/lib/references-openapi-spike/findings-publication.ts`.

Committed CI rollup (source of truth for PR checks):
`src/lib/references-openapi-spike/findings-rollup.md`.

Planner mirror (gitignored): `docs/temp/references/w01-openapi-spike-findings.md`.

Per-story narrative sources (same `docs/temp/references/` directory):

| Story | Topic | File |
| --- | --- | --- |
| 001 | Dependency choice / upgrade risk | `w01-openapi-dependency-findings.md` |
| 002 | Single-page render | `w01-openapi-single-page-route-findings.md` |
| 003 | Anchors / schemas / examples | `w01-openapi-anchors-schemas-examples-findings.md` |
| 004 | Playground suppression | `w01-openapi-playground-suppression-findings.md` |
| 005 | Theme customization | `w01-openapi-theme-customization-findings.md` |
| 006 | Mobile nav + costs | `w01-openapi-mobile-and-costs-findings.md` |

## Dependency choice

- Selected temporary spike pin: **`fumadocs-openapi@10.10.3`**
- Peers: `fumadocs-core` / `fumadocs-ui` `^16.9.0` — satisfied by resolved
  **16.9.3**
- Recorded stack: Next **16.2.7**, React **19.2.7**, `fumadocs-mdx` **15.0.10**,
  `@you-agent-factory/api` **0.0.0**
- Temporary peer: `@scalar/api-client-react` `^2.0.20` (resolved for render only)

Constants: `src/lib/references-openapi-spike/dependency-selection.ts`.

## Upgrade candidate and risk

- Coordinated candidate: **`fumadocs-openapi@11.2.2`** with Fumadocs
  **`16.10.7`** (`fumadocs-core` + `fumadocs-ui` together)
- **Not installable on the current 16.9 stack** (peers require `^16.10.0`)
- Upgrade risks: exact ui↔core patch coupling on 16.10; major openapi 10→11 API
  revalidation (`per:"file"`, playground, theme hooks); existing zod ^3 vs
  optional fumadocs zod 4 soft mismatch continues

## Single-page render result

- Route: `/references-openapi-spike` under `src/app/(dev)/` (hidden in
  production unless `ENABLE_OPENAPI_SPIKE=1`)
- Source: packaged `@you-agent-factory/api` OpenAPI YAML (manifest resolve +
  `generated/openapi/openapi.yaml` — not a page-local fork)
- Projection: `openapiSource({ per: "file" })` → **one** virtual page with
  **45** published operations (41 paths)

## Anchor collision result

- Deep links: `<section id={operationId}>` for all **45** ops — collision-free
  (collectors throw on duplicates)
- Fumadocs heading slugs also unique for the current document
- Request/response Schema UI traversable; 44/45 ops have response body schemas
  (`closeFactorySession` DELETE is no-content)
- Static examples/snippets render (`<pre>` ≈ **214** in verified HTML)
- Nested fumadocs ids (`request-body`, …) are **not** scoped per op on one page
  — prefer `operationId` deep links until W08 scopes nesting

## Playground suppression

- `playground: { enabled: false }` via `SPIKE_PLAYGROUND_OPTIONS`
- No `proxyUrl`; no App Router proxy / live API execution routes
- HTML probe: **0** Send buttons, **0** auth panels; static `<pre>` examples
  retained; usable without a factory/API host

## Customization results

| Surface | Status |
| --- | --- |
| `renderPageLayout` / `renderOperationLayout` | supported-exercised |
| `renderCodeBlock` → `ServerCodeBlock` + `docs-code-block` | supported-exercised |
| `schemaUI.showExample` | supported-exercised |
| Dual `shikiOptions` (light/dark CSS vars) | supported-exercised |
| `renderHeading` | blocked-unsupported (deprecated) |
| MethodLabel colors | blocked-unsupported; remapped via token-only CSS |

- No hard-coded page-only hex/oklch in spike theme CSS — semantic `var(--*)`
  under `[data-openapi-spike-theme]`
- Host is `html.dark` + `factory-dark`; dual shiki vars remain for future light
  mapping

## Mobile navigation notes

- Phone viewport probe: **390×844**
- Collapsed-by-default `<details>` operation nav (`data-openapi-spike-mobile-nav`)
  with `max-h-[50vh]` scroll list
- Playwright: **0** page overflow px; all **45** deep links reachable after expand
- Risk: do not ship an always-open 45-link list above the fold

## Cost measurements

Build mode: **`next-dev-ssr`** (reproducible probe).

```bash
OPENAPI_SPIKE_PROBE_PORT=3466 \
  bun src/lib/references-openapi-spike/assert-mobile-and-costs.ts
```

| Metric | Value (2026-07-18T09:10:48Z UTC) |
| --- | --- |
| HTML | **12.06 MiB** (12,646,669 bytes) |
| Next static JS (dev / Turbopack-inflated) | **4.66 MiB** (4,889,261 bytes) |
| Hydration proxy (DCL) | **8712 ms** |
| Search projection Δ | **0 bytes** |

Primary W08 signal: HTML magnitude (~12 MiB). Re-measure under static export
before setting hard JS budgets.

## Production unpin and out-of-scope

- OpenAPI / Scalar `package.json` pins remain **temporary / non-final**. Final
  production OpenAPI versions **stay unpinned** pending W01/W02 evidence use;
  W08 chooses production pins.
- This lane does **not** own or implement **W02 AsyncAPI** projector work.
- Shared final **navigation / search / sitemap** inventories were **not**
  edited; search-projection size impact is **0**.
- Spike is explicitly **non-production** and must not be presented as shipped
  `/docs/references/api`.

## Reproduction checklist

```bash
bun test src/lib/references-openapi-spike/
bun src/lib/references-openapi-spike/assert-single-page-projection.ts
bun src/lib/references-openapi-spike/assert-anchors-schemas-examples.ts
OPENAPI_SPIKE_PROBE_PORT=3464 bun src/lib/references-openapi-spike/assert-playground-suppression.ts
OPENAPI_SPIKE_PROBE_PORT=3465 bun src/lib/references-openapi-spike/assert-theme-customization.ts
OPENAPI_SPIKE_PROBE_PORT=3466 bun src/lib/references-openapi-spike/assert-mobile-and-costs.ts
```
