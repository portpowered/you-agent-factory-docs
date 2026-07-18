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
| `src/lib/references/schema-model.ts` | Pure serializable `SchemaAddress`, `SchemaDefinitionModel`, `SchemaFieldModel`, composition/discriminator, constraints, and JSON parse/serialize helpers (no IO) |
| `src/lib/references/schema-model.test.ts` | Address/pointer shape, composition, maps/arrays/enums/defaults, missing-description, and JSON round-trip proofs |
| `src/lib/references/family-normalized-models.ts` | Pure serializable OpenAPI operation summary + CLI/MCP/JS/event normalized types and JSON helpers (no IO) |
| `src/lib/references/family-normalized-models.test.ts` | Family identity fields, missing-optional handling, and JSON round-trip proofs |
| `src/lib/references/normalize-family-artifacts.ts` | Pure artifact→model normalizers for OpenAPI/CLI/MCP/JS/events (consumes W03-resolved data or fixtures; no package imports) |
| `src/lib/references/normalize-family-artifacts.test.ts` | Fixture-shaped normalization + W03 public-subpath consumption proofs |
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
- `SchemaAddress` is `{ publicArtifactId, pointer }` (JSON Pointer preferred).
  Composition members and `$ref` / discriminator mapping values stay as
  addresses so cycles remain representable without unbounded nesting. Nested
  `$defs` may be full `SchemaDefinitionModel` or deferred `SchemaAddress`.
- Never invent missing descriptions, types, or constraints — leave optional
  fields absent when the contract omits them. Treat empty package strings
  (`""`) as absent during family normalization.
- Family-specific models live in `family-normalized-models.ts`; acquire package
  data only via W03 `resolveApiPackageArtifact` (or fixtures shaped like
  resolved `data`), then pass that object into `normalize-family-artifacts.ts`.
  Do not import `@you-agent-factory/api` package root or `generated/…` internals
  from W04 modules.
- Provisional anchors from `provisionalAnchorFromIdentity` only fill the
  required slot until `ReferenceAnchorRegistry` owns collision-checked anchors.
- Later stories add anchor registry, cross-link resolver, and display/search
  projections beside these modules without widening W04 into UI/pages.

## Verification

```bash
bun test src/lib/references/reference-item.test.ts
bun test src/lib/references/schema-model.test.ts
bun test src/lib/references/family-normalized-models.test.ts
bun test src/lib/references/normalize-family-artifacts.test.ts
bun run typecheck
bun run lint
```
