# CLI, MCP, and JavaScript Reference Renderers (W10) Relevant Files

Use these files when implementing or extending W10 family reference renderers
that consume W03-resolved / W04-normalized CLI, MCP, and JavaScript projections.

## Ownership fence

W10 owns family renderer surfaces under `src/components/references/{cli,mcp,javascript}/`
plus allowed shared chrome helpers under `src/components/references/shared/`
(and focused harness mounts). Do **not**:

- build W06 overlay validators or W07 shared schema-tree primitive modules
- build W08 OpenAPI production pages or W09 event renderers
- wire final `/docs/references/{cli,mcp,javascript-runtime}` routes, nav, or
  Orama search inventories (leave to W11/W16)
- import `@you-agent-factory/api` package root or package-internal paths
- patch `node_modules`
- invent structured CLI flags/arguments or unlabeled generated MCP examples

## Key host files (shared chrome — story 001)

| Path | Role |
| --- | --- |
| `src/components/references/shared/types.ts` | Projection-oriented chrome prop contracts + `ReferenceVisibility` |
| `src/components/references/shared/reference-status-labels.ts` | Pure family/lifecycle/visibility/source label helpers (no React) |
| `src/components/references/shared/ReferenceLifecycleVisibility.tsx` | Text+icon lifecycle/visibility chrome (not color-only) |
| `src/components/references/shared/ContractSourceBadge.tsx` | Family, lifecycle, package version, source artifact badge |
| `src/components/references/shared/ReferenceEmptyState.tsx` | Accessible empty inventory state via package `AlertPanel` |
| `src/components/references/shared/ReferenceErrorState.tsx` | Accessible malformed-inventory error state via package `AlertPanel` |
| `src/components/references/shared/index.ts` | Public shared chrome barrel |
| `src/components/references/harness/ReferenceChromeHarness.tsx` | Dev fixture mount for shared chrome browser verification |
| `src/app/(dev)/reference-chrome-harness/page.tsx` | Dev-only harness route (gated like component-examples) |

## Key host files (CLI family — story 002 / 003)

| Path | Role |
| --- | --- |
| `src/components/references/cli/CliCommandReference.tsx` | One command from a W04-normalized CLI projection; trimmed keep-list only (see below); shows `CliCapabilityNotice` when structured flags/arguments are absent |
| `src/components/references/cli/CliCommandInventory.tsx` | Inventory list with empty/error chrome |
| `src/components/references/cli/CliCapabilityNotice.tsx` | Under-construction treatment when published CLI contract lacks machine-readable flags/arguments |
| `src/components/references/cli/cli-capability.ts` | Pure helpers + under-construction copy for structured-options availability |
| `src/components/references/cli/cli-visibility.ts` | Map published CLI visibility → shared chrome when unambiguous (filter helpers; not card-body chrome) |
| `src/components/references/cli/types.ts` | CLI renderer prop contracts / inventory input union |
| `src/components/references/cli/index.ts` | Public CLI renderer barrel |
| `src/components/references/harness/ReferenceCliHarness.tsx` | Dev fixture mount for CLI inventory browser verification |

### CLI command card keep-list (repair-cli-reference-verbosity)

`CliCommandReference` card body keeps only:

- command-path header + stable-anchor copy affordance
- short description (when present)
- long description (when present and distinct from short)
- example (when present)
- Flags and arguments under-construction notice (when structured options are absent)

Do **not** reintroduce on the CLI card body: `ContractSourceBadge` /
family-package-source chrome, duplicated command-path or leaf-name rows,
aliases, visibility, runnable, or handler-present metadata. MCP/JS/events
renderers may still use shared badge chrome — this keep-list is CLI-card-only.

CLI page intro copy (`src/content/docs/references/cli/messages/en.json`) must
match the keep-list: advertise descriptions, examples, stable anchors, and
filters — not lifecycle/visibility/runnable/handler as card-body content, and
not the old “unavailable / discloses that limit” Flags/arguments story. Filters
may still mention lifecycle/visibility facets when those remain inventory
filter chrome.

CLI tests that lock this repair:

- `src/components/references/cli/cli-command-reference.test.tsx` — asserts the
  kept surface, absence of ContractSourceBadge / identity / visibility /
  runnable / handler chrome, under-construction Flags/arguments treatment, and
  no invented option rows.
- `src/content/docs/references/cli/cli-page.test.tsx` — asserts package-backed
  inventory publish plus a representative card scoped with `within(card)` so
  filter Lifecycle/Visibility labels do not false-positive as card chrome.

Browser spot-check for this repair (production build):

1. `bun run build` then `bun run start -- -p <3100-3999>` (unique port; kill on exit).
2. Open `/docs/references/cli` with Playwright (or equivalent JS-capable browser).
3. Assert a representative `[data-cli-command-reference]` card: command-path
   heading via `header h3 a` (AlertPanelTitle also uses `h3` for
   `🚧 Under construction` — do not use a bare `h3` locator), no
   `[data-contract-source-badge]` / `[data-reference-status-chrome]`, no
   Visibility / Handler present / Leaf name / Command path metadata rows, and
   `[data-cli-capability="structured-options-under-construction"]` (not the old
   unavailable apology) with no invented option tables.
4. Confirm inventory `data-inventory-state="success"` and Lifecycle/Visibility
   filters remain usable outside the card body.

## Key host files (MCP family — story 004 / 005)

| Path | Role |
| --- | --- |
| `src/components/references/mcp/McpToolReference.tsx` | One tool from a W04-normalized MCP projection with input schema embed + example |
| `src/components/references/mcp/McpToolExample.tsx` | Authored vs generated example chrome; generated shows visible AlertPanel notice |
| `src/components/references/mcp/mcp-example.ts` | Generated-example copy constants |
| `src/components/references/mcp/McpToolInventory.tsx` | Inventory list with empty/error chrome |
| `src/components/references/mcp/types.ts` | MCP renderer prop contracts / inventory input union |
| `src/components/references/mcp/index.ts` | Public MCP renderer barrel |
| `src/components/references/shared/SchemaDefinitionEmbed.tsx` | Thin local adapter over W04 `SchemaDefinitionModel` (no W07 fork) |
| `src/lib/references/mcp-input-schema-projection.ts` | Pure MCP JSON Schema → `SchemaDefinitionModel` projection (includes authored `examples` / property `const`) |
| `src/lib/references/mcp-example-generation.ts` | Pure resolve/generate/conform helpers for MCP input examples |
| `src/components/references/harness/ReferenceMcpHarness.tsx` | Dev fixture mount for MCP inventory browser verification |

## Key host files (JavaScript family — story 006)

| Path | Role |
| --- | --- |
| `src/components/references/javascript/JavaScriptSymbolReference.tsx` | One symbol from a W04-normalized JavaScript projection |
| `src/components/references/javascript/JavaScriptSharedSchemaReference.tsx` | One shared schema with thin SchemaDefinitionModel embed |
| `src/components/references/javascript/JavaScriptRuntimeInventory.tsx` | Inventory list (symbols + shared schemas) with empty/error chrome |
| `src/components/references/javascript/javascript-visibility.ts` | Map published JS visibility → shared chrome when unambiguous |
| `src/components/references/javascript/types.ts` | JS renderer prop contracts / inventory input union |
| `src/components/references/javascript/index.ts` | Public JavaScript renderer barrel |
| `src/components/references/harness/ReferenceJavascriptHarness.tsx` | Dev fixture mount for JS inventory browser verification |
| `src/lib/references/normalize-family-artifacts.ts` | Also normalizes `sharedSchemas` + enriched symbol metadata |

## Key host files (anchors + filters — story 007)

| Path | Role |
| --- | --- |
| `src/lib/references/assign-family-reference-anchors.ts` | Pure helpers that register CLI/MCP/JS items with `ReferenceAnchorRegistry` and return shallow copies with deterministic anchors (no mutation) |
| `src/components/references/shared/CopyableReferenceAnchor.tsx` | Copyable `#fragment` chrome; clipboard URL via W04 `referenceAnchorUrl` / family page paths |
| `src/components/references/shared/reference-inventory-filter.ts` | Pure filter state + match helpers (query / lifecycle / visibility); never invents missing facets |
| `src/components/references/shared/ReferenceInventoryFilter.tsx` | Keyboard-accessible filter controls (search + selects); ephemeral presentation only |
| Family inventories (`CliCommandInventory`, `McpToolInventory`, `JavaScriptRuntimeInventory`) | Assign registry anchors on success, host filter state, render filtered lists |

## Key host files (contract-count drift — story 008)

| Path | Role |
| --- | --- |
| `src/lib/references/family-inventory-contract-drift.ts` | Pure extract + `compareFamilyInventoryIdentities` for CLI/MCP/JS; dynamic membership, actionable missing-identity messages |
| `src/lib/references/family-inventory-contract-drift.test.ts` | Focused W03 resolve → W04 normalize → inventory-identity drift tests (no magic counts; omit fails with path/name) |
| Family `*InventoryIdentities` helpers on CLI/MCP/JS reference cards | Rendered-inventory identity lists used by drift comparison |

## Upstream dependencies (do not reimplement)


| Path | Role |
| --- | --- |
| `src/lib/references/reference-item.ts` | `ReferenceFamily`, `ReferenceLifecycle`, `ReferenceSourcePointer` |
| `src/lib/references/family-normalized-models.ts` | CLI/MCP/JS normalized item shapes (CLI carries optional short/long/example/visibility/runnable/handlerPresent; MCP carries optional handlerRegistered/requiredInputs/inputSchema/example; JS symbols carry mutability/nullability/examples/sharedSchemaLinks; JS shared schemas carry SchemaDefinitionModel) |
| `src/lib/references/normalize-family-artifacts.ts` | Artifact → normalized CLI/MCP/JS models (+ shared schemas) |
| `src/lib/references/mcp-input-schema-projection.ts` | MCP JSON Schema → W04 SchemaDefinitionModel |
| `src/lib/references/mcp-example-generation.ts` | Resolve authored vs generated MCP examples; schema-valid generation + conform checks |
| `src/lib/references/schema-model.ts` | W04 SchemaDefinitionModel / SchemaFieldModel contracts |
| `src/lib/references/reference-display-projection.ts` | Display projections for later family renderers |
| `src/lib/references/reference-search-projection.ts` | Search-document shapes + `referenceAnchorUrl` / family page paths (filter labels / copy URLs; not live Orama) |
| `src/lib/references/reference-anchor-registry.ts` | Stable anchors (`ReferenceAnchorRegistry`, `anchorForIdentity`) |
| `src/lib/references/assign-family-reference-anchors.ts` | Apply registry anchors onto CLI/MCP/JS normalized lists |
| `src/lib/references/api-package-artifact-resolver.ts` | W03 acquisition (server/build only) |

## Patterns

- Pass already-normalized projection fields into client-safe components; do not
  import W03 Node filesystem acquisition into browser bundles.
- Prefer `@you-agent-factory/components/feedback` (`AlertPanel`) for empty/error
  semantics; package styles load once from `src/app/globals.css`.
- Lifecycle and visibility must include readable text (and usually an icon);
  never rely on color alone.
- When optional contract fields are absent (`packageVersion`, lifecycle,
  visibility, example, runnable, handlerPresent), leave them out or disclose
  absence — never invent values, flags, or arguments.
- Keep shared chrome under `src/components/references/shared/`; family
  renderers live in `cli/`, `mcp/`, and `javascript/`.
- CLI package visibility is often `visible`; map to shared `public` only via
  `mapCliVisibilityToReferenceVisibility` when shared badge chrome needs it.
  CLI command cards no longer render visibility as card-body metadata — filters
  may still use the published visibility string as a facet.
- Browser verification without W11 routes: mount chrome/family renderers on the
  gated `(dev)/reference-chrome-harness` (or a later family harness), not on
  production reference collection pages.
- Reuse `CodePanel` from `@/features/factory-ui/data-display` for CLI/JS examples.
- Show `CliCapabilityNotice` under-construction treatment (AlertPanel
  `semantic="info"`, construction marker + short cue) whenever
  `cliCommandHasStructuredOptions` is false — never invent flag/argument rows,
  defaults, conflicts, or validation rules from prose examples. Do not restore
  the old "Structured flags and arguments unavailable" apology panel.
- Optional enriched projection bags `flags` / `arguments` (non-empty arrays)
  hide the under-construction notice; rendering those rows is a later
  enrichment, not this verbosity repair lane.
- MCP tools carry optional `handlerRegistered`, `requiredInputs`,
  `inputSchema` (`SchemaDefinitionModel`), and authored `example` on W04
  projections — project via `projectMcpInputSchemaToDefinition`, embed via
  thin `SchemaDefinitionEmbed` until W07 public adapters exist (do not fork a
  full schema-tree UI).
- MCP examples: prefer authored `tool.example` / `inputSchema.examples`; when
  absent, `resolveMcpToolExample` / `generateSchemaValidMcpExample` build a
  minimal schema-valid object (required fields only, first enum / const /
  default) and `McpToolExample` labels it generated with visible info chrome.
  Never show unlabeled synthetic examples.
- MCP/JS schema embeds belong under family renderers + shared thin adapter;
  keep W03 Node acquisition out of client harness mounts.
- JavaScript symbols carry optional visibility/mutability/nullability/
  bindingLifecycle/examples/sharedSchemaLinks. Shared schemas normalize via
  `projectMcpInputSchemaToDefinition`; `$ref`-only properties surface the ref
  as `typeSummary`; oneOf roots record composition member addresses without
  expanding a second schema-tree UI.
- Story 007: assign anchors through `assign*RegistryAnchors` (wraps
  `ReferenceAnchorRegistry`) before render; expose `CopyableReferenceAnchor`
  on every command/tool/symbol/shared-schema card. Inventory filters live in
  shared pure helpers + `ReferenceInventoryFilter` — ephemeral `useState` only,
  never mutate projections, never invent visibility/lifecycle values. MCP omits
  the visibility facet because tools do not publish it.
- Story 008: drift tests extract identities from W03-resolved artifact data,
  run W04 normalize + registry anchor assignment, then compare against
  `*InventoryIdentities`. Use `compareFamilyInventoryIdentities` — never assert
  a hard-coded command/tool/symbol count. Omitting an item must fail with the
  concrete command path, tool name, or symbol path in the mismatch message.
