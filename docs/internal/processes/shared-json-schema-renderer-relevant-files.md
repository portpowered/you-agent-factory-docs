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
| `src/components/references/schema/schema-type-badge.tsx` | Type / format / nullable presentation from display projections |
| `src/components/references/schema/schema-required-badge.tsx` | Required/optional text badge (never color-only meaning) |
| `src/components/references/schema/schema-default-value.tsx` | Code-formatted defaults with clipboard copy |
| `src/components/references/schema/schema-constraint-list.tsx` | Enum/const/pattern/range/length/items/uniqueness/additionalProperties list |
| `src/components/references/schema/schema-constraint-entries.ts` | Pure constraint → labeled entry projection (no invented values) |
| `src/components/references/schema/schema-field-metadata.test.tsx` | Field metadata display proofs (type/required/default/constraints) |
| `src/components/references/schema/schema-field-path.ts` | Pure path/leaf helpers + tree-node builders; `$ref` expand guard |
| `src/components/references/schema/schema-field-row.tsx` | Accessible field row (name/path/type/required/description + expand) |
| `src/components/references/schema/schema-field-tree.tsx` | Recursive field tree with disclosure semantics and `$ref` via SchemaRefLink |
| `src/components/references/schema/schema-field-tree.test.tsx` | Field tree/row keyboard expand + path + `$ref` non-recursion proofs |
| `src/components/references/schema/schema-ref-display.ts` | Pure `$ref` / composition / discriminator display projectors over W04 outcomes |
| `src/components/references/schema/schema-ref-link.tsx` | Navigable `$ref` link + cycle sentinel; unresolved missing/malformed status |
| `src/components/references/schema/schema-composition.tsx` | oneOf/anyOf/allOf + discriminator mapping display |
| `src/components/references/schema/schema-composition.test.tsx` | Composition, discriminator, cycle, unresolved, and field-tree `$ref` proofs |
| `src/components/references/schema/schema-anchor.ts` | Pure W04 deep-link / breadcrumb segment helpers (`anchorForIdentity`) |
| `src/components/references/schema/schema-breadcrumb.tsx` | Path breadcrumb + copyable deep-link control |
| `src/components/references/schema/schema-definition.tsx` | Full definition view: metadata, anchors, composition, field tree, examples |
| `src/components/references/schema/schema-definition.test.tsx` | Definition metadata, omitted prose, copyable definition/field anchors |
| `src/components/references/schema/schema-example-display.ts` | Pure example → CodePanel display projectors + authored/generated labels |
| `src/components/references/schema/schema-example-panel.tsx` | CodePanel-backed examples with copy chrome and empty affordance |
| `src/components/references/schema/schema-example-panel.test.tsx` | Example CodePanel, provenance labels, empty, and definition wiring proofs |
| `src/components/references/schema/schema-filter-display.ts` | Pure definition / field-path filter projectors (no canonical mutation) |
| `src/components/references/schema/schema-filter.tsx` | Keyboard-accessible filter control + filtered definition/field results |
| `src/components/references/schema/schema-filter.test.tsx` | Filter match, empty-filter status, clear/reset, non-mutation proofs |
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
  `text-destructive`) over color-only meaning for type/required badges.
- Field metadata components (`SchemaTypeBadge`, `SchemaRequiredBadge`,
  `SchemaDefaultValue`, `SchemaConstraintList`) read W04 projections / field
  models. Use `listSchemaConstraintEntries` when you need labeled constraint
  rows without inventing absent enum/const/pattern/range facts.
- `SchemaDefaultValue` is a client component (clipboard via `useCopyButton`);
  keep pure formatting in `formatSchemaValue` / `listSchemaConstraintEntries`.
- `SchemaFieldTree` / `SchemaFieldRow` are client components (expand state).
  Pass pre-resolved `SchemaFieldTreeNode` children — do not walk `$ref`
  targets in the UI. `$ref` rows render `SchemaRefLink` (stable W04 anchors;
  cycle sentinels stay links; missing/malformed are unresolved `role="status"`).
  Use `schemaFieldTreeNodeCanExpand` so refs never recurse even if children
  were accidentally attached.
- Composition UI: `SchemaComposition` + `projectSchemaCompositionDisplay` /
  `schemaRefLinkDisplayFromOutcome` consume W04 composition models and
  `ReferenceCrossLinkResolver` outcomes. Members stay as links — never
  recursive definition trees.
- Definition UI: `SchemaDefinition` composes metadata, `SchemaComposition`,
  `SchemaFieldTree`, `SchemaBreadcrumb`, and `SchemaExamplePanel`. Anchors come
  from `schemaAddressDeepLink` / `anchorForIdentity("schema-pointer", …)` —
  never mint unstable fragment IDs in the UI. Field rows copy deep links only
  when `SchemaFieldModel.address` is present.
- Examples: render through site `CodePanel` (`@/features/factory-ui/data-display`)
  with sibling copy chrome (same `useCopyButton` pattern as defaults/anchors).
  Use `projectSchemaExamplesFromValues` for raw W04 `examples` and
  `projectSchemaExamplesFromInputs` when authored/generated origin is known.
  Never invent sample payloads; empty uses `SchemaStatus` `kind="empty"` when
  `showEmpty` is true. Do not label unknown provenance as authored.
- Filtering: `SchemaFilter` + `filterSchemaDefinitions` /
  `filterSchemaFieldTreeNodes` keep query state in the UI only. Matching parents
  keep all children; non-matching parents stay only as ancestors of matches.
  Active queries with zero hits use `SchemaStatus` `kind="empty"` (empty-filter
  message), not a blank panel. Clear resets via the Clear button or emptying
  the search input.

## Verification preference

Prove status and ready-path behavior with `@testing-library/react` against
observable roles/text. Prefer fixture W04 models from
`createSchemaDefinitionModel` / display projectors over scanning source files
or inventing package-path inventories in UI tests.
