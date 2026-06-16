# Rich code presentation primitives foundation — relevant files

## Contributor command path

- Root `Makefile` is the shared entrypoint: `setup`, `check`, `test`, `build`.
- `make check` runs `bun run typecheck` then `bun run lint` (Biome).
- `make test` runs `bun test` with happy-dom preloaded from `bunfig.toml`.

## Primitive components

- Reusable docs primitives live under `src/components/docs/primitives/` and are re-exported from `src/components/docs/primitives/index.ts`.
- Shared reviewer labels, example fixture data, and the example route constant live in `src/lib/docs-primitives.ts`.
- The reviewer-visible example surface is `src/components/docs/code-presentation-example.tsx`, rendered from `src/app/docs/examples/code-presentation/page.tsx`.
- Docs chrome is shared through `src/components/docs/docs-shell-layout.tsx`; overview content remains in `src/components/docs/docs-shell.tsx`.
- Primitive styles extend `src/app/globals.css` using the existing landing/docs CSS variables.

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
