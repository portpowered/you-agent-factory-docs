# Teaching UI filterable/sortable table (W-table) — relevant files

Use these files when owning graph-pages Wave A **W-table**: attribute facets,
filter/sort/transpose helpers, `FilterableSortableTable`, and
`OrchestratorFeatureMatrix`. Do **not** implement charts, lists, production
orchestrator registries, ModelCostPlayground, or technique/blog pages from this
lane. Do not expand `@you-agent-factory/components` APIs.

## Pure helpers + types

| File | Role |
| --- | --- |
| `src/features/teaching-ui/tables/types.ts` | Locked `Attribute*` / `OrchestratorRecord` / transpose model |
| `src/features/teaching-ui/tables/attribute-filter.ts` | AND multi-tag + boolean/string/single-tag filter |
| `src/features/teaching-ui/tables/attribute-sort.ts` | Stable attribute sort |
| `src/features/teaching-ui/tables/transpose-matrix.ts` | Entity rows → columns=entities, rows=attrs |
| `src/features/teaching-ui/tables/table-focus.ts` | Accent / muted / neutral row+column class helpers |

## Recipe components

| File | Role |
| --- | --- |
| `src/features/teaching-ui/tables/AttributeFacetBar.tsx` | Keyboard-usable facet controls |
| `src/features/teaching-ui/tables/FilterableSortableTable.tsx` | Entity-row table over factory-ui `DataTable` |
| `src/features/teaching-ui/tables/OrchestratorFeatureMatrix.tsx` | Transposed matrix + column picker (separate recipe) |
| `src/features/teaching-ui/tables/index.ts` | Tables sub-barrel |
| `src/features/teaching-ui/index.ts` | Public teaching-ui barrel (siblings append chart/list/focus) |

## Fixtures + harness

| File | Role |
| --- | --- |
| `src/features/teaching-ui/tables/__fixtures__/orchestrator-matrix.ts` | Fixture orchestrators + attribute defs (not production registry) |
| `src/app/(dev)/teaching-ui-harness/page.tsx` | Gated route; `notFound()` in production unless `ENABLE_COMPONENT_EXAMPLES=1` |
| `src/app/(dev)/teaching-ui-harness/teaching-ui-harness-gate.ts` | Pure enable check (mirrors sphere/code harness) |
| `src/app/(dev)/teaching-ui-harness/teaching-ui-harness-view.tsx` | Table section demos + chart/list placeholders |
| `src/app/(dev)/teaching-ui-harness/*.test.*` | Gate + harness composition / filter / column-picker tests |

## Patterns

- Multi-tag filter policy is **AND-only** for v1 (`multiTag[id]: string[]`).
- Compose factory-ui `DataTable` via `@/features/factory-ui/data-display`; do not fork package table APIs.
- Import recipes from `@/features/teaching-ui`, not deep private filter helpers, from pages/widgets.
- Harness URL: `/teaching-ui-harness`. Local `bun run dev` may need `--webpack` when Turbopack mis-infers the monorepo root.
- W-recipes may later own more harness shell polish; W-table owns the **tables** section content and fixtures.
