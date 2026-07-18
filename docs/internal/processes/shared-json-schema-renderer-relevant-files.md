# Shared JSON Schema Renderer (W07) Relevant Files

Use these files when implementing or extending the shared JSON Schema UI that
consumes merged W04 normalized models and display projections.

## Ownership fence

W07 owns only the schema UI surface under `src/components/references/schema/`
(and focused tests / verification harnesses for that surface). Do **not**:

- implement Worker/Workstation overlay validators (W06)
- build OpenAPI API pages (W08), event-stream renderers (W09), or CLI/MCP/JS
  family renderers (W10)
- publish final `/docs/references/*-schema` pages, nav, sitemap, or search
  inventories (W11+)
- permanently pin production Fumadocs OpenAPI/AsyncAPI versions
- patch `node_modules`
- read raw package JSON or filesystem paths from UI components — consume W04
  models / display projections (callers acquire via W03, normalize via W04)

## Key host files

| Path | Role |
| --- | --- |
| `src/components/references/schema/index.ts` | Public barrel for the W07 schema UI ownership surface |
| `src/components/references/schema/types.ts` | Status vocabulary + thin typed adapters over W04 display/definition/field shapes |
| `src/components/references/schema/schema-status.tsx` | Accessible loading/empty/invalid/unsupported status messaging |
| `src/components/references/schema/schema-surface.tsx` | Boundary that short-circuits non-ready statuses or renders ready children |
| `src/components/references/schema/schema-surface.test.tsx` | Status semantics + W04 adapter acceptance proofs |
| `src/lib/references/schema-model.ts` | W04 `SchemaAddress` / `SchemaDefinitionModel` / `SchemaFieldModel` contracts |
| `src/lib/references/reference-display-projection.ts` | W04 UI-agnostic display projections consumed by schema UI props |
| `src/lib/references/reference-anchor-registry.ts` | Deterministic anchors for later copyable deep links |
| `src/lib/references/reference-cross-link-resolver.ts` | Cycle-safe `$ref` / discriminator outcomes for later ref-link UI |

## Patterns

- Keep the schema UI under `src/components/references/schema/` so ownership stays
  separate from W06 overlay modules and W10 family renderers.
- Accept W04-normalized models or `ReferenceDisplayProjection` shapes (via thin
  adapters in `types.ts`). Do not parse package JSON inside React components.
- Non-ready outcomes must be explicit and accessible:
  - `loading` / `empty` → `role="status"` (+ `aria-live="polite"`, `aria-busy`
    when loading)
  - `invalid` / `unsupported` → `role="alert"`
- Never invent missing contract prose (descriptions, examples, constraints).
  Leave optional fields absent when the model omits them.
- Prefer semantic theme tokens (`border-border`, `text-muted-foreground`,
  `text-destructive`) over color-only meaning for later type/required badges.

## Verification preference

Prove status and ready-path behavior with `@testing-library/react` against
observable roles/text. Prefer fixture W04 models from
`createSchemaDefinitionModel` / display projectors over scanning source files
or inventing package-path inventories in UI tests.
