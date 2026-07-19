# Unified API Reference Renderer (W08) Relevant Files

Use these files when implementing or extending the production HTTP/OpenAPI
reference renderer for the shipped `/docs/references/api` experience
(components + integration helpers — not the final MDX page inventory owned by
W11).

## Ownership fence

W08 owns only the production API UI surface under
`src/components/references/api/` (and focused tests / integration helpers for
that surface). Do **not**:

- reopen W01 OpenAPI spike trees (`src/lib/references-openapi-spike/`) for new
  spike feature work (migrate reusable helpers into the production surface)
- edit W02 SSE/AsyncAPI spike trees except where a shared helper must move into
  production API ownership
- edit schema UI (`src/components/references/schema/`, W07)
- implement the full event envelope/payload catalog (W09)
- build CLI/MCP/JS family renderers (W10)
- publish final `/docs/references/api` MDX page, nav, sitemap, or search
  inventories (W11+)
- patch `node_modules`

## Production dependency pin (W08 owner)

| Path | Role |
| --- | --- |
| `src/components/references/api/dependency-selection.ts` | Production `fumadocs-openapi@10.10.3` pin on Fumadocs 16.9, coordinated 11.2/16.10 upgrade-risk notes, explicit `@fumadocs/asyncapi` non-pin for hybrid API-page summaries |
| `src/components/references/api/dependency-selection.test.ts` | Asserts installed versions match the production pin and AsyncAPI stays out of the production set |
| `package.json` / `bun.lock` | Exact `fumadocs-openapi` `10.10.3` plus required peers (`fumadocs-core` / `fumadocs-ui` 16.9 line, `@scalar/api-client-react`) |

### AsyncAPI policy

W02 selected **hybrid** SSE placement. API-page summaries own HTTP transport
semantics and link toward `/docs/references/events`; W09 owns the event corpus.
**Do not pin `@fumadocs/asyncapi` for production API summaries.** Residual
`package.json` entries that only keep merged W02 spike evidence modules
resolvable are not part of the W08 production pin set and must not be imported
from `src/components/references/api/`.

### Upgrade risk

Do not install `fumadocs-openapi` 11.2 while remaining on Fumadocs 16.9.
The recorded coordinated candidate is `fumadocs-openapi@11.2.2` with
`fumadocs-core` / `fumadocs-ui` `16.10.7`. After that bump, revalidate
`per: "file"` single-page projection, playground suppression, theme/code-block
hooks, and SSR cost.

## Key host files

| Path | Role |
| --- | --- |
| `src/components/references/api/index.ts` | Public barrel: published primary = `ApiReferenceAPIPage`; custom operation chrome is harness/deep-import only (not re-exported) |
| `src/components/references/api/published-renderer-exports.test.ts` | Proves barrel names Fumadocs as primary and omits superseded custom section/badge/examples/media-type exports |
| `src/components/references/api/ownership.ts` | Ownership root + forbidden-tree fence helpers |
| `src/components/references/api/ownership.test.ts` | Ownership root presence + fence proofs |
| `src/components/references/api/types.ts` | Status vocabulary for loading/empty/invalid/unsupported/ready |
| `src/components/references/api/api-status.tsx` | Accessible non-ready status messaging |
| `src/components/references/api/api-surface.tsx` | Boundary that short-circuits non-ready statuses or renders ready children |
| `src/components/references/api/api-surface.test.tsx` | Status semantics proofs for the ownership boundary |
| `src/components/references/api/load-openapi-artifact.ts` | W03-backed loader for `@you-agent-factory/api/openapi` (document object + schema id) |
| `src/components/references/api/openapi-server.ts` | `createOpenAPI` + `per: "file"` single-page projection; Turbopack-safe package load; attaches W04 normalized ops from the same artifact |
| `src/components/references/api/api-page.tsx` | Production `createAPIPage` / `<APIPage />` binder (playground off, schemaUI examples, request/response `data-api-schema-slot` wrappers, `data-api-operation-summary` + `data-api-operation-path-token`, operationId section wrappers) |
| `src/components/references/api/api-code-block.tsx` | `renderCodeBlock` → ServerCodeBlock + dual Shiki themes |
| `src/components/references/api/count-openapi-operations.ts` | Pure live-inventory counters (ops / paths) for projection assertions |
| `src/components/references/api/assert-single-page-projection.ts` | Happy-dom-safe child-process proof for `per: "file"` (run with plain `bun`) |
| `src/components/references/api/single-page-projection.test.ts` | W03 acquisition + single-page projection proofs |
| `src/components/references/api/operation-navigation.ts` | Pure tag-grouped nav model + mobile HTML probe contract |
| `src/components/references/api/api-operation-navigator.tsx` | Desktop tag-grouped operation deep links |
| `src/components/references/api/api-reference-mobile-navigator.tsx` | Phone/tablet collapsed `<details>` navigator |
| `src/components/references/api/api-operation-navigation.tsx` | Responsive composition (`lg+` desktop / `<lg` mobile) + filter |
| `src/components/references/api/operation-filter.ts` | Pure method/path/summary/operation-ID filter projectors |
| `src/components/references/api/api-operation-filter.tsx` | Keyboard-accessible filter search + Clear control |
| `src/components/references/api/load-operation-navigation.ts` | Build nav model from live package artifact + document tag order |
| `src/components/references/api/assert-operation-navigation.ts` | Happy-dom-safe subprocess proof: nav anchors ↔ `per:"file"` projection |
| `src/components/references/api/api-navigation-verification-harness.tsx` | Harness: navigators + operation sections (detail or stub) + copy links + hash controller |
| `src/components/references/api/operation-detail.ts` | Pure projectors for parameters, bodies, responses, media types, authored examples |
| `src/components/references/api/load-operation-details.ts` | Build detail inventory + anchor map from the live package artifact |
| `src/components/references/api/api-method-badge.tsx` | Harness-only HTTP method text badge (deep-import; not on public barrel) |
| `src/components/references/api/api-response-media-type.tsx` | Harness-only JSON vs `text/event-stream` vs other labels (deep-import) |
| `src/components/references/api/api-operation-examples.tsx` | Harness-only CodePanel examples (deep-import; not published Fumadocs path) |
| `src/components/references/api/api-operation-section.tsx` | Harness/unit custom operation section — **not** the published primary renderer (`ApiReferenceAPIPage` is) |
| `src/components/references/api/playground-suppression.ts` | Production `playground: { enabled: false }` + no-`proxyUrl` / forbidden proxy-route policy |
| `src/components/references/api/local-server-base-url.ts` | Pure projectors for OpenAPI `servers` → local base URL + docs-host disclaimer |
| `src/components/references/api/api-local-server-base-url.tsx` | Visible local-server base URL notice (static-only; no live execution) |
| `src/components/references/api/load-local-server-base-url.ts` | Load primary local-server notice from the package OpenAPI artifact |
| `src/components/references/api/assert-playground-suppression-browser.ts` | Playwright harness probe: no Send/try-it/proxy UI + local base URL visible |
| `src/components/references/api/sse-operations.ts` | Production inventory of the three SSE ops + roles (canonical / ephemeral / compatibility-only) |
| `src/components/references/api/sse-operation-summary.ts` | Pure hybrid SSE summaries: HTTP transport semantics + `/docs/references/events` catalog links |
| `src/components/references/api/api-sse-operation-summary.tsx` | SSE summary panel UI (static-only; no live EventSource) |
| `src/components/references/api/assert-sse-summaries-browser.ts` | Playwright harness probe: three SSE summaries, roles, events links, no full catalog |
| `src/components/references/api/theme-tokens.ts` | Production semantic theme token classes, method-badge tones, CodePanel code-copy policy, dual Shiki options |
| `src/components/references/api/theme-tokens.test.ts` | Token-class / code-copy policy / host contrast proofs |
| `src/components/references/api/api-theme-code-copy.test.tsx` | CodePanel + copy affordance, method badge tones, theme-root harness wiring |
| `src/components/references/api/assert-theme-code-copy-browser.ts` | Playwright harness probe: theme root, method badges, CodePanel copy, no playground |
| `src/components/references/api/a11y-verification.ts` | Phone/tablet/desktop viewports, keyboard focus contract, print policy, reduced-motion scroll helper |
| `src/components/references/api/api-a11y-print.test.tsx` | Keyboard, overflow, reduced-motion hash focus, and print-readable fact proofs |
| `src/components/references/api/assert-a11y-print-browser.ts` | Playwright harness probe: overflow × 3 viewports, keyboard, reduced-motion, print, SSE + non-SSE |
| `src/features/docs/styles/references-api-print.css` | Print stylesheet: hide filter/nav/copy chrome; keep method/path/summary + request/response |
| `src/components/references/api/operation-anchors.ts` | Stable operationId anchors, collision check, owning-page deep-link URL helpers |
| `src/components/references/api/api-operation-copy-link.tsx` | Copy-link control (`useCopyButton`) targeting `/docs/references/api#<anchor>` |
| `src/components/references/api/api-reference-hash-controller.tsx` | Hash-to-focus + back/forward (`hashchange` / `popstate`) without rewriting content |
| `src/app/(dev)/api-renderer-harness/page.tsx` | Non-production harness route (`ENABLE_API_RENDERER_HARNESS=1` in production) |
| `src/lib/references/api-package-artifact-resolver.ts` | W03 public-subpath acquisition used by the production loader |
| `src/lib/references/normalize-family-artifacts.ts` | W04 `normalizeOpenApiOperationsFromArtifact` — same corpus, not a second OpenAPI source |
| `src/lib/references-openapi-spike/` | Merged W01 non-production spike — donor of reusable helpers only |

## Single-page OpenAPI projection

- Acquire only through `loadApiOpenApiArtifact()` →
  `resolveApiPackageArtifact("@you-agent-factory/api/openapi")`.
- Under Next/Turbopack, `loadApiOpenApiArtifact` injects a manifest-relative
  `resolveExport` (`createRequire` → `@you-agent-factory/api/manifest` →
  `openapi/openapi.yaml`) because bare `import.meta.resolve` is unreliable in
  bundled RSC. Illegal targets still fail closed in the W03 resolver.
- Also inject `js-yaml` as `parseYaml` — Next runs under Node where
  `Bun.YAML.parse` is unavailable (same pattern as the W01 spike server).
- Feed `createOpenAPI` a **document object** (not a filesystem path string) so
  happy-dom URL polyfills under `bun test` do not break
  `@apidevtools/json-schema-ref-parser`.
- Prefer `apiOpenApiTurbopackLoadDependencies()` inside `createOpenAPI` input **and**
  `loadApiOpenApiSinglePageProjection()` so Next/Turbopack RSC pages resolve the
  same package YAML (ancestor `node_modules` walk) that CLI/tests use — bare
  `createRequire` can become `[externals]/…` under Turbopack and fail closed in
  the W03 resolver.
- Project with `openapiSource(server, { per: "file", baseDir: "references/api" })`
  so every published operation lands on one virtual page.
- Mount published operations through `ApiReferenceAPIPage` (`createAPIPage`) from
  `api-page.tsx` — playground stays `{ enabled: false }`, no `proxyUrl`, and each
  operation is wrapped in `<section id={operationId} data-api-operation-section>`.
- Request/response body Schema UI stays on the Fumadocs path: `schemaUI.showExample`,
  `showResponseSchema: true`, and `data-api-schema-slot="request|response"` wrappers
  around `slots.body` / `slots.responses` (promoted from the W01 spike). Do **not**
  add a bespoke schema explorer under `src/components/references/schema/` for this
  page — W07 owns that tree separately.
- Assert operation counts against the **live** package inventory
  (`countOpenApiOperations`), not a frozen product quota. Baseline observation
  at pin time was 45 operations / 41 paths.
- Run `assert-single-page-projection.ts` via plain `bun` (subprocess from tests),
  never call `openapiSource` directly inside `bun test`.
- Browser proof for the Fumadocs mount:
  `bun src/content/docs/references/api/assert-api-page-fumadocs-browser.ts`
  (unique port default 3542).
- Browser proof for request/response component schema fields:
  `bun src/content/docs/references/api/assert-api-page-schema-components-browser.ts`
  (unique port default 3552). Probe target:
  `submitWorkBySessionId` → `#/components/schemas/SubmitWorkRequest` fields
  (`name`, `workTypeName`, `items`) via Fumadocs Schema UI (lazy client boundary —
  wait for hydrated fields, not SSR example JSON alone).
- Published API MDX stays projection-first: keep `what-it-covers` /
  `key-concepts` / `operations` (+ Fumadocs mount); do **not** ship
  `how-to-use`, `limits-and-assumptions`, `related`, `tags`, or `references`
  (citations) sections on this page only. Sibling reference family pages are
  owned by `repair-reference-boilerplate-trim`. Browser proof:
  `bun src/content/docs/references/api/assert-api-page-boilerplate-trim-browser.ts`
  (unique port default 3562) — assert section ids, not fragile heading strings
  like "Tags" that Fumadocs may reuse.
- End-to-end published-page gate (story 006):
  `bun src/content/docs/references/api/assert-api-page-gates-browser.ts`
  (unique port default 3572). Proves Fumadocs ops + static-only + schema fields
  + SSE notes + boilerplate trim + readable method/path/summary /
  `data-api-operation-path-token` markers in one pass.
- W04 normalized summaries are derived from the same loaded document for
  cross-links/display; do not invent a second OpenAPI corpus.

## Tag-grouped operation navigation

- Build nav from W04 `normalizedOperations` on the same package artifact as the
  single-page projection — never invent a second OpenAPI corpus.
- Prefer OpenAPI document `tags[].name` order via `readOpenApiDocumentTagOrder`;
  untagged ops land in a final `Untagged` group.
- Desktop: `ApiOperationNavigator` (visible `lg+`). Phone/tablet:
  `ApiReferenceMobileNavigator` — collapsed-by-default `<details>`, open list
  capped at `max-h-[50vh]` (migrated W01 mobile-nav pattern).
- Deep links use W04 `anchor` fragments (`#${anchor}`); harness stub sections
  use the same `id` so targets match before full operation rendering (later
  stories).
- Verify at `/api-renderer-harness` (dev) — not a published `/docs/references/api`
  inventory (W11).

## Operation filtering

- Pure projectors live in `operation-filter.ts` — match method, path, summary,
  and operation ID with case-insensitive substrings; never mutate the nav model.
- `ApiOperationFilter` is the keyboard-operable search + Clear control.
- `ApiOperationNavigation` owns filter UI state (controlled or uncontrolled),
  projects filtered groups into both navigators, and shows `ApiStatus` empty
  messaging when a non-empty query matches nothing.
- Clearing the query (Clear button or emptying the field) restores the full
  tag-grouped set from the original model.

## Stable anchors, copy links, and hash focus

- Prefer W04 / published `operationId` fragments via `resolveApiOperationAnchor`
  and prove collision-freedom with `collectCollisionFreeApiOperationAnchors`
  against the live package inventory (same corpus as nav / projection).
- Copy links use `ApiOperationCopyLink` + fumadocs `useCopyButton`, defaulting
  to `/docs/references/api#<anchor>` (`API_REFERENCE_PAGE_PATH`) so shared URLs
  match the eventual W11 mount even when verifying on the harness route.
- `ApiReferenceHashController` listens for `hashchange` and `popstate`, then
  scrolls/focuses the matching `[data-api-operation-section]` (`tabIndex={-1}`)
  and sets `data-api-hash-focused`. Respects `prefers-reduced-motion`. Does not
  rewrite operation content.
- Harness stub sections keep `id={anchor}` so `/api-renderer-harness#…` and
  production `/docs/references/api#…` share the same fragment contract.

## Operation request/response detail

- **Published path:** method/path/parameters/body/responses (+ schema fields)
  come from Fumadocs `ApiReferenceAPIPage` (`createAPIPage`). Do not mount
  custom `ApiOperationSection` on `/docs/references/api`.
- Pure projectors in `operation-detail.ts` still feed the published ready-gate
  (corrupt inventory → invalid) and harness fixtures — shallow-resolve
  `#/components/parameters/*` refs; project request/response media types and
  **authored** `example` / `examples` only (never invent payloads or walk W07
  schema field trees).
- Harness-only custom chrome (deep-import; **not** on `@/components/references/api`
  barrel): `ApiMethodBadge`, `ApiResponseMediaType`, `ApiOperationExamples`,
  `ApiOperationSection`. Keep them for `/api-renderer-harness` and unit
  a11y/theme/SSE fixtures. Published-page a11y/no-JS/long-token gates must
  accept Fumadocs markers (`data-api-operation-summary` attribute,
  `data-api-operation-path-token` around the static method/path bar,
  `overflow-auto` containment) — see
  `a11y-reference-no-js-html-contract.ts` and
  `a11y-reference-long-token-overflow-contract.ts`.
- Load via `buildApiOperationDetailsFromArtifact()` (happy-dom-safe).

## Playground suppression and local-server base URL

- Production policy lives in `playground-suppression.ts` (`API_PLAYGROUND_OPTIONS`
  with `enabled: false`, `API_PROXY_POLICY` with unset `proxyUrl` + forbidden
  App Router proxy segments). Prefer this over editing the W01 spike policy.
- `apiOpenApiServer` must leave `proxyUrl` unset; assert via
  `assertsNoApiProxyUrl(apiOpenApiServer.options)`.
- `apiReferencePlaygroundPageOptions()` is the `createAPIPage` fragment used by
  `ApiReferenceAPIPage` (`playground: { enabled: false }`). Harness-only
  `ApiOperationSection` has no playground slots either, but is not the published
  renderer.
- Local-server notice: pure `local-server-base-url.ts` projectors read OpenAPI
  `servers` (live package baseline: `http://localhost:7437`);
  `ApiLocalServerBaseUrlNotice` shows the URL plus an explicit docs-host
  disclaimer so readers never treat the documentation host as the API.
- Harness (`/api-renderer-harness`) mounts the notice and marks
  `data-api-playground-suppressed="true"`. Static examples stay visible without
  a reachable Factory host.
- Browser probe: `bun src/components/references/api/assert-playground-suppression-browser.ts`
  (unique port, `localhost`, Playwright via `launchPlaywrightBrowser`).

## Hybrid SSE operation summaries

- Inventory: `sse-operations.ts` lists the three published SSE ops with roles
  (canonical `getEventsBySessionId`, ephemeral
  `getFactoryResponseEventsBySessionId`, compatibility-only `getEvents`).
  Compatibility-only is **never** preferred/canonical.
- Pure summaries: `sse-operation-summary.ts` projects HTTP transport semantics
  owned by the API page (transport, reconnect, cursor precedence, handshake
  headers, dual-Accept, replay/retained-history, compatibility-only status) and
  links toward planned W09 anchors under `/docs/references/events#…`
  (W04 schema-pointer encoding for envelope schemas).
- UI: On the published Fumadocs-primary page, `ApiSseOperationSummaryPanel`
  injects via `content.renderOperationLayout` in `api-page.tsx` (after
  description, before parameters) for those three ops only. Section wrappers
  also mark `data-api-sse-operation="true"`. Harness-only `ApiOperationSection`
  (deep-import) still mounts the same panel for `/api-renderer-harness` /
  unit fixtures — not a parallel published renderer. Markers:
  `data-api-sse-summary`, `data-api-sse-role`,
  `data-api-sse-live-connection="false"`, `data-api-sse-full-catalog="false"`.
- Do **not** implement the full event envelope/payload catalog here (W09). Do
  not import W02 spike catalog views into the production API tree.
- Browser probes:
  - harness: `bun src/components/references/api/assert-sse-summaries-browser.ts`
  - published page: `bun src/content/docs/references/api/assert-api-page-static-sse-browser.ts`
    (wait for terminal `data-api-status=ready` after Suspense; unique port)

## Theme tokens and code-copy

- Production contract: `theme-tokens.ts` — `API_THEME_ROOT_ATTR`
  (`data-api-reference-theme`), `API_TOKEN_CLASSES`, method-badge tone classes,
  `API_CODE_COPY_POLICY` (site `CodePanel` + fumadocs `useCopyButton`, no second
  widget), and dual Shiki options for later `createAPIPage` wiring.
- Do **not** introduce page-only hex/oklch color systems under
  `src/components/references/api/`. Method meaning stays in badge text;
  tones are semantic chrome only.
- `ApiOperationExamples` marks CodePanel with `data-api-code-panel` and uses
  the shared copy affordance (`data-api-example="copy"`).
- Harness mounts the theme root marker so browser probes can assert tokenized
  chrome + copy without relying on W01 spike CSS.
- Browser probe: `bun src/components/references/api/assert-theme-code-copy-browser.ts`
  (unique port default 3539, `localhost`, Playwright via `launchPlaywrightBrowser`).

## Responsive, keyboard, reduced-motion, and print

- Contract: `a11y-verification.ts` — `API_VERIFICATION_VIEWPORTS` (390 / 768 /
  1440), keyboard control selectors with focus-ring checks, print root/chrome/
  content markers, and `apiHashFocusScrollBehavior` (`auto` under reduced
  motion).
- Print stylesheet: `src/features/docs/styles/references-api-print.css`
  (imported by `/api-renderer-harness`). Hides
  `[data-api-print-chrome="hide"]` (filter, navigators, copy links) and keeps
  method/path/summary + parameters/request-body/responses readable — never
  hover-only facts for those fields.
- Harness mounts `data-api-reference-print`; operation sections carry
  `data-api-print-content`.
- Hash focus already honors `prefers-reduced-motion` (instant scroll); prove
  with `focusApiOperationAnchor(..., { reduceMotion: true })` and browser
  `emulateMedia({ reducedMotion: "reduce" })`.
- Browser probe: `bun src/components/references/api/assert-a11y-print-browser.ts`
  (unique port default 3540) — overflow at phone/tablet/desktop, keyboard
  filter/nav/copy, reduced-motion hash focus, print media facts, all 45 ops
  reachable, playground absent, one SSE + one non-SSE section checked.

## Patterns

- Keep production API UI under `src/components/references/api/` so ownership
  stays separate from spikes, schema UI, events, and family renderers.
- Treat `dependency-selection.ts` as the source of truth for production pins;
  do not re-litigate temporary spike status constants as production policy.
- Non-ready outcomes must be explicit and accessible (`role="status"`,
  `aria-live="polite"`, `aria-busy` when loading).
- Prefer migrating helpers from the W01/W02 spikes into this tree over editing
  the spike in place.

## Focused verification

```bash
bun test src/components/references/api/dependency-selection.test.ts \
  src/components/references/api/ownership.test.ts \
  src/components/references/api/published-renderer-exports.test.ts \
  src/components/references/api/api-page.test.ts \
  src/components/references/api/api-surface.test.tsx \
  src/components/references/api/single-page-projection.test.ts \
  src/components/references/api/operation-navigation.test.ts \
  src/components/references/api/operation-filter.test.ts \
  src/components/references/api/load-operation-navigation.test.ts \
  src/components/references/api/api-operation-navigation.test.tsx \
  src/components/references/api/operation-anchors.test.ts \
  src/components/references/api/api-operation-anchors.test.tsx \
  src/components/references/api/operation-detail.test.ts \
  src/components/references/api/api-operation-section.test.tsx \
  src/components/references/api/playground-suppression.test.ts \
  src/components/references/api/local-server-base-url.test.tsx \
  src/components/references/api/sse-operation-summary.test.ts \
  src/components/references/api/api-sse-operation-summary.test.tsx \
  src/components/references/api/theme-tokens.test.ts \
  src/components/references/api/api-theme-code-copy.test.tsx \
  src/components/references/api/api-a11y-print.test.tsx
```
