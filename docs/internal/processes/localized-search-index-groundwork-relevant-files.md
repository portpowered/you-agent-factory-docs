# Localized search index groundwork — relevant files

## Ownership boundary

- **`CanonicalContentRecord`** remains the source of truth for content identity, publication status, search visibility, `canonicalLocale`, and `availableLocales`.
- **`LocalizedContentVariantBinding`** remains the source of locale-specific page data and validated variant relationships.
- **`LocalizedSearchDocument`** is the normalized search-data contract projected from canonical records plus variant source text; later query UI is a downstream consumer and must not re-parse raw files.
- **`PublicSearchArtifact`** is the build-time search index artifact derived only from normalized localized search documents.

## Search document module

- Types and projection logic live in `src/lib/content/search-document.ts`; import from `@/lib/content`.
- `LocalizedSearchDocument` includes locale-aware metadata for later active-locale-first querying: `locale`, `canonicalLocale`, and `availableLocales` alongside searchable text fields, canonical id, route identity, and search priority.
- `buildLocalizedSearchDocumentId(canonicalId, locale)` returns stable ids such as `doc/getting-started@en`.
- `extractMarkdownHeadings()` and `extractSearchableBody()` derive searchable text from variant markdown without query-layer file access.
- `generateLocalizedSearchDocuments(bindings, readVariantSource)` emits one document per validated variant binding; callers inject source lookup to keep IO at the loader boundary.
- `isSearchableCanonicalContentRecord()` and `shouldIncludeVariantInSearch()` apply structured exclusion from canonical `status` and `searchInclude` metadata. Only `published` records with `searchInclude: true` emit search documents; `draft`, `internal`, `hidden`, and `search.include: false` variants are filtered before projection.

## Starter content integration

- `loadLocalizedSearchDocuments()` loads validated starter fixtures via `loadStarterContentRecords()`, asserts validation success with `assertStarterContentValid()`, and re-reads each variant source file through `resolveLocaleFileName()`.
- Variant bindings come from localized variant identity validation; search generation does not infer locale relationships from file paths alone.
- Exclusion of draft, internal, hidden, or `search.include: false` content is enforced in `generateLocalizedSearchDocuments()` via `shouldIncludeVariantInSearch()` before projection.

## Public search artifact

- Types and deterministic projection live in `src/lib/content/search-artifact.ts`; import from `@/lib/content`.
- `buildPublicSearchArtifact()` maps normalized `LocalizedSearchDocument` values into `PublicSearchArtifact` entries without a separate indexing-only parser.
- `loadPublicSearchArtifact()` and `writePublicSearchArtifact()` in `src/lib/content/load-search-artifact.ts` load starter content through `loadLocalizedSearchDocuments()` before emitting the artifact.
- `src/lib/content/orama-search.ts` is the Orama-backed query seam. It consumes the generated `PublicSearchArtifact`, inserts one normalized document per artifact entry into Orama, and exposes the later public-search query path without reopening content parsing.
- `src/components/docs/docs-search.tsx` is the narrow public docs-search consumer. It fetches the checked-in artifact from static export, builds the Orama index client-side, and queries only through `src/lib/content/orama-search.ts`.
- `scripts/generate-search-index.ts` writes `public/search/public-search-index.json` for reviewer inspection and static export consumption.
- `src/lib/validation/search-index.ts` and `scripts/validate-search-index.ts` validate that the checked-in `public/search/public-search-index.json` artifact still matches a fresh projection from normalized localized search documents.
- `bun run generate:search-index` runs before `next build`; later search UX should read the generated artifact contract rather than re-parsing raw content files.
- When wiring public search UI, fetch `withBasePath("/search/public-search-index.json")` so the artifact resolves under GitHub Pages `basePath` during static export verification.
- Artifact entries expose locale, `canonicalLocale`, `availableLocales`, canonical id, route or URL identity, searchable text fields, and search priority for representative entries.
- Parallel locale variants for one canonical page share the same `canonicalId`, `canonicalLocale`, and `availableLocales` while keeping distinct `locale` and variant-specific searchable text.
- When adding query behavior, preserve `PublicSearchArtifact` as the build-time contract and derive any Orama compatibility shape from artifact entries inside the adapter instead of widening the artifact or re-reading MDX at query time.

## Tests

- Focused search-document projection and starter loading proof: `tests/unit/localized-search-documents.test.ts`.
- Generated public search artifact contract proof: `tests/unit/public-search-artifact.test.ts`.
- Cross-layer inclusion, exclusion, and artifact alignment proof: `tests/unit/localized-search-index-foundation.test.ts`.
- Orama alignment proof belongs in `tests/unit/orama-search-alignment-foundation.test.ts`; prefer asserting that representative queries return artifact-backed entries with preserved locale metadata.
- Public search UI proof belongs in `tests/unit/docs-shell.test.tsx`; prefer runtime assertions that localized queries surface representative docs, plus explicit empty and artifact-load error states.
- Prefer asserting observable generated document fields, canonical ids, locale metadata, and searchable text—not helper inventories or source-file topology scans.
- Exclusion proofs should load a temporary starter content root with one published variant plus representative `draft`, `internal`, `hidden`, and `search.include: false` variants, then assert both `loadLocalizedSearchDocuments()` and `loadPublicSearchArtifact()` omit the excluded canonical ids.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
- `bun run generate:search-index` to inspect `public/search/public-search-index.json`
- `make validate-search-index` / `bun run validate:search-index` to validate the checked-in artifact contract without running the broader quality gate
