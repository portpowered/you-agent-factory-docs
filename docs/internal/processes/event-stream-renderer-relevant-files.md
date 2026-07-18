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
- Prefer `@you-agent-factory/api/openapi` public subpath resolution (W03) in
  later stories — never package-root or package-internal imports.
