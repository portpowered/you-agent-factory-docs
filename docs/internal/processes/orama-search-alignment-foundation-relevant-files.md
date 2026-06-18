# Orama search alignment foundation — relevant files

## Reviewer proof surfaces

- `src/lib/content/orama-search.ts` is the checked-in Orama query seam for public search. It builds the index from `PublicSearchArtifact` entries instead of re-reading content files or maintaining a second bespoke query model.
- `src/components/docs/docs-search.tsx` is the active public search surface. It fetches `withBasePath("/search/public-search-index.json")`, parses the checked-in artifact, builds the Orama index in the client, and runs locale-filtered queries through the Orama seam.
- `public/search/public-search-index.json` remains the reviewer-inspectable generated contract that sits between normalized localized search documents and the live public search UI.

## Focused verification

- Query-path proof: `tests/unit/orama-search-alignment-foundation.test.ts` proves the checked-in generated artifact feeds the Orama-backed query seam and that representative English and French queries preserve canonical id and locale metadata through returned hits.
- User-facing proof: `tests/unit/reconciled-export-browser.test.ts` serves the static export, waits for the docs search UI to fetch `/you-agent-factory-docs/search/public-search-index.json`, then verifies that a representative `installation` query returns the public docs result on the reviewer-visible surface.
- Supporting component-level state coverage remains in `tests/unit/docs-route-shell.test.tsx`, which asserts explicit loading, empty, and success states for the docs search interaction on the live route shell seam.

## Out of scope for this slice

- Search ranking tuning beyond the current Orama field boosts.
- Richer search UX such as keyboard navigation, highlighting, grouped results, or cross-locale fallback blending.
- Broader shell migration, search-page redesign, or content-model changes beyond consuming the existing generated search artifact contract.

## Quality checks

- `bun test tests/unit/orama-search-alignment-foundation.test.ts`
- `bun test tests/unit/reconciled-export-browser.test.ts`
- `make check`
- `make test`
- `make build`
