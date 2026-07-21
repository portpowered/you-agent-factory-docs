# Teaching-UI Lists (W-lists) — relevant files

Use these files when owning the Graph-pages Wave A TeachingList recipe
(`src/features/teaching-ui/lists/**`). Do **not** own charts, tables,
registries, technique/blog pages, or expand `@you-agent-factory/components`
from this lane. Prefer the lists barrel only — W-recipes owns the top-level
`teaching-ui/index.ts`.

## Component + barrel

| File | Role |
| --- | --- |
| `src/features/teaching-ui/lists/TeachingList.tsx` | Plain/tagged list; required `listLabel`; empty `role="status"`; no card chrome by default |
| `src/features/teaching-ui/lists/teaching-list.types.ts` | Locked contract types (`TeachingListItem`, `TeachingListProps`, variant) |
| `src/features/teaching-ui/lists/index.ts` | Public lists barrel (`TeachingList` + types) |
| `src/features/teaching-ui/lists/TeachingList.test.tsx` | Plain + tagged render + empty status + no-card-chrome proofs |

## Dev harness

| File | Role |
| --- | --- |
| `src/app/(dev)/teaching-ui-lists-harness/page.tsx` | Gated route `/teaching-ui-lists-harness`: plain + tagged fixtures; `notFound()` in production unless `ENABLE_COMPONENT_EXAMPLES=1` |

## Ownership fence (W-lists)

This lane owns only `src/features/teaching-ui/lists/**` plus the gated harness
above. Do **not** add production technique/blog/documentation MDX or route
imports of `TeachingList` here (Wave B pages may import later). Do **not** edit
charts, tables, registry JSON/loaders, ModelCostPlayground, or invent content
schemas. Do **not** expand `@you-agent-factory/components` public APIs. Do **not**
edit top-level `teaching-ui/index.ts` unless W-recipes already expects list
re-exports.

## Patterns

- Import from `@/features/teaching-ui/lists` until W-recipes re-exports from the
  top-level teaching-ui barrel.
- Empty state keeps a visually-hidden (`sr-only`) `<ul aria-label={listLabel}>`
  shell so the list name stays queryable while `role="status"` carries the empty
  copy.
- Tagged tags are nested plain-text lists — not TagPillList / registry pills.
- Prefer a dedicated `(dev)/teaching-ui-lists-harness` over expanding
  `REQUIRED_COMPONENT_NAMES`.
- Local worktree `bun run dev` may need `--webpack` when Turbopack mis-infers
  the monorepo root; harness URL is `/teaching-ui-lists-harness`.
- Browser-verify with a unique port (for example `3456`), kill the server before
  exit, and assert both section headings plus `aria-label` list names
  (`Pattern bullets` / `Reading notes` fixtures).
- Lock render proofs with item count (`:scope > li`) plus title/tag presence;
  empty proofs use `getByRole("status")` and `getByRole("list", { name })`.
