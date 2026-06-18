# Search user experience foundation — relevant files

## Public search runtime seam

- `src/lib/search/public-search.ts` is the client-safe runtime seam for the public search surface.
- The module fetches the generated artifact from `withBasePath("/search/public-search-index.json")` so GitHub Pages exports and local static-export tests resolve the same path.
- Import search artifact types directly from `src/lib/content/search-artifact.ts` or other client-safe modules; do not import client search code through `@/lib/content` because that barrel also re-exports filesystem-backed loaders.
- `fetchPublicSearchArtifact()` validates the artifact shape before the UI consumes it.
- `searchPublicSearchArtifact()` is the narrow projection layer from artifact entries to ranked UI matches with preview text and preview-context metadata; locale-aware ordering should be expressed here through `activeLocale` projection options instead of re-reading content files or pushing ranking rules into the component.
- Collapse competing localized variants by `canonicalId` inside the projection seam so the visible results list shows one best match per canonical page while still allowing cross-kind matches from unrelated entries.
- Result-card relevance cues such as `summary`, `heading`, `tag`, `alias`, and body `excerpt` should stay in this pure seam so the component renders explicit context without inventing page-specific heuristics.

## Public docs search surface

- `src/components/search/public-search-panel.tsx` renders the visible docs-entry search surface with explicit `idle`, `loading`, `error`, and `success` states.
- The panel caches the fetched artifact in component-local state and only reads from the generated artifact URL; it does not perform raw markdown or starter-content reads.
- The panel renders localized content-kind labels and preview-context badges directly from projected match metadata; keep those labels in `docs.search.*` rather than hardcoding presentation copy in the component.
- Keep the primary keyboard path native-first: submit from the search field, then move focus into result links with explicit arrow-key handlers instead of introducing a separate pointer-only selection model.
- For input-to-result focus movement, keep a direct focus attempt in the key handler and mirror it in the link ref callback so keyboard navigation still lands on the intended result if the result list finishes mounting on the same interaction tick.
- `src/app/docs/page.tsx` mounts the search panel on the existing docs entry route so reviewers can exercise the feature without changing route structure.
- Search UI copy lives under `docs.search.*` in the shared shell localization catalogs.
- `src/app/globals.css` contains the public search styles; keep the surface responsive by preserving the one-column mobile controls path.

## Verification seams

- `tests/unit/public-search.test.ts` covers the artifact URL, shape validation, ranking, and preview projection.
- `tests/unit/public-search-panel.test.tsx` covers rendered `loading`, `empty`, `error`, and `success` states by mocking the browser fetch path.
- `tests/unit/public-search-browser.test.ts` covers the exported-site reviewer path against the built static export and uses route interception to prove loading, failure, and keyboard-only result activation behavior.
- `tests/unit/static-export-server.test.ts` should assert against stable reviewer-visible export content such as `PROJECT_TAGLINE`, not unstable framework bytes at the start of generated HTML.
