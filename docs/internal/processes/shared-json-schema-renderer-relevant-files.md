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
- permanently pin production Fumadocs OpenAPI/AsyncAPI versions (W08 owns
  production OpenAPI pins under `src/components/references/api/`)
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
| `src/components/references/schema/schema-field-row.tsx` | Accessible field row (name/path/type/required/default/constraints/description + expand) |
| `src/components/references/schema/schema-field-tree.tsx` | Recursive field tree with disclosure semantics and `$ref` via SchemaRefLink |
| `src/components/references/schema/schema-field-tree.test.tsx` | Field tree/row keyboard expand + path + `$ref` non-recursion + in-row default/constraint proofs |
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
| `src/components/references/schema/schema-reference-display.ts` | Pure complete/addressed resolution + catalog/address lookup helpers |
| `src/components/references/schema/schema-reference.tsx` | Top-level SchemaReference composing status, definition, filter, catalog |
| `src/components/references/schema/schema-reference.test.tsx` | Complete vs addressed mode, missing-address invalid, composition wiring |
| `src/components/references/schema/schema-variant-display.ts` | Pure overlay-shaped presentation guards + variant resolution / field annotation |
| `src/components/references/schema/schema-variant-applicability-badge.tsx` | Selected / excluded / conditional text badges (never color-only) |
| `src/components/references/schema/schema-variant-reference.tsx` | SchemaVariantReference display adapter over base definition + overlay presentation |
| `src/components/references/schema/schema-variant-reference.test.tsx` | Variant badges, base prose preservation, missing/empty overlay status proofs |
| `src/components/references/schema/schema-verification-harness.tsx` | Focused W07 harness: three real schemas + keyboard expand probe (not a published reference page) |
| `src/components/references/schema/schema-verification-harness.test.tsx` | Real-schema field/composition/filter/example, keyboard, and responsive overflow proofs |
| `src/app/(dev)/schema-renderer-harness/page.tsx` | Non-production harness route (`ENABLE_SCHEMA_RENDERER_HARNESS=1` in production) |
| `src/lib/references/normalize-json-schema-artifact.ts` | Pure JSON Schema document → W04 `SchemaDefinitionModel` normalizer (no package IO) |
| `src/lib/references/normalize-json-schema-artifact.test.ts` | Fixture + W03 public-subpath normalization proofs |
| `src/lib/references/load-schema-verification-models.ts` | Server helper: `resolveApiPackageArtifact` + normalize for the three schema subpaths |
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
  were accidentally attached. When a field publishes `default` / enum /
  constraints / const / additionalProperties, the row composes
  `SchemaDefaultValue` + `SchemaConstraintList` via
  `schemaConstraintListPropsFromField` — do not leave those components
  definition-only.   Optional `showFieldPathWhenDistinct` (default false) omits
  secondary path labels that equal the leaf name; events catalog views opt in
  via `EventsSchemaDefinition` / `dedupeSchemaFieldTreeNodesByPath` without
  changing MCP/CLI/JS/API defaults. Optional `showPointerPathChrome` (default
  true) controls visible OpenAPI pointer breadcrumbs and full-pointer `$ref`
  labels; events opt out (`false`) so field names stay primary while
  `SchemaBreadcrumb` copy controls remain.
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
- Top-level entry: `SchemaReference` + `resolveSchemaReferenceInput` compose
  status, `SchemaDefinition`, `SchemaFilter`, and catalog listing. Pass `root`
  (+ optional `definitions`) for complete mode, or `address` / `definition` for
  addressed mode on the same component. Missing addresses resolve to `invalid`
  status (never throw). Root pointers must be anchor-safe (not bare `/`).
- Variant adapter: `SchemaVariantReference` + `resolveSchemaVariantInput` accept
  a base definition plus overlay-*shaped* presentation
  (`selected`/`excluded`/`conditional` field paths + optional hints). This is
  display-only — do not implement W06 validators here. Missing/malformed overlay
  → `invalid`; empty overlay fields → `empty`. Annotate field trees via
  `annotateSchemaFieldTreeWithVariant`; field descriptions/types always come
  from the base `SchemaFieldModel`. Opt-in chrome trim:
  `showVariantHeading={false}` hides the `Variant: <label>` heading;
  `showPointerBreadcrumb={false}` (forwarded to `SchemaDefinition`) hides
  `/$defs/…` pointer breadcrumb chrome. Both default to `true` so Factory
  schema / you-config / mock-workers pages keep existing chrome; worker and
  workstation authored embeds opt out.
- Real-schema verification: acquire via W03 `resolveApiPackageArtifact`
  (`schemas/factory`, `schemas/you-config`, `schemas/mock-workers`), normalize
  with `normalizeJsonSchemaArtifact` (pure), then render through
  `SchemaReference` / `SchemaVerificationHarness`. Use `showCatalog={false}` for
  large `$defs` catalogs by default (filter still lists definitions). Factory
  schema page opt-in: `/docs/references/factory-schema` enables catalog splay
  via page-local `collectFactorySchemaSplayDefinitions` + `showCatalog` so the
  transitive `$ref` closure renders as expanded definitions — keep you-config /
  mock-workers on `showCatalog={false}`. With splay + `pagePath` +
  `ReferenceHashNavigation`, Factory `$ref` links are same-page hash jumps to
  those expanded definition `id`s (prove with
  `assert-factory-schema-click-traverse-browser.ts` / page-local mount tests).
  Full Factory configuration JSON example is a page-local authored
  `exampleInputs` override (`factory-schema-full-config-example.ts`) aligned
  with the factories/configuration hermetic minimal sample
  (`workTypes` / `workers` / `workstations`) — pass only on
  `FactorySchemaReference`, never as a sibling-schema default. Prove with
  `assert-factory-schema-full-config-example-browser.ts` / page-local mount
  tests. Repair close-out browser probe covering intro strip + splay +
  click-traverse + full config together:
  `assert-factory-schema-repair-browser.ts`. For page-owned system-config polish
  that also removes filter-definitions list chrome, set `showFilter={false}` on
  that page mount only — do not change SchemaReference defaults for other
  families. When trimming filter/catalog chrome, also rewrite page-local
  `sections.schemaLookup.body` so it does not instruct readers to Filter by
  definition / catalog UI that is gone, and drop “on this page” framing. To rename a root definition header without changing the upstream
  package title, pass a page-local `projection` from
  `projectSchemaDefinitionToDisplay` with an overridden `title` (keep the W04
  `schemaPointerAnchor` so deep links stay stable). To show a concrete operator
  teaching sample without fabricating upstream package `examples`, pass
  page-local `exampleInputs` (`origin: "authored"`) on that SchemaReference
  mount only — keep payloads aligned with existing docs teaching samples (for
  system-config: `defaults.workerModelProvider` / `defaults.workerModel`).
  Browser-closeout for the system-config rename/polish lane: colocated
  `src/content/docs/references/system-config-schema/assert-system-config-schema-rename-browser.ts`
  (unique port `SYSTEM_CONFIG_SCHEMA_RENAME_PROBE_PORT`, webpack `bun run dev`,
  kill server on exit). Assert `data-schema-status="ready"`, System config
  title/lead, absent What It Covers / filter / Definitions catalog, authored
  example fields, old slug non-redirect 404, and family-index +
  global-configuration inbound links to `/docs/references/system-config-schema`.
  Root pointers must be anchor-safe (not bare `/`). Harness route:
  `/schema-renderer-harness` under `src/app/(dev)/` — not a published
  `/docs/references/*-schema` page.

## Verification preference

Prove status and ready-path behavior with `@testing-library/react` against
observable roles/text. Prefer fixture W04 models from
`createSchemaDefinitionModel` / display projectors over scanning source files
or inventing package-path inventories in UI tests. For story-level real-schema
proofs, load through `loadSchemaVerificationPackageModel` /
`SchemaVerificationHarness` and assert field visibility, composition/`$ref`
links, filter, examples/empty-examples, keyboard expand (harness probe), and
responsive `min-w-0` / overflow containment at phone + desktop widths.
