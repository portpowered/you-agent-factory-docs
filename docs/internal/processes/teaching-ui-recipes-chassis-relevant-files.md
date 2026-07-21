# Teaching UI recipes chassis — relevant files

Graph-pages Wave A **W-recipes** chassis: public barrel, focus tokens, and
`(dev)/teaching-ui-harness` shell. Sibling lanes own charts / lists / tables /
pages.

## Ownership

| File | Role |
| --- | --- |
| `src/features/teaching-ui/focus.ts` | Accent vs muted focus tokens + `resolveFocusColor` |
| `src/features/teaching-ui/index.ts` | Public barrel (`@/features/teaching-ui`) |
| `src/app/(dev)/teaching-ui-harness/page.tsx` | Production-gated harness route |
| `src/app/(dev)/teaching-ui-harness/teaching-ui-harness-content.tsx` | Labeled Chart / List / Table placeholders + focus swatch demo |

## Patterns

- Import focus helpers only from `@/features/teaching-ui` (barrel), not deep
  `./focus` paths, from harness and sibling recipes.
- Focus colors bind to `DOCS_CHROME_HIGHLIGHTING_TOKEN_VARS` (`secondaryBlue` /
  `mutedWhite`); do not invent per-recipe hex schemas.
- `resolveFocusColor(id, focusId, tokens)` accents only on explicit
  `id === focusId`; undefined `focusId` → all muted.
- Harness gating matches other `(dev)` routes: `notFound()` when
  `NODE_ENV === "production"` unless `ENABLE_COMPONENT_EXAMPLES === "1"`.
- Chassis does **not** stub chart/list/table component APIs or expand
  `@you-agent-factory/components`. Placeholders are labeled shells only.
- Keep harness presentational body free of `next/navigation` so component tests
  can render it without mocking `notFound`.

## Closeout verification (story 004)

- Diff must stay chassis-only: `src/features/teaching-ui/**`,
  `src/app/(dev)/teaching-ui-harness/**`, and this process note. No production
  technique/blog/docs MDX, registries, or `@you-agent-factory/components` API
  expansion.
- Durable proof: `src/features/teaching-ui/production-untouched.test.tsx`
  renders blog/changelog + docs/concepts/harness and asserts absence of
  harness markers; also locks the public barrel to focus exports only.
- Browser proof when Next can start (parent-hoisted `node_modules`):
  `bun ./scripts/run-next.ts dev --webpack -p <3100-3999> -H 127.0.0.1`, then
  curl `/blog/changelog` and `/docs/concepts/harness` with `--max-time 10` and
  confirm no `teaching-ui-harness` / `data-teaching-ui` markers. Kill the server
  before exiting.

## Control docs (often gitignored in worktrees)

- `docs/temp/graph-pages/contracts.md` — Focus contract
- `docs/temp/graph-pages/workstreams.md` — W-recipes ownership
- `docs/temp/graph-pages/testing.md` — harness visual check expectations
