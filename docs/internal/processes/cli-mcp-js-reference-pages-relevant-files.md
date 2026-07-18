# W11 CLI / MCP / JavaScript Runtime Reference Pages — Relevant Files

Use these files when wiring the published `/docs/references/{cli,mcp,javascript-runtime}`
pages that mount W10 public family inventories from W03-resolved / W04-normalized
package artifacts.

## Ownership fence

W11 owns only:

- page bundles under `src/content/docs/references/{cli,mcp,javascript-runtime}/`
- matching `reference.*` registry records under `src/content/registry/references/`
- page-local tests, messages, assets, and MDX component mounts
- minimal additive loader wiring so those pages resolve and validate

Do **not**:

- edit renderer internals under `src/components/references/{cli,mcp,javascript}/`,
  `schema/`, `api/`, or `events/`
- create sibling `/docs/references` index, `/docs/references/api`,
  `/docs/references/events`, or schema pages
- edit shared nav / sidebar / search / sitemap / compat inventories (W15–W18)
- edit a contended shared references `meta.json` / family index
- touch `src/content/docs/factories/**`, `workers/**`, or `workstations/**`
- import `@you-agent-factory/api` package root or package-internal paths
- patch `node_modules`

## Key host files (CLI page — story 001)

| Path | Role |
| --- | --- |
| `src/content/docs/references/cli/page.mdx` | Published reference page structure |
| `src/content/docs/references/cli/messages/en.json` | Default-locale copy |
| `src/content/docs/references/cli/assets.json` | Empty baseline assets |
| `src/content/docs/references/cli/CliReferenceInventory.tsx` | Server mount: load inventory → `CliCommandInventory` |
| `src/content/docs/references/cli/page-mdx-components.tsx` | Page-local MDX component map |
| `src/content/docs/references/cli/cli-page.test.tsx` | Colocated route/render proof |
| `src/content/registry/references/cli.json` | `reference.cli` registry record |
| `src/lib/references/load-cli-reference-inventory.ts` | W03 resolve + W04 normalize → inventory input |
| `src/lib/references/cli-reference-turbopack.ts` | Turbopack-safe CLI export resolution via manifest |
| `src/lib/content/route-family-local-docs-page-load.ts` | Merges page-local MDX components for references/cli |

## Key host files (MCP page — story 002)

| Path | Role |
| --- | --- |
| `src/content/docs/references/mcp/page.mdx` | Published reference page structure |
| `src/content/docs/references/mcp/messages/en.json` | Default-locale copy |
| `src/content/docs/references/mcp/assets.json` | Empty baseline assets |
| `src/content/docs/references/mcp/McpReferenceInventory.tsx` | Server mount: load inventory → `McpToolInventory` |
| `src/content/docs/references/mcp/page-mdx-components.tsx` | Page-local MDX component map |
| `src/content/docs/references/mcp/mcp-page.test.tsx` | Colocated route/render proof |
| `src/content/registry/references/mcp.json` | `reference.mcp` registry record |
| `src/lib/references/load-mcp-reference-inventory.ts` | W03 resolve + W04 normalize → inventory input |
| `src/lib/references/mcp-reference-turbopack.ts` | Turbopack-safe MCP export resolution via manifest |
| `src/lib/content/route-family-local-docs-page-load.ts` | Also merges page-local MDX for references/mcp |

## Key host files (JavaScript runtime page — story 003)

| Path | Role |
| --- | --- |
| `src/content/docs/references/javascript-runtime/page.mdx` | Published reference page structure |
| `src/content/docs/references/javascript-runtime/messages/en.json` | Default-locale copy |
| `src/content/docs/references/javascript-runtime/assets.json` | Empty baseline assets |
| `src/content/docs/references/javascript-runtime/JavascriptRuntimeReferenceInventory.tsx` | Server mount: load inventory → `JavaScriptRuntimeInventory` |
| `src/content/docs/references/javascript-runtime/page-mdx-components.tsx` | Page-local MDX component map |
| `src/content/docs/references/javascript-runtime/javascript-runtime-page.test.tsx` | Colocated route/render proof |
| `src/content/registry/references/javascript-runtime.json` | `reference.javascript-runtime` registry record |
| `src/lib/references/load-javascript-runtime-reference-inventory.ts` | W03 resolve + W04 normalize → inventory input |
| `src/lib/references/javascript-runtime-reference-turbopack.ts` | Turbopack-safe JS runtime export resolution via manifest |
| `src/lib/content/route-family-local-docs-page-load.ts` | Also merges page-local MDX for references/javascript-runtime |

## Additive registry / published-docs wiring

| Path | Role |
| --- | --- |
| `src/lib/content/content-paths.ts` | `references` in `REGISTRY_COLLECTIONS` |
| `src/lib/content/registry.ts` | Disk loader for `referenceRecordSchema` under `registry/references/` |
| `src/lib/content/published-docs-registry-contract.ts` | `references` in `PUBLISHED_DOCS_SECTIONS` + href routing |
| `src/lib/content/content-hrefs.ts` | `referencePageHref` |
| `src/lib/content/registry-linking.ts` | Reference records are linkable when published |
| `src/lib/factory/canonical-page-surface-audit.ts` | `reference` → `references` registry directory |

## Upstream dependencies (consume, do not reimplement)

| Path | Role |
| --- | --- |
| `src/components/references/cli/` | Public W10 CLI inventory surfaces |
| `src/components/references/mcp/` | Public W10 MCP inventory surfaces |
| `src/components/references/javascript/` | Public W10 JavaScript runtime inventory surfaces |
| `src/lib/references/normalize-family-artifacts.ts` | `normalizeCliCommandsFromArtifact`, `normalizeMcpToolsFromArtifact`, `normalizeJavascriptSymbolsFromArtifact`, `normalizeJavascriptSharedSchemasFromArtifact` |
| `src/lib/references/api-package-artifact-resolver.ts` | W03 acquisition |
| `src/lib/references/reference-search-projection.ts` | `REFERENCE_FAMILY_PAGE_PATHS.{cli,mcp,javascript}` |

## Patterns

- Pass already-normalized inventory props into client inventory components; never
  import W03 Node acquisition into browser bundles.
- Prefer Turbopack-safe `resolveExport` via package `manifest` → sibling JSON
  (same pattern as schema verification / events OpenAPI). CLI uses
  `generated/cli/commands.json`; MCP uses `generated/mcp/tools.json`; JavaScript
  runtime uses `generated/javascript/runtime-api.json` (public subpath
  `javascript/runtime`).
- Keep curated discovery under `#related` with `LocalizedLinkList` for authored
  docs and planned sibling reference routes; `RelatedDocs` stays for when
  reference records participate in the related-docs runtime.
- Rely on W05 nested discovery + page frontmatter; do not edit a shared
  references family index.
- Each new references page needs its own static
  `import("@/content/docs/references/<slug>/page-mdx-components")` branch in
  `route-family-local-docs-page-load.ts`.
- JavaScript runtime success inventories require at least one symbol or shared
  schema after W04 normalize; empty means both collections are empty.
