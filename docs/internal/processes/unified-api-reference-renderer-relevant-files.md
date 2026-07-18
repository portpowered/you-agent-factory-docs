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
| `src/components/references/api/index.ts` | Public barrel for the W08 API UI ownership surface |
| `src/components/references/api/ownership.ts` | Ownership root + forbidden-tree fence helpers |
| `src/components/references/api/ownership.test.ts` | Ownership root presence + fence proofs |
| `src/components/references/api/types.ts` | Status vocabulary for loading/empty/invalid/unsupported/ready |
| `src/components/references/api/api-status.tsx` | Accessible non-ready status messaging |
| `src/components/references/api/api-surface.tsx` | Boundary that short-circuits non-ready statuses or renders ready children |
| `src/components/references/api/api-surface.test.tsx` | Status semantics proofs for the ownership boundary |
| `src/lib/references/api-package-artifact-resolver.ts` | W03 public-subpath acquisition — later stories feed OpenAPI through this surface |
| `src/lib/references-openapi-spike/` | Merged W01 non-production spike — donor of reusable helpers only |

## Patterns

- Keep production API UI under `src/components/references/api/` so ownership
  stays separate from spikes, schema UI, events, and family renderers.
- Treat `dependency-selection.ts` as the source of truth for production pins;
  do not re-litigate temporary spike status constants as production policy.
- Non-ready outcomes must be explicit and accessible (`role="status"`,
  `aria-live="polite"`, `aria-busy` when loading).
- Prefer migrating helpers from the W01 spike into this tree over editing the
  spike in place.
- Later stories: single-page OpenAPI projection, tag nav, filtering, anchors,
  request/response rendering, playground suppression, hybrid SSE summaries,
  theme/code-copy, and responsive/a11y/print verification.

## Focused verification

```bash
bun test src/components/references/api/dependency-selection.test.ts \
  src/components/references/api/ownership.test.ts \
  src/components/references/api/api-surface.test.tsx
```
