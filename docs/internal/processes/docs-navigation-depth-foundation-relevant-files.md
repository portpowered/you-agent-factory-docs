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
- `projectDocsBreadcrumbs()` projects breadcrumb ancestry from the same `DocsShellNavigationInput`; shell root labels resolve through localization while section and page crumbs come from projected navigation state.
- `DocsBreadcrumbs` renders the projected trail inside `DocsShell` with `aria-current="page"` on the active crumb.
- `projectDocsProgression()` projects previous-next links from flattened docs navigation ordering; section and page order match left navigation projection.
- `DocsProgression` renders generated previous-next links inside `DocsShell` with `rel="prev"` / `rel="next"` semantics.
- `parseDocPageBody()` and `projectDocsPageOutline()` derive in-page outline headings from docs page body markdown structure; h2+ headings become anchor-linked outline entries while pages without sufficient headings return an empty outline.
- `DocPageArticle` renders the projected page outline, page title, and parsed body blocks with heading anchor ids on docs detail routes.
- Remove bootstrap-only nav constants such as `src/lib/docs-nav.ts`; the docs shell consumes projected navigation only.

## Tests

- Multi-section projection and fixture loading: `tests/unit/docs-navigation.test.ts`
- Breadcrumb ancestry projection: `tests/unit/docs-navigation.test.ts` (`projectDocsBreadcrumbs`)
- Previous-next progression projection: `tests/unit/docs-navigation.test.ts` (`projectDocsProgression`)
- In-page outline parsing and projection: `tests/unit/docs-page-outline.test.ts`
- Doc page article outline rendering and empty-state fallback: `tests/unit/doc-page-article.test.tsx`
- Docs shell rendering with separate section landmarks, breadcrumb position, and progression links: `tests/unit/docs-shell.test.tsx`
- Served static export HTML includes generated multi-page sidebar depth, breadcrumb ancestry, progression links, and page-outline navigation when headings exist: `tests/unit/static-export.test.ts`
- Starter content record inventory after adding docs fixtures: `tests/unit/starter-content.test.ts`
- Prefer observable navigation output, served HTML, and rendered landmarks—not file inventories or route registries.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
