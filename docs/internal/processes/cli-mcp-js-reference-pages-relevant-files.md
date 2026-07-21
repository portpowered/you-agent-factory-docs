# W11 CLI / MCP / JavaScript Runtime Reference Pages — Relevant Files

Use these files when wiring the published
`/docs/references/{cli,mcp-reference,javascript-runtime}` pages that mount W10
public family inventories from W03-resolved / W04-normalized package artifacts.

## Ownership fence

W11 owns only:

- page bundles under `src/content/docs/references/{cli,mcp-reference,javascript-runtime}/`
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
| `src/content/docs/references/cli/assert-cli-page-intro-strip-browser.ts` | Playwright probe: inventory-first CLI page without What It Covers / Key Concepts / folded Opening summary; #153 card keep-list + under-construction Flags/arguments |
| `src/content/registry/references/cli.json` | `reference.cli` registry record |
| `src/lib/references/load-cli-reference-inventory.ts` | W03 resolve + W04 normalize → inventory input |
| `src/lib/references/cli-reference-turbopack.ts` | Webpack-safe CLI export resolution via ancestor `node_modules` + manifest join |
| `src/lib/content/route-family-local-docs-page-load.ts` | Merges page-local MDX components for references/cli |

## Key host files (MCP page — story 002)

| Path | Role |
| --- | --- |
| `src/content/docs/references/mcp-reference/page.mdx` | Published reference page structure (install-first lead, then tool inventory) at `/docs/references/mcp-reference` |
| `src/content/docs/references/mcp-reference/messages/en.json` | Default-locale copy (`MCP Reference` title; no What It Covers / Key Concepts) |
| `src/content/docs/references/mcp-reference/assets.json` | Empty baseline assets |
| `src/content/docs/references/mcp-reference/McpInstallDocsLink.tsx` | Page-local Next `Link` to `/docs/documentation/mcp` without using `messages.links` (keeps W11 projection-first `links` undefined) |
| `src/content/docs/references/mcp-reference/McpReferenceInventory.tsx` | Server mount: load inventory → `McpToolInventory` |
| `src/content/docs/references/mcp-reference/page-mdx-components.tsx` | Page-local MDX component map |
| `src/content/docs/references/mcp-reference/mcp-page.test.tsx` | Colocated route/render proof (title + explorer/nav/search chrome for `MCP Reference` on `/docs/references/mcp-reference`) |
| `src/content/docs/references/mcp-reference/assert-mcp-reference-display-rename-browser.ts` | Playwright probe: visible `MCP Reference` title, URL `/docs/references/mcp-reference`, legacy product title not live H1/title chrome |
| `src/content/registry/references/mcp-reference.json` | `reference.mcp` registry record (`slug: mcp-reference`) |
| `src/lib/references/load-mcp-reference-inventory.ts` | W03 resolve + W04 normalize → inventory input |
| `src/lib/references/mcp-reference-turbopack.ts` | Webpack-safe MCP export resolution via ancestor `node_modules` + manifest join |
| `src/lib/content/route-family-local-docs-page-load.ts` | Also merges page-local MDX for references/mcp-reference |

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
| `src/lib/references/javascript-runtime-reference-turbopack.ts` | Webpack-safe JS runtime export resolution via ancestor `node_modules` + manifest join |
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

## Cross-route proofs (story 004)

| Path | Role |
| --- | --- |
| `src/content/docs/references/published-route-states.test.tsx` | Page-owned success / empty / error / no-host / sibling-route fence proofs across the three published routes |
| `src/lib/references/cli-mcp-js-reference-turbopack.test.ts` | Ancestor `node_modules` filesystem resolution proofs (webpack-safe) |
| `src/content/docs/references/cli-mcp-js-static-export-success.test.ts` | Post-`make build` `out/` HTML asserts `data-inventory-state="success"` (production integration) |

Page mounts accept an optional `inventory` override solely so empty/error proofs can render the same W10 status surface the production MDX path uses, without mocking modules or scanning renderer trees.

## Patterns

- Pass already-normalized inventory props into client inventory components; never
  import W03 Node acquisition into browser bundles.
- Prove published-route empty/error through the page mount components with an
  injected inventory input; do not re-test W10 chrome internals or scan foreign
  renderer trees for ownership fences — assert unpublished sibling routes via
  `source.getPage` instead.
- Prefer webpack-safe `resolveExport` via ancestor `node_modules` walk
  (`resolveApiPackageManifestFsPath` from `load-schema-verification-models.ts`)
  then join to sibling JSON under `generated/`. Do **not** use
  `createRequire(...).resolve("@you-agent-factory/api/manifest")` — webpack
  production server chunks stub it with MODULE_NOT_FOUND. CLI uses
  `generated/cli/commands.json`; MCP uses `generated/mcp/tools.json`; JavaScript
  runtime uses `generated/javascript/runtime-api.json` (public subpath
  `javascript/runtime`). Prove shipped success with the production-integration
  `out/` HTML assertion, not Bun-side loader tests alone.
- Non-API reference pages stay projection-first: keep a short lead + primary
  inventory mount; do **not** remount How To Use, Limits And Assumptions,
  Related (`RelatedDocs` + `LocalizedLinkList`), Tags (`TagPillList`), or
  References (`CitationList`). Shared proofs live in
  `published-route-states.test.tsx` (assert removed section keys + headings
  absent; inventory success for static no-host safety; keep `messages.links`
  undefined). CLI inventory-first repair omits `openingSummary` (and drops
  What It Covers / Key Concepts) so `DocsOpeningSummary` mounts nothing and
  the page opens on Command Inventory. JavaScript runtime clears
  `openingSummary` to `""` so folded Opening summary chrome does not mount
  (empty text returns null). Do not require CLI or JS `openingSummary` to
  match `/without a live Factory host/i`; MCP may still keep that lead.
  MCP polish replaces What It Covers / Key Concepts with an install-first
  `how-to-install` section and a page-local
  `McpInstallDocsLink` (not `messages.links`) to `/docs/documentation/mcp`.
  JS intro-strip removes What It Covers / Key Concepts entirely and keeps the
  #159 keep-list (glossary, overall usage example, Runtime Inventory) as the
  first content. Page-local `javascript-runtime-page.test.tsx` asserts intro
  absence via `queryByRole` / `getElementById` null, undefined
  `sections.whatItCovers` / `sections.keyConcepts`, and empty
  `openingSummary` (MCP #156 pattern)—while still proving glossary, overall
  example, inventory success, and #159 chrome trim. Shared
  `published-route-states.test.tsx` scopes the live-host-free
  `openingSummary` assert to MCP only so CLI and JS may clear the summary.
  Browser-verify JS keep-list-first shape with
  `bun src/content/docs/references/javascript-runtime/assert-javascript-runtime-polish-browser.ts`
  (webpack `bun run dev`, unique port, Playwright): assert absent What It
  Covers / Key Concepts headings and `#what-it-covers` / `#key-concepts`,
  absent folded Opening summary (`[data-opening-summary]` /
  `[data-testid="folded-summary"]`), and present glossary / overall example /
  inventory success / TOC `#symbols` / `#shared-schemas` / #159 chrome trim.
  Page-local `mcp-page.test.tsx` should also prove a representative published
  tool card keeps title/anchor/description/schema/example while omitting
  `data-contract-source-badge`, Handler registered / Tool id rows, Object
  policy, and the generated-example notice. Do not assert absence of the
  filter `queryLabel` default `"Tool name"` — that label is inventory filter
  chrome, not card-body metadata.
- Browser-verify the trimmed shape after `bun run build` with
  `bun run start -- -p <3100-3999>` (unique port), then fetch sampled routes
  (one inventory page, events, one schema) and assert: section ids
  `how-to-use` / `limits-and-assumptions` / `related` / `tags` / `references`
  absent; primary projection markers present
  (`data-inventory-state="success"`, `data-events-status="success"`,
  `data-schema-status="ready"`). Confirm `/docs/references/api` still keeps
  How To Use / Limits chrome and Program documentation sidebar grouping is
  unchanged. Kill the server before exit; prefer a Bun fetch script over shell
  functions when PATH is unreliable in nested functions.
- MCP polish browser-verify on `/docs/references/mcp-reference` (SSR HTML is enough —
  inventory mounts server-side): assert `MCP Reference`,
  `#how-to-install` / `you mcp serve` / `/docs/documentation/mcp`,
  `data-inventory-state="success"`, `data-reference-inventory-filter`,
  `data-mcp-tool-reference` + `data-mcp-input-schema` + `data-mcp-tool-example`;
  assert absent `What It Covers` / `Key Concepts` / `lists every published` /
  `data-contract-source-badge` / `Handler registered` / `Object policy` /
  `data-mcp-example-generated-notice`. Smoke sibling CLI + javascript-runtime
  routes still return HTTP 200.
- MCP display-rename browser-verify (title chrome only):
  `bun src/content/docs/references/mcp-reference/assert-mcp-reference-display-rename-browser.ts`
  (webpack `bun run dev`, unique port 3588 default, Playwright; kill server on
  exit). Assert visible H1/document title `MCP Reference`, path
  `/docs/references/mcp-reference`, inventory success, and that
  `You Agent Factory MCP` is not the live H1/document title (alias-only is
  fine). Prefer `MCP_REFERENCE_RENAME_PROBE_BASE_URL` when a server is warm.
  Page-owned `mcp-page.test.tsx` also locks explorer page-tree name + search
  document title to `MCP Reference` while keeping the legacy string as a
  frontmatter alias.
- CLI intro-strip browser-verify on `/docs/references/cli`:
  `bun src/content/docs/references/cli/assert-cli-page-intro-strip-browser.ts`
  (webpack `next dev`, unique port 3578 default, Playwright; kill server on
  exit). Assert absent What It Covers / Key Concepts / `#what-it-covers` /
  `#key-concepts` / `[data-testid="folded-summary"]` /
  `[data-opening-summary="folded"]`; assert Command Inventory +
  `data-inventory-state="success"` + representative `#you-config-init` card
  keep-list (header, example, under-construction Flags/arguments — no invented
  option rows). Prefer `CLI_INTRO_STRIP_PROBE_BASE_URL` when a server is warm.
- Rely on W05 nested discovery + page frontmatter; do not edit a shared
  references family index.
- Each new references page needs its own static
  `import("@/content/docs/references/<slug>/page-mdx-components")` branch in
  `route-family-local-docs-page-load.ts`.
- JavaScript runtime success inventories require at least one symbol or shared
  schema after W04 normalize; empty means both collections are empty.
