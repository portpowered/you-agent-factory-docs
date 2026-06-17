# Fumadocs Structure Alignment Foundation Relevant Files

## Route ownership

- `src/app/docs/layout.tsx`
- `src/components/docs/fumadocs-docs-layout.tsx`
- `src/lib/content/fumadocs-page-tree.ts`

These files define the checked-in Fumadocs ownership path for `/docs`. The app-route layout owns the framework seam, the wrapper configures the Fumadocs `DocsLayout`, and the bridge projects the existing generated docs navigation into the Fumadocs page-tree shape.

## Route chrome compatibility bridge

- `src/components/docs/docs-route-chrome.tsx`
- `src/components/docs/docs-entry-content.tsx`
- `src/app/docs/page.tsx`
- `src/app/docs/[slug]/page.tsx`
- `src/app/docs/examples/code-presentation/page.tsx`

These files keep the existing search entry, breadcrumbs, progression, and docs-entry framing behavior on the current docs surfaces while the route shell moves to Fumadocs ownership. The `docs-entry-content` leaf keeps visible `/docs` copy on the shared localization path without pushing message lookups back into the server route.

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

These files prove the new shell ownership path, keep the static-export and browser checks aligned with the Fumadocs-owned docs route, and assert that generated navigation affordances, localized shell copy, and the preserved search entry behavior still flow through the narrowed compatibility bridge.
