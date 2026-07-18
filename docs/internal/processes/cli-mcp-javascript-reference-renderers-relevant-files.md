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
| `src/components/references/cli/CliCommandReference.tsx` | One command from a W04-normalized CLI projection; shows `CliCapabilityNotice` when structured flags/arguments are absent |
| `src/components/references/cli/CliCommandInventory.tsx` | Inventory list with empty/error chrome |
| `src/components/references/cli/CliCapabilityNotice.tsx` | Visible disclosure when published CLI contract lacks machine-readable flags/arguments |
| `src/components/references/cli/cli-capability.ts` | Pure helpers + notice copy for structured-options availability |
| `src/components/references/cli/cli-visibility.ts` | Map published CLI visibility → shared chrome when unambiguous |
| `src/components/references/cli/types.ts` | CLI renderer prop contracts / inventory input union |
| `src/components/references/cli/index.ts` | Public CLI renderer barrel |
| `src/components/references/harness/ReferenceCliHarness.tsx` | Dev fixture mount for CLI inventory browser verification |

## Upstream dependencies (do not reimplement)

| Path | Role |
| --- | --- |
| `src/lib/references/reference-item.ts` | `ReferenceFamily`, `ReferenceLifecycle`, `ReferenceSourcePointer` |
| `src/lib/references/family-normalized-models.ts` | CLI/MCP/JS normalized item shapes (CLI carries optional short/long/example/visibility/runnable/handlerPresent) |
| `src/lib/references/normalize-family-artifacts.ts` | Artifact → normalized CLI/MCP/JS models |
| `src/lib/references/reference-display-projection.ts` | Display projections for later family renderers |
| `src/lib/references/reference-anchor-registry.ts` | Stable anchors (later stories) |
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
- Keep shared chrome under `src/components/references/shared/`; CLI family
  renderers live in `cli/` (MCP/JavaScript land in later stories).
- CLI package visibility is often `visible`; map to shared `public` only via
  `mapCliVisibilityToReferenceVisibility` — still show the published string in
  the command metadata row.
- Browser verification without W11 routes: mount chrome/family renderers on the
  gated `(dev)/reference-chrome-harness` (or a later family harness), not on
  production reference collection pages.
- Reuse `CodePanel` from `@/features/factory-ui/data-display` for CLI examples.
- Show `CliCapabilityNotice` (AlertPanel `semantic="info"`) whenever
  `cliCommandHasStructuredOptions` is false — never invent flag/argument rows,
  defaults, conflicts, or validation rules from prose examples.
- Optional enriched projection bags `flags` / `arguments` (non-empty arrays)
  hide the notice; rendering those rows is a later enrichment, not W10 story 003.
