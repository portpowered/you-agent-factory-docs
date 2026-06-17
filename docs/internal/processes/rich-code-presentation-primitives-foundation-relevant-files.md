# Rich code presentation primitives foundation — relevant files

## Contributor command path

- Root `Makefile` is the shared entrypoint: `setup`, `check`, `test`, `build`.
- `make check` runs `bun run typecheck` then `bun run lint` (Biome).
- `make test` runs `bun test` with happy-dom preloaded from `bunfig.toml`.

## Primitive components

- Reusable docs primitives live under `src/components/docs/primitives/` and are re-exported from `src/components/docs/primitives/index.ts`.
- Shared reviewer labels, example fixture data, example route constants, and `withCodePresentationExampleNavigation()` live in `src/lib/docs-primitives.ts`.
- `loadDocsShellNavigation()` in `src/lib/content/load-docs-navigation.ts` appends the code presentation example route through `withCodePresentationExampleNavigation()`.
- The reviewer-visible example surface is `src/components/docs/code-presentation-example.tsx`, rendered from `src/app/docs/examples/code-presentation/page.tsx` through `DocsShell` and the shared shell on the current site foundation.
- Shared docs article framing now lives in `src/components/docs/docs-content.tsx`; overview pages and example routes should reuse `DocsContentSurface` and `DocsContentCard` so docs intro/section framing stays aligned with the same primitive-backed styling path as the shell.
- Docs chrome is shared through `src/components/docs/docs-shell.tsx` (`SharedShell`); pass generated navigation and `currentPath` for active docs sidebar state.
- Primitive and diagram surfaces extend the shared token layer projected from `src/app/globals.css`; prefer semantic utilities (`bg-card`, `bg-muted`, `text-foreground`, `border-border`) over direct landing-only variables.
- Responsive docs diagrams rely on `min-w-0` shared-shell containers plus `.docs-diagram__*` baseline classes in `src/app/globals.css`; preserve that combination when adjusting docs example layout or diagram rendering.
- Deferred docs-specific global CSS should stay narrow: keep `.docs-diagram__*`, `.docs-breadcrumbs__*`, `.docs-progression__*`, and `.docs-page__body` only while those generated or third-party-backed surfaces still need structure-aware styling. New docs framing work should start from `DocsContentSurface`, `DocsContentCard`, and primitive utilities instead of extending those legacy selectors.

## Verification

- Component behavior tests belong in `tests/unit/docs-shell.test.tsx` (example surface headings, accessible labels, tab switching).
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
