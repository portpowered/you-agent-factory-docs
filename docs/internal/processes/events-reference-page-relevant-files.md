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
| `src/content/docs/references/events/EventsCorpusMount.tsx` | Page-local OpenAPI corpus resolve + EventsSurface mount |
| `src/content/docs/references/events/page-mdx-components.tsx` | Registers `EventsCorpusMount` for compileMDX |
| `src/content/docs/references/events/events-page.test.tsx` | Colocated route/render + corpus mount proof |
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
- Compose production mount like the W09 harness body: `EventsSurface` + public
  section components + `buildEventReconnectLifecycleCorpus` /
  `buildSseStaticExamplesCorpus`. Never mount `EventsVerificationHarness` on the
  published page.
- Force-clean content runtime after adding the first `reference.*` record so
  published-docs and registry generated artifacts include the new page.
- When updating `docs-catch-all-static-params` / section-index tests, expect
  `references/events` on the default locale and empty localized indexes until
  non-en message bundles ship.
- Treat the route-family `page-mdx-components` switch as a narrow shared-surface
  exception: rerun `bun run audit:canonical-page-surface` with
  `--exception-reason` and repeat the justification in the PR conversation.
