# W11 Events Reference Page — Relevant Files

Use these files when wiring the published `/docs/references/events` hybrid
page that mounts the W09 public events corpus surface.

## Ownership fence

W11 events owns only:

- page bundle under `src/content/docs/references/events/`
- matching `reference.events` registry record under `src/content/registry/references/`
- page-local tests, messages, assets, and MDX component mounts
- minimal additive loader wiring so the page resolves and validates

Do **not**:

- edit renderer internals under `src/components/references/events/` or `api/`
- create sibling `/docs/references` index, `/docs/references/api`, schema,
  CLI, MCP, or JavaScript-runtime pages
- edit shared nav / sidebar / search / sitemap / compat inventories (W15–W18)
- edit a contended shared references `meta.json` / family index
- touch `src/content/docs/factories/**`, `workers/**`, or `workstations/**`
- patch `node_modules`

## Key host files (events page shell + corpus mount)

| Path | Role |
| --- | --- |
| `src/content/docs/references/events/page.mdx` | Published reference page structure |
| `src/content/docs/references/events/messages/en.json` | Default-locale copy |
| `src/content/docs/references/events/assets.json` | Empty baseline assets |
| `src/content/docs/references/events/EventsCorpusMount.tsx` | Page-local OpenAPI corpus resolve + EventsSurface mount (includes linked component schema splay) |
| `src/lib/references/events/linked-component-schemas.ts` | Pure builder: nested component schemas cited from catalog roots |
| `src/components/references/events/event-linked-component-schemas.tsx` | On-page linked component schema definitions section |
| `src/components/references/events/response-event-matrix.tsx` | Response dimensions; mounts payload-union SchemaDefinition so envelope SchemaRefLinks resolve |
| `src/content/docs/references/events/page-mdx-components.tsx` | Registers `EventsCorpusMount` for compileMDX |
| `src/content/docs/references/events/events-page.test.tsx` | Colocated route/render + corpus mount + catalog polish proof |
| `src/content/docs/references/events/events-schema-ref-link-resolution.test.tsx` | Same-page SchemaRefLink → inlined component-schema anchor proof |
| `src/content/docs/references/events/events-inlined-component-schema-anchors.test.tsx` | Story 003: success-corpus InferenceOutcome anchor + navigable SchemaRefLink regression |
| `src/content/docs/references/events/assert-events-page-catalog-polish-browser.ts` | Playwright probe: short Event catalog label, envelope components, suppressed pointer chrome, envelope/payload JSON examples on `/docs/references/events` |
| `src/content/docs/references/events/assert-events-page-inline-schema-splay-browser.ts` | Playwright probe: `#components-schemas-InferenceOutcome` hash focus + SchemaRefLink click-traverse; reports SSR HTML bytes for focused payload budget |
| `src/content/registry/references/events.json` | `reference.events` registry record |

## Additive registry / published-docs wiring

First published `reference.*` page in a lane must wire these once (shared with
other W11 reference page lanes):

| Path | Role |
| --- | --- |
| `src/lib/content/content-paths.ts` | `references` in `REGISTRY_COLLECTIONS` |
| `src/lib/content/registry.ts` | Disk loader for `referenceRecordSchema` under `registry/references/` |
| `src/lib/content/validate-registry.ts` | `reference` → `references` path-kind map |
| `src/lib/content/published-docs-registry-contract.ts` | `references` in `PUBLISHED_DOCS_SECTIONS` + href routing |
| `src/lib/content/content-hrefs.ts` | `referencePageHref` |
| `src/lib/content/registry-linking.ts` | Reference records are linkable when published |
| `src/lib/factory/canonical-page-surface-audit.ts` | `reference` → `references` registry directory |
| `src/lib/content/route-family-local-docs-page-load.ts` | Static `page-mdx-components` switch for `references/events` |

## Upstream dependencies (consume, do not reimplement)

| Path | Role |
| --- | --- |
| `src/components/references/events/` | Public W09 events corpus surfaces (`EventsSurface`, catalogs, reconnect, SSE examples) |
| `src/lib/references/events/` | Corpus resolution, hybrid placement, OpenAPI load helpers |
| `src/app/(dev)/events-renderer-harness/page.tsx` | Production composition reference for mount stories |

## Patterns

- Intro strip (post-catalog polish): page opens on Event Corpus only — remove
  `What It Covers` / `Key Concepts` Sections from `page.mdx` and delete
  `sections.whatItCovers` / `sections.keyConcepts` from messages. Set
  `openingSummary` to `""` (or omit) so `DocsOpeningSummary` mounts nothing;
  unlike CLI/MCP/JS, Events must not keep a long informational folded summary.
  Flip page-local tests / `assert-events-page-catalog-polish-browser.ts` to
  assert intro absence (MCP #156 pattern) without weakening #160 catalog polish.
  Retarget body-text asserts that depended on removed Key Concepts copy (for
  example `Hybrid placement`) to remaining corpus / catalog / reconnect markers
  or rely on existing `data-events-placement` asserts; do not restore intros.
- Keep curated discovery under `#related` with `LocalizedLinkList` toward planned
  `/docs/references/api`; leave `relatedIds` empty until sibling registry records exist.
- Rely on W05 nested discovery + page frontmatter; do not edit a shared
  references family index.
- Mount corpus via page-local `EventsCorpusMount` + `page-mdx-components.tsx`;
  add a static import switch in `route-family-local-docs-page-load.ts` (relative
  MDX imports do not resolve under `compileMDX`). Do not register page mounts in
  shared `mdx-components.tsx`, and do not edit renderer internals.
- Use `eventsOpenApiTurbopackLoadDependencies()` for Next/compileMDX OpenAPI
  resolution (same Turbopack-safe path as the W09 harness).
- Story 002 mounts stream roles + FactoryEvent / FactoryResponseEvent catalogs;
  story 003 adds reconnect / lifecycle / identity / JSON probe + static SSE
  sections via the same page-local `EventsCorpusMount` (still no harness chrome).
- Story 004 proves published-route success + empty/error states via page-local
  `EventsCorpusMountView` (inject resolved mount models). Assert route presence,
  corpus roles, hybrid ownership markers, and `data-sse-live-connection=false`
  — do not scan renderer trees or global inventories.
- Catalog polish close-out (examples / envelope components / short label /
  single field listing / no pointer-path chrome): assert inside the published
  success corpus render in `events-page.test.tsx`, and browser-verify with
  `bun src/content/docs/references/events/assert-events-page-catalog-polish-browser.ts`
  (unique port via `EVENTS_CATALOG_POLISH_PROBE_PORT`, kill server on exit).
  Worktrees without local `node_modules` must use the probe’s `--webpack` start
  path (Turbopack rejects parent-hoisted `next`); optionally set
  `EVENTS_CATALOG_POLISH_PROBE_BASE_URL` against an already-warm server.
- Linked component schema splay (InferenceOutcome-class deep links): build the
  transitive `$ref` closure from already-rendered FactoryEvent /
  FactoryResponseEvent catalog roots via
  `buildEventsLinkedComponentSchemas` (`src/lib/references/events/linked-component-schemas.ts`),
  exclude those already-rendered roots, and mount
  `EventLinkedComponentSchemas` from `EventsCorpusMount` after the response
  catalog. Reuse `schema-ref-closure` + `normalizeOpenApiComponentSchemaDefinition`;
  do not invent schemas and do not flip the shared `showPointerPathChrome`
  default (events keeps `EventsSchemaDefinition` local `false`). Prove anchors
  with `linked-component-schemas.test.ts` +
  `event-linked-component-schemas.test.tsx`.
- SchemaRefLink destinations must exist for every name in
  `eventsAlreadyRenderedComponentSchemaNames`: kind / phase / provenance mount
  as `EventsSchemaDefinition` in `ResponseEventMatrix`, and the payload union
  (`FactoryResponseEventPayload`) must also mount there
  (`response-event-payload-union-schema-definition`) — listing oneOf variant
  links alone is not enough for envelope `$ref` clicks. Prove same-page
  InferenceOutcome-class hrefs + hash focus + no dangling navigable refs with
  `events-schema-ref-link-resolution.test.tsx`.
- Story 003 regression (anchors + navigable SchemaRefLinks): bind to live
  packaged OpenAPI via `resolveEventCorpus()` — when `InferenceOutcome` is
  published, assert `#components-schemas-InferenceOutcome` and at least one
  `a[data-schema-ref-kind="resolved"|"cycle"]` href
  `/docs/references/events#components-schemas-InferenceOutcome` in both
  `events-inlined-component-schema-anchors.test.tsx` (corpus mount) and the
  published-route success render in `events-page.test.tsx`. Do not invent
  schemas; soft-skip only when the package drops the name.
- Story 004 browser + budget close-out: run
  `bun src/content/docs/references/events/assert-events-page-inline-schema-splay-browser.ts`
  (unique port via `EVENTS_INLINE_SPLAY_PROBE_PORT`, optional
  `EVENTS_INLINE_SPLAY_PROBE_BASE_URL`, kill server on exit; webpack start for
  worktrees). Prove hash navigation to `#components-schemas-InferenceOutcome`
  and SchemaRefLink click-traverse. Intentional linked-component splay grows
  events SSR HTML (~4.5 MiB observed); raise the focused `references-events`
  ceiling in `a11y-reference-payload-budget.ts` (~25% headroom) with measured
  evidence — do not dump unpublished schemas to inflate or shrink the page.
- Intro-strip browser close-out (story 003): the same probe also asserts
  absence of What It Covers / Key Concepts headings and ids, absence of folded
  Opening summary (`[data-testid="folded-summary"]` /
  `[data-opening-summary="folded"]`), and presence of `#event-corpus` plus
  stream operations / reconnect / static SSE markers. Do not invent a second
  Events browser harness for intro absence.
- Compose production mount like the W09 harness body: `EventsSurface` + public
  section components + `buildEventReconnectLifecycleCorpus` /
  `buildSseStaticExamplesCorpus`. Never mount `EventsVerificationHarness` on the
  published page.
- Keep resolve (`resolvePublishedEventsCorpus`) separate from presentational
  `EventsCorpusMountView` so empty/error route states are testable without
  mocking OpenAPI loaders.
- Force-clean content runtime after adding the first `reference.*` record so
  published-docs and registry generated artifacts include the new page.
- When updating `docs-catch-all-static-params` / section-index tests, expect
  `references/events` on the default locale and empty localized indexes until
  non-en message bundles ship.
- Treat the route-family `page-mdx-components` switch as a narrow shared-surface
  exception: rerun `bun run audit:canonical-page-surface` with
  `--exception-reason` and repeat the justification in the PR conversation.
