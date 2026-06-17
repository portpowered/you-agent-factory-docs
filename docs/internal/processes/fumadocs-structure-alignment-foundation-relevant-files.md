# Fumadocs Structure Alignment Foundation Relevant Files

## Route ownership

- `src/app/docs/layout.tsx`
- `src/components/docs/fumadocs-docs-layout.tsx`
- `src/lib/content/docs-structure-source.ts`
- `src/lib/content/fumadocs-page-tree.ts`

These files define the checked-in Fumadocs ownership path for `/docs`. The app-route layout owns the framework seam, the wrapper configures the Fumadocs `DocsLayout`, the explicit `docs-structure-source` bridge loads canonical content once for the current docs route seam, and the page-tree projection maps that generated navigation into the Fumadocs page-tree shape.

## Route chrome compatibility bridge

- `src/components/docs/docs-route-chrome.tsx`
- `src/components/docs/docs-entry-content.tsx`
- `src/app/docs/page.tsx`
- `src/app/docs/[slug]/page.tsx`
- `src/app/docs/examples/code-presentation/page.tsx`
- `src/lib/content/load-doc-page.ts`
- `src/lib/content/load-docs-navigation.ts`

These files keep the existing search entry, breadcrumbs, progression, docs content loading, and docs-entry framing behavior on the current docs surfaces while the route shell moves to Fumadocs ownership. The compatibility boundary is now explicit: the Fumadocs layout consumes `fumadocsPageTree`, while the narrowed route chrome consumes `docsRouteNavigation`, and both projections come from the same canonical content source instead of separate docs registrations.

## Shared app integration

- `src/app/layout.tsx`

This root layout now includes the Fumadocs root provider with search and theme behavior explicitly disabled so the docs route can use the Fumadocs layout primitives without introducing a second search or theme contract.

## Verification surfaces

- `tests/unit/fumadocs-docs-layout.test.tsx`
- `tests/unit/static-export.test.ts`
- `tests/unit/reconciled-export-browser.test.ts`
- `tests/unit/site-budget.test.ts`
- `tests/unit/baseline-foundation.test.tsx`
- `tests/unit/docs-route-chrome.test.tsx`
- `tests/helpers/validation.ts`
- `src/lib/site-budget.ts`

These files prove the new shell ownership path, keep the static-export and browser checks aligned with the Fumadocs-owned docs route, and assert that generated navigation affordances, localized shell copy, the preserved search entry behavior, and the focused accessibility proof all flow through the narrowed compatibility bridge built from the shared canonical content source.

For reviewer-visible proof, the checked-in route behavior stays covered by `tests/unit/fumadocs-docs-layout.test.tsx`, `tests/unit/docs-route-shell.test.tsx`, `tests/unit/docs-route-chrome.test.tsx`, `tests/unit/shell-accessibility-validation.test.tsx`, `tests/unit/static-export.test.ts`, and `tests/unit/reconciled-export-browser.test.ts`, while the build/export contract now runs through the maintained repository entrypoints: `bun run validate:static-export` invokes `scripts/validate-static-export.ts`, which performs the aligned production export through `make build` before reusing the resulting `out/` snapshot in the served-export assertions.
