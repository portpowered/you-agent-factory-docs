# Localized search index groundwork — relevant files

## Ownership boundary

- **`CanonicalContentRecord`** and **`LocalizedContentVariantBinding`** remain the content-domain inputs. Search generation projects a separate **`LocalizedSearchDocument`** contract without introducing a parallel content parser.
- **`LocalizedSearchDocument`** (`src/lib/content/search-document.ts`) is the normalized search-data shape for later query consumers: title, description, headings, body text, tags, aliases, kind, section, locale, canonical id, route identity, and search priority.
- **`projectLocalizedSearchDocument()`** and **`generateLocalizedSearchDocuments()`** stay pure; filesystem reads live in **`loadLocalizedSearchDocuments()`**.

## Search document module

- Types and projection logic live in `src/lib/content/search-document.ts`; import from `@/lib/content`.
- `buildLocalizedSearchDocumentId(canonicalId, locale)` returns stable ids such as `doc/getting-started@en`.
- `extractMarkdownHeadings()` and `extractSearchableBody()` derive searchable text from variant markdown without query-layer file access.
- `generateLocalizedSearchDocuments(bindings, readVariantSource)` emits one document per validated variant binding; callers inject source lookup to keep IO at the loader boundary.
- `isSearchableCanonicalContentRecord()` and `shouldIncludeVariantInSearch()` apply structured exclusion from canonical `status` and `searchInclude` metadata. Only `published` records with `searchInclude: true` emit search documents; `draft`, `internal`, `hidden`, and `search.include: false` variants are filtered before projection.

## Starter content integration

- `loadLocalizedSearchDocuments()` loads validated starter fixtures via `loadStarterContentRecords()`, asserts validation success with `assertStarterContentValid()`, and re-reads each variant source file through `resolveLocaleFileName()`.
- Variant bindings come from localized variant identity validation; search generation does not infer locale relationships from file paths alone.
- Exclusion of draft, internal, hidden, or `search.include: false` content is enforced in `generateLocalizedSearchDocuments()` via `shouldIncludeVariantInSearch()` before projection.

## Tests

- Focused search-document projection and starter loading proof: `tests/unit/localized-search-documents.test.ts`.
- Prefer asserting observable generated document fields, canonical ids, locale metadata, and searchable text—not helper inventories or source-file topology scans.

## Quality checks

- `make check` / `bun run typecheck` + `bun run lint`
- `make test` / `bun test`
