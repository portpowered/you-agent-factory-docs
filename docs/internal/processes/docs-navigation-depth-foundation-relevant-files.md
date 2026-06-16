# Docs navigation depth foundation — relevant files

## Reviewer notes

### Prerequisites

- **canonical-content-model-foundation** provides `CanonicalContentRecord`, `projectDocsShellNavigation()`, and starter content fixtures.
- **responsive-shared-hooks-foundation** provides shared shell disclosure behavior consumed by `SharedShellDocsAside`.
- **localization-message-foundation** supplies localized shell labels via `createSharedShellConfigFromMessages()` while docs sidebar page labels come from canonical metadata.

### Ownership boundary

- **`CanonicalContentRecord`** (`src/lib/content/types.ts`) remains the durable source of truth for doc identity, section, order, and navigation titles.
- **`DocsShellNavigationInput`** (`src/lib/content/docs-navigation.ts`) is projected docs navigation state with section-grouped pages.
- **`projectSharedShellDocsNavigation()`** (`src/lib/content/shared-shell-navigation.ts`) maps projected navigation into `SharedShell` sidebar groups without route-local constant arrays.
- Localized shell framing (overview labels, nav headings, disclosure copy) stays in the localization message catalog; page-specific sidebar labels come from canonical `navigationTitle` metadata.

## Docs navigation depth

- Starter docs depth is authored under `src/content/docs/{slug}/en.mdx`; section and order frontmatter drive generated left-navigation grouping.
- `loadDocsShellNavigation()` loads canonical records and projects navigation for `DocsShell` on both `/docs` and `/docs/[slug]` routes.
- `SharedShellDocsAside` renders one navigation landmark per projected section so multi-section browsing depth is observable in the left sidebar.
- Remove bootstrap-only nav constants such as `src/lib/docs-nav.ts`; the docs shell consumes projected navigation only.

## Tests

- Multi-section projection and fixture loading: `tests/unit/docs-navigation.test.ts`
- Docs shell rendering with separate section landmarks: `tests/unit/docs-shell.test.tsx`
- Served static export HTML includes generated multi-page sidebar depth: `tests/unit/static-export.test.ts`
- Starter content record inventory after adding docs fixtures: `tests/unit/starter-content.test.ts`
- Prefer observable navigation output, served HTML, and rendered landmarks—not file inventories or route registries.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
