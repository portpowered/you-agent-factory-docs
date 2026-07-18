# Normalized Reference Model (W04) Relevant Files

Use these files when implementing or extending the W04 normalized reference
model, anchor registry, cross-link resolver, and display/search projections on
top of the merged W03 `@you-agent-factory/api` acquisition surface.

## Ownership fence

W04 owns only the normalized model / anchor / projection module surface and its
tests under `src/lib/references/` (plus focused fixtures). Do **not**:

- reimplement package acquisition (use W03 resolver / membership / format gate)
- import `@you-agent-factory/api` package root or package-internal paths
- patch `node_modules`
- build W06 overlays, W07–W10 UI renderers, Orama/nav inventories, or final
  reference pages

## Key host files

| Path | Role |
| --- | --- |
| `src/lib/references/reference-item.ts` | Pure serializable `ReferenceItem`, family ids, lifecycle, and source-pointer types + JSON parse/serialize helpers (no IO) |
| `src/lib/references/reference-item.test.ts` | Family coverage, source-pointer shape, and JSON round-trip proofs |
| `src/lib/references/api-package-artifact-resolver.ts` | W03 build/server acquisition — consume artifacts only through this public-subpath surface |
| `src/lib/references/api-package-public-exports.ts` | Documented public subpath allowlist (for source `publicArtifactId` / subpath values) |

## Patterns

- Keep identity types pure and IO-free so later browser-safe projections can
  import them without pulling Node acquisition modules.
- Reference **page** families (`api`, `schema`, `cli`, `mcp`, `javascript`,
  `events`) are distinct from package manifest export families (`config`,
  `shared`, …). Use `api` for the OpenAPI/API page family (matches routes such
  as `/docs/references/api#…`).
- `ReferenceSourcePointer` must name the owning public artifact identity
  (`publicArtifactId`) plus a stable in-artifact `pointer` (JSON Pointer
  preferred). Optional `path` is for diagnostics/source badges only — never
  invent missing description or origin text.
- Prove JSON serializability with `serializeReferenceItem` /
  `deserializeReferenceItem` round-trips; items must be plain objects, not
  class instances.
- Later stories add schema models, family-specific normalized types, anchor
  registry, cross-link resolver, and display/search projections beside this
  module without widening W04 into UI/pages.

## Verification

```bash
bun test src/lib/references/reference-item.test.ts
bun run typecheck
bun run lint
```
