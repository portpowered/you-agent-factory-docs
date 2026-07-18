# Event-Stream / Event-Corpus Renderer (W09) Relevant Files

Use these files when implementing or extending the production event-stream /
event-corpus renderer for the locked W02 hybrid placement.

## Ownership fence

W09 owns the production events UI under `src/components/references/events/`
plus focused lib helpers/tests under `src/lib/references/events/`. Do **not**:

- reopen integrated vs separate vs hybrid placement (W02 gate selected hybrid)
- ship W02 spike routes (`/spikes/sse-*`) as the production events experience
- edit `src/components/references/api/` (W08), `src/components/references/schema/`
  (W07), overlay validators (W06), or CLI/MCP/JS family dirs (W10)
- own final `/docs/references/events` MDX page/nav/search inventories (W11+)
- permanently pin `@fumadocs/asyncapi` without a measured production need
- hand-edit generated AsyncAPI or patch `node_modules`
- open live EventSource/fetch streams or add proxy routes from this surface

## Hybrid ownership split

| Owner | Responsibility |
| --- | --- |
| W09 events corpus | Full FactoryEvent / FactoryResponseEvent envelopes, discriminator payload catalog, navigation, search documents, client-facing reconnect/lifecycle docs, static SSE examples |
| W08 API operation page | HTTP transport reconnect/cursor/handshake/dual-Accept/replay/compatibility semantics; summarize streams with links into events anchors |
| OpenAPI package | Event truth (`@you-agent-factory/api/openapi`, including `x-event-schema`) |
| AsyncAPI | Optional generated projection only — never a second authored corpus |

## Key host files (story 001 — ownership surface)

| Path | Role |
| --- | --- |
| `src/components/references/events/index.ts` | Public barrel for the W09 events UI ownership surface |
| `src/components/references/events/types.ts` | Status vocabulary (`loading` / `empty` / `error` / `success`) |
| `src/components/references/events/events-status.tsx` | Accessible loading/empty/error status messaging |
| `src/components/references/events/events-surface.tsx` | Boundary that short-circuits non-success statuses or renders success children with hybrid ownership markers |
| `src/components/references/events/events-surface.test.tsx` | Status semantics + ownership marker proofs |
| `src/lib/references/events/index.ts` | Public barrel for W09 events lib helpers |
| `src/lib/references/events/stream-operations.ts` | Production SSE operation inventory + roles (migrated from W02 spike) |
| `src/lib/references/events/hybrid-placement.ts` | Locked hybrid placement + ownership split constants |
| `src/lib/references/events/asyncapi-dependency-policy.ts` | No permanent `@fumadocs/asyncapi` pin + upgrade-risk notes |
| `src/lib/references/events/events-lib.test.ts` | Inventory migration, hybrid lock vs W02 gate, AsyncAPI policy proofs |

## Key host files (story 002 — OpenAPI event truth + fail-closed inventory)

| Path | Role |
| --- | --- |
| `src/lib/references/events/load-events-openapi.ts` | Load packaged OpenAPI via W03 `resolveApiPackageArtifact("@you-agent-factory/api/openapi")` |
| `src/lib/references/events/openapi-document.ts` | Minimal OpenAPI shapes + SSE status/media-type constants |
| `src/lib/references/events/select-event-streams.ts` | Select streams by path/operation/status/`text/event-stream`/`x-event-schema` |
| `src/lib/references/events/schema-ref-closure.ts` | Transitive `$ref` closure for selected payload roots |
| `src/lib/references/events/event-semantic-inventory.ts` | Source hash, discriminator/payload counts, fail-closed drift/unresolved-ref gates |
| `src/lib/references/events/project-events-asyncapi.ts` | Optional source-hashed AsyncAPI projection (never a second authored corpus) |
| `src/lib/references/events/event-schema-targets.ts` | W04 `SchemaAddress` / anchor targets for payload roots |
| `src/lib/references/events/resolve-event-corpus.ts` | Orchestrate load → select → inventory → optional projection → W04 targets |
| `src/lib/references/events/events-openapi-turbopack.ts` | Turbopack-safe `resolveExport` for Next server pages (manifest → `generated/openapi/openapi.yaml` sibling join) |
| `src/lib/references/events/events-openapi-resolution.test.ts` | W03 load, selection, inventory drift, unresolved refs, AsyncAPI projection, W04 anchors |

## Key host files (story 003 — stream roles / canonicality)

| Path | Role |
| --- | --- |
| `src/components/references/events/event-stream-display.ts` | Pure canonicality + summary model helpers (`eventCanonicalityPresentationForRole`, `eventStreamOperationSummaryModelsFromCorpus`) |
| `src/components/references/events/event-canonicality-badge.tsx` | Accessible role badge: Canonical/Ephemeral/Compatibility-only + Preferred/Not preferred (+ Non-canonical / Not canonical replay) |
| `src/components/references/events/event-stream-operation-summary.tsx` | One stream summary: path/method, payload root, catalog deep link, role notices |
| `src/components/references/events/event-stream-operations-list.tsx` | Ordered list (canonical → ephemeral → compatibility-only) |
| `src/components/references/events/events-verification-harness.tsx` | Non-production harness chrome for browser / RTL proofs |
| `src/app/(dev)/events-renderer-harness/page.tsx` | Dev harness route `/events-renderer-harness` (hidden in prod unless `ENABLE_EVENTS_RENDERER_HARNESS=1`) |
| `src/components/references/events/event-stream-operations.test.tsx` | Role labeling + live OpenAPI three-stream proofs |

## Key host files (story 004 — FactoryEvent envelope + discriminator catalog)

| Path | Role |
| --- | --- |
| `src/lib/references/events/factory-event-catalog.ts` | Build FactoryEvent envelope + discriminator → payload catalog from packaged OpenAPI (W04 normalize via `normalizeJsonSchemaArtifact`) |
| `src/components/references/events/event-envelope-reference.tsx` | Shared FactoryEvent envelope fields via W07 `SchemaDefinition` (composition stripped) |
| `src/components/references/events/event-discriminator-map.tsx` | Live `type` → payload schema map with payload-variant deep links |
| `src/components/references/events/event-payload-variant.tsx` | One payload-only variant (explicitly not a complete envelope) |
| `src/components/references/events/event-payload-catalog.tsx` | All mapped payload variants with schema-backed fields |
| `src/components/references/events/factory-event-catalog-section.tsx` | Compose envelope + map + payload catalog |
| `src/components/references/events/factory-event-catalog.test.tsx` | Live inventory + envelope/payload-only UI proofs |

## Key host files (story 005 — FactoryResponseEvent envelope + dimensions)

| Path | Role |
| --- | --- |
| `src/lib/references/events/factory-response-event-catalog.ts` | Build FactoryResponseEvent envelope + kind/phase/provenance + oneOf payload catalog from packaged OpenAPI |
| `src/components/references/events/response-event-envelope-reference.tsx` | Shared FactoryResponseEvent envelope fields via W07 `SchemaDefinition` (ephemeral marker) |
| `src/components/references/events/response-event-matrix.tsx` | Kind / phase / provenance / payload dimensions without claiming Cartesian validity |
| `src/components/references/events/response-event-payload-variant.tsx` | One payload oneOf shape (payload-only + ephemeral) |
| `src/components/references/events/response-event-payload-catalog.tsx` | All oneOf payload shapes with schema-backed fields |
| `src/components/references/events/factory-response-event-catalog-section.tsx` | Compose envelope + matrix + payload catalog |
| `src/components/references/events/factory-response-event-catalog.test.tsx` | Live inventory + ephemeral / non-Cartesian UI proofs |

## Key host files (story 006 — reconnect / identity / lifecycle)

| Path | Role |
| --- | --- |
| `src/lib/references/events/event-reconnect-lifecycle.ts` | Build reconnect cursors, identity handshake, lifecycle, JSON reconnect-probe models from packaged OpenAPI |
| `src/components/references/events/event-reconnect-contract.tsx` | Cursor params + `after_event_id` precedence |
| `src/components/references/events/event-identity-handshake.tsx` | `X-Factory-Session-*` headers + stream-generation invalidation |
| `src/components/references/events/event-stream-lifecycle.tsx` | Retained history, keepalive, `STREAM_GAP`, stale-cursor recovery |
| `src/components/references/events/event-json-reconnect-probe.tsx` | `Accept: application/json` → `FactorySessionEventStreamRecovery` outcomes |
| `src/components/references/events/event-reconnect-lifecycle-section.tsx` | Compose reconnect/identity/lifecycle/probe docs |
| `src/components/references/events/event-reconnect-lifecycle.test.tsx` | Live OpenAPI + UI proofs (no W08 OpenAPI UI re-implementation) |

## Related spike (do not ship as production)

| Path | Role |
| --- | --- |
| `src/lib/references-sse-asyncapi-spike/` | Non-production W02 investigation (placement gate, temporary AsyncAPI pin, spike chrome) |
| `src/app/(dev)/spikes/sse-*` | Dev-only spike routes — not the production events experience |

## Patterns

- Mirror W07 `SchemaSurface` / `SchemaStatus` for explicit loading/empty/error/
  success messaging — never blank UI or silent failure.
- Migrate reusable spike helpers into `src/lib/references/events/` rather than
  importing spike chrome into production pages.
- Keep tests that compare production lock constants against the W02 decision
  gate in the lib test file (production runtime should not re-open placement).
- Load event truth only through W03 `resolveApiPackageArtifact` /
  `loadEventsOpenApi` (`@you-agent-factory/api/openapi`). Never package-root,
  package-internal `generated/...`, or `node_modules` patches.
- Select SSE streams by path → GET → response `200` → `text/event-stream` →
  `x-event-schema`. Reject hard-coded schema-name-only selection.
- Treat AsyncAPI as optional generated projection only (`projectEventsOpenApiToAsyncApi`);
  carry source hash + generated-file notice; fail closed on unresolved `$ref`s
  and semantic inventory drift via `event-semantic-inventory.ts`.
- Map payload roots to W04 `SchemaAddress` / anchors with
  `event-schema-targets.ts` — do not invent a second event schema corpus.
- Prefer `resolveEventCorpus()` as the build/server orchestration entry for
  later catalog UI stories.
- Preferred session-stream marking is **canonical only**
  (`isPreferredEventStreamRole` / `EventCanonicalityBadge`). SelectedOpenAPI
  `preferred: true` for ephemeral means “not compatibility-only” — do not
  confuse that inventory flag with the UI “Preferred” badge.
- Browser-verify stream roles via `/events-renderer-harness` (dev) with a unique
  port and `curl --max-time 60` (SSR can be slow under Turbopack).
- Next/Turbopack pages must pass `eventsOpenApiTurbopackLoadDependencies()` into
  `resolveEventCorpus({ loadDependencies })` — Bun's default `import.meta.resolve`
  is not available under Turbopack (`__TURBOPACK__import$2e$meta__.resolve is not a function`),
  and `Bun.YAML.parse` is unavailable under Next's Node server (inject the portable
  `yaml` package parser). Unit tests under `bun test` can keep the default resolver.
- Build FactoryEvent catalog via `buildFactoryEventCatalog(doc)` — normalizes each
  `components.schemas` entry with `normalizeJsonSchemaArtifact` at
  `/components/schemas/<name>` pointers. Strip envelope `composition` when rendering
  `EventEnvelopeReference` so `EventDiscriminatorMap` owns mapping chrome.
- Payload variants must set `data-event-payload-only="true"` and never present
  payload-only schemas as complete FactoryEvent envelopes.
- Build FactoryResponseEvent catalog via `buildFactoryResponseEventCatalog(doc)` —
  kind/phase enums + provenance object + payload `oneOf` shapes. Always set
  `cartesianCombinationsValid: false` and `ephemeral: true`; ResponseEventMatrix
  must not imply every kind × phase × payload combination is valid.
- Response-event payload variants use `data-event-ephemeral="true"` plus
  `data-event-payload-only="true"` and must never be presented as canonical
  FactoryEvent replay state.
- Build reconnect/lifecycle docs via `buildEventReconnectLifecycleCorpus(doc)` —
  cursor params from OpenAPI `$ref` parameters, handshake headers from 200
  response headers, JSON probe from dual-Accept `application/json` +
  `FactorySessionEventStreamRecovery` outcome enum. Mark
  `httpTransportOwnership: "api-operation-page"` and link toward API anchors;
  do not re-implement W08 OpenAPI UI or pin Fumadocs OpenAPI here.
