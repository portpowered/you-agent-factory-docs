# References SSE / AsyncAPI spike — relevant files

Non-production W02 SSE renderer investigation helpers. Do not treat this tree as
the shipped `/docs/references/api` or `/docs/references/events` surface.

## Spike inventory and safety

- `src/lib/references-sse-asyncapi-spike/sse-operations.ts` — the three SSE
  operations (`canonical` session events, `ephemeral` response-events,
  `compatibility-only` `GET /events`), document id, route, and the no-live-
  connection / no-proxy / no-playground safety contract.
- `src/lib/references-sse-asyncapi-spike/load-packaged-openapi.ts` — filesystem
  lookup of installed `node_modules/@you-agent-factory/api` verifying
  `exports["./openapi"]` → `generated/openapi/openapi.yaml`. Do not
  `require.resolve` / `import` the YAML export under Next/Turbopack (MDX tries
  to parse YAML as JS). Reads bytes without rewriting SSE operations or
  `x-event-schema`.
- `src/lib/references-sse-asyncapi-spike/observe-sse-operations.ts` — pure
  observers that prove the packaged document still exposes
  `text/event-stream` + `x-event-schema` for each inventory operation.
- `src/lib/references-sse-asyncapi-spike/native-sse-render-evidence.ts` —
  cites unmodified media-type objects and classifies native display
  (`plain-string-schema`) plus `x-event-schema` handling (`ignored` for
  fumadocs-openapi@10.10.3). Includes an HTML probe helper for spike-route
  verification.
- `src/lib/references-sse-asyncapi-spike/create-sse-spike-openapi.ts` —
  `createOpenAPI` + `createAPIPage` with `playground.enabled: false` and no
  `proxyUrl`.
- `src/lib/references-sse-asyncapi-spike/SseSpikeSurfaceChrome.tsx` — role
  labels and safety copy for the spike surface.
- `src/app/(dev)/spikes/sse-openapi/page.tsx` — isolated spike route
  (`/spikes/sse-openapi`). Gated with `notFound()` in production unless
  `ENABLE_SSE_OPENAPI_SPIKE=1` (same pattern as component-examples).

## Temporary install policy

- Spike may add exact `fumadocs-openapi@10.10.3` and required peers (for example
  `@scalar/api-client-react`) for render evidence.
- Spike may add exact `@fumadocs/asyncapi@0.2.1` (and portable `yaml` for Next/
  Node OpenAPI parse) for AsyncAPI render evidence.
- Do not treat those pins as the final production OpenAPI/AsyncAPI dependency
  set (W08 decides after W01/W02).
- Do not own or rewrite W01 files under `src/lib/references-openapi-spike/`.

## Testing gotcha

- `bunfig.toml` preloads happy-dom for unit tests. happy-dom's `URL` polyfill
  breaks `@apidevtools/json-schema-ref-parser` filesystem resolution inside
  `fumadocs-openapi` `processDocument`. Prove packaged OpenAPI load with a
  plain Bun subprocess (`prove-create-openapi-load.ts`) instead of calling
  `server.getSchema()` under happy-dom.

## Investigation evidence

- Narrative findings: `docs/temp/references/sse-renderer-investigation.md`
  (gitignored local planner state). Commit machine-checkable spike helpers and
  tests; keep long-form measurements under `docs/temp/references/`.
- Native `text/event-stream` / `x-event-schema` evidence helpers:
  `src/lib/references-sse-asyncapi-spike/native-sse-render-evidence.ts` (+
  `native-sse-render-evidence.test.ts`, subprocess
  `prove-native-sse-render-evidence.ts`). Classification for
  fumadocs-openapi@10.10.3: plain-string-schema display; `x-event-schema`
  ignored (retained on the media type, not shown or traversed in the UI).
- FactoryEvent / FactoryResponseEvent discoverability helpers:
  `src/lib/references-sse-asyncapi-spike/event-schema-discoverability.ts` (+
  `event-schema-discoverability.test.ts`). Records contract facts on
  `components.schemas` (FactoryEvent `type` discriminator mappings present;
  FactoryResponseEvent kind/phase/`oneOf` without a simple type discriminator)
  versus native SSE render discoverability (`not-discoverable` while
  `x-event-schema` is ignored). Role markers on `SseSpikeSurfaceChrome` keep
  canonical / ephemeral / compatibility-only distinguishable.
- Temporary AsyncAPI projector selection path (story 004):
  `src/lib/references-sse-asyncapi-spike/select-sse-streams.ts` selects SSE
  streams by path / operation / response status / `text/event-stream` and
  resolves payload roots from `x-event-schema` (never hard-coded schema names).
  Compatibility `GET /events` is projected but labeled
  `compatibility-only-non-preferred`. Focused tests:
  `project-openapi-to-asyncapi.test.ts`.
- Temporary AsyncAPI projector closure / inventory (story 005):
  `src/lib/references-sse-asyncapi-spike/collect-schema-ref-closure.ts` walks
  the full transitive `#/components/schemas/...` graph from selected
  `x-event-schema` roots and deep-clones reachable schemas (descriptions,
  formats, enums, oneOf/allOf, discriminators, examples, vendor extensions).
  `src/lib/references-sse-asyncapi-spike/projection-inventory.ts` emits SHA-256
  source hash, per-operation semantic inventory (operation identity, root
  event schema, event-type count, payload-variant count, unresolved-ref
  count), and fail-closed checks for missing roots, unresolved transitive
  `$ref`s, and inventory drift. `project-openapi-to-asyncapi.ts` embeds
  `components.schemas`, `x-openapi-source-hash`, `x-generated-file-notice`,
  and `x-semantic-inventory` on the regenerated AsyncAPI document. Focused
  tests: `projection-inventory.test.ts`. Callers must pass `sourceText` (or
  `sourceHash`) into `projectOpenApiSseToAsyncApi`.
- Envelope attachment / no invented discriminator (story 006):
  `src/lib/references-sse-asyncapi-spike/envelope-projection-rules.ts` keeps
  AsyncAPI message `payload.$ref` on the `x-event-schema` envelope root
  (`x-envelope-attachment: envelope-attached`). FactoryEvent `type`
  discriminator mappings stay on the envelope schema; mapping-target payload
  schemas are never emitted as standalone complete event messages.
  FactoryResponseEvent messages document kind/phase/structural payload
  selection (`x-payload-selection-rule`) and set
  `x-invented-discriminator: false` — projection never adds a missing
  discriminator. `projectOpenApiSseToAsyncApi` runs
  `assertEnvelopeProjectionRules` and returns `envelopeEvidence`. Focused
  tests: `envelope-projection-rules.test.ts`.
- `@fumadocs/asyncapi` render + information loss (story 007): temporary pin
  `@fumadocs/asyncapi@0.2.1` (not a permanent production pin). Server helper
  `create-sse-spike-asyncapi.ts` regenerates AsyncAPI from packaged OpenAPI and
  binds `createAsyncAPI` for load proofs. UI must use client component
  `SseAsyncApiSpikeRenderer.tsx` because `createAsyncAPIPage` cannot be called
  from a Server Component. Parse OpenAPI YAML with portable
  `parse-openapi-yaml.ts` (`yaml` package) — `Bun.YAML` is unavailable under
  Next's Node server. Route: `/spikes/sse-asyncapi`. Evidence helpers:
  `asyncapi-render-evidence.ts`, `projection-information-loss.ts` (records
  lost reconnect/cursor/dual-Accept/headers/retained-history/stream-generation
  semantics; compatibility-only partially preserved as channel label). Never
  hand-edit generated AsyncAPI to paper over gaps. Focused tests:
  `projection-information-loss.test.ts` (+ subprocess
  `prove-create-asyncapi-load.ts`).
- Custom catalog + placement comparison (story 008): schema-backed catalog from
  packaged OpenAPI via `build-event-catalog-fixture.ts` +
  `EventCatalogFixtureView.tsx` + `load-packaged-event-catalog.ts`. Separate
  route `/spikes/sse-catalog`. Hybrid route `/spikes/sse-placement-hybrid`
  injects the catalog beside each operation using the **documented**
  `content.renderOperationLayout` hook only
  (`create-sse-spike-hybrid-openapi.tsx`). Hooks evaluation:
  `openapi-renderer-hooks-evaluation.ts` (reject undocumented internals unless
  an adapter + upgrade test is explicitly recorded). Placement cost evidence:
  `placement-comparison-evidence.ts` (HTML bytes, nav stops, desktop/phone
  a11y notes). Focused tests: `placement-comparison-evidence.test.ts`,
  `create-sse-spike-hybrid-openapi.test.ts`.
