# Rich code presentation primitives foundation — relevant files

## Contributor command path

- Root `Makefile` is the shared entrypoint: `setup`, `check`, `test`, `build`.
- `make check` runs `bun run typecheck` then `bun run lint` (Biome).
- `make test` runs `bun test` with happy-dom preloaded from `bunfig.toml`.

## Primitive components

- Reusable docs primitives live under `src/components/docs/primitives/` and are re-exported from `src/components/docs/primitives/index.ts`.
- Shared reviewer labels, example fixture data, example route constants, and `withCodePresentationExampleNavigation()` live in `src/lib/docs-primitives.ts`.
- `loadDocsShellNavigation()` in `src/lib/content/load-docs-navigation.ts` appends the code presentation example route through `withCodePresentationExampleNavigation()`.
- The reviewer-visible example surface is `src/components/docs/code-presentation-example.tsx`, rendered from `src/app/docs/examples/code-presentation/page.tsx` through `DocsRouteChrome` under the Fumadocs-owned docs layout on the current site foundation.
- Shared docs article framing now lives in `src/components/docs/docs-content.tsx`; overview pages and example routes should reuse `DocsContentSurface` and `DocsContentCard` so docs intro/section framing stays aligned with the same primitive-backed styling path as the shell.
- Docs chrome is shared through `src/components/docs/docs-route-chrome.tsx`; pass generated navigation and `currentPath` so search, breadcrumbs, and progression stay aligned with the active docs route path.
- Primitive and diagram surfaces extend the shared token layer projected from `src/app/globals.css`; prefer semantic utilities (`bg-card`, `bg-muted`, `text-foreground`, `border-border`) over direct landing-only variables.
- Responsive docs diagrams rely on `min-w-0` shared-shell containers plus component-owned Tailwind wrappers around Mermaid and React Flow surfaces; preserve that combination when adjusting docs example layout or diagram rendering.
- Generated navigation, prose, and diagram presentation now belong on component markup, helper constants, or reusable primitives rather than `globals.css` selector families. New docs framing work should start from `DocsContentSurface`, `DocsContentCard`, and primitive utilities instead of adding feature-level global CSS.

## Verification

- Component behavior tests belong in `tests/unit/docs-route-shell.test.tsx` and focused route/component tests such as `tests/unit/docs-route-chrome.test.tsx` (example surface headings, accessible labels, tab switching, preserved docs-route chrome).
- Focused `CodeBlock` primitive tests belong in `tests/unit/code-block.test.tsx` (language labels, `lang` attribute, responsive layout classes).
- Focused `CodeTabs` primitive tests belong in `tests/unit/code-tabs.test.tsx` (tab list labeling, roving `tabIndex`, click and keyboard panel switching, empty state).
- Focused `Callout` primitive tests belong in `tests/unit/callout.test.tsx` (variant labels, accessible names, variant classes, responsive wrapping).
- Focused `FileTree` primitive tests belong in `tests/unit/file-tree.test.tsx` (node kind labels, accessible names, nested depth projection, empty state, responsive wrapping).
- `formatCalloutVariantLabel()` and `formatCalloutAccessibleName()` map callout variants to reviewer-visible labels and assistive-tech names.
- `formatFileTreeNodeKindLabel()` and `formatFileTreeNodeAccessibleName()` map file-tree node kinds to reviewer-visible labels and assistive-tech names.
- `Callout` exposes variant context through `aria-label` with `aria-hidden` variant badges; keep it server-renderable unless interactive behavior is added later.
- `FileTree` exposes node kind context through `aria-label` on each list item with `aria-hidden` icons; nested lists use `data-depth` and a left border for hierarchy cues.
- Static export route coverage for the example page belongs in `tests/unit/static-export.test.ts`.
- Manual browser verification follows `docs/internal/processes/manual-qa.md`; serve the export under `/you-agent-factory-docs` and open `/you-agent-factory-docs/docs/examples/code-presentation/`.
