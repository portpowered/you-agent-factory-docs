# Search Domain Relevant Files

Use these files when changing search document construction, Orama indexing, or
`/api/search` behavior.

## Core search boundary

* `src/lib/search/build-base-document.ts`
  Generic base search document construction from localized docs pages and
  registry fields. Produces page-derived fields with empty topology and
  kind/tag facets only.
* `src/lib/search/enrich-search-document.ts`
  Generic enrichment step that resolves published classification lineage, topology
  relationship terms, and legacy taxonomy compatibility onto base documents.
* `src/lib/search/build-documents.ts`
  Search builder: composes base documents with generic `enrichSearchDocument`
  only. Model Atlas AI facet enrichment (`modelFamily`, `sourceType`,
  `modalities`, `trainingRegimeIds`, `optimizes`) is no longer applied.
* `src/lib/search/to-advanced-index.ts`
  Projects `SearchDocument` records into Fumadocs advanced search indexes.
* `src/lib/search/search-server.ts`
  Localized search catalog, `/api/search` query handling, classification scope,
  and reranking.
* `src/app/api/search/route.ts`
  Public search API route; re-exports `docsSearchApi.GET`.

## Parity and regression tests

* `src/tests/search/search-behavior-parity.test.ts`
  Focused baseline for attention, GQA alias, tag, and classification-scoped
  search. Extend this file when adding new parity assertions for enrichment.
* `src/tests/search/search-api-contract-parity.test.ts`
  `/api/search` bootstrap export and query contract parity for GQA, attention,
  tag-filtered, and classification-scoped searches.
* `src/lib/search/to-advanced-index.test.ts`
  Fumadocs advanced index projection contract for `id`, `title`, `description`,
  `url`, `structuredData`, and `tag` fields.
* `src/lib/search/build-base-document.test.ts`
  Generic base document field contract and empty topology/facet guarantees.
* `src/lib/search/build-documents.test.ts`
  Builder contract: generic enrichment only; asserts Atlas AI-only facet keys
  are absent from built documents.
* `src/tests/fixtures/non-ai-shell/search.test.ts`
  Non-AI fixture base and generic-enrichment search document fields and Orama
  query behavior without AI registry enrichment; uses
  `buildNonAiShellFixtureBaseSearchDocuments()` and
  `buildNonAiShellFixtureSearchDocuments()` (shared enrichment only).
* `src/tests/fixtures/non-ai-shell/fixture.ts`
  Non-AI shell fixture pages and search builders; `buildNonAiShellFixtureSearchDocuments`
  composes base documents with `enrichSearchDocuments` for the generic search proof.
* `src/lib/search/enrich-search-document.test.ts`
  Generic enrichment topology/facet contract, searchable topology terms, and draft or
  missing-target stability coverage.
* `src/tests/search/build-documents.test.ts`
  Document construction and topology normalization coverage (Atlas page fixtures;
  excluded from required `make test` after Atlas deletion).
* `src/tests/search/search-api.test.ts`
  `/api/search` HTTP contract and `docsSearchApi` ranking regressions.
* `src/tests/search/helpers.ts`
  Shared search test URLs and result assertion helpers.

## Header search chrome (shell)

* `src/features/docs/search/SearchTrigger.tsx`
  Header search control (`data-search`); uses `messages.search.open` /
  `messages.search.shortcut` for trigger chrome.
* `src/features/docs/search/SearchDialog.tsx`
  Dialog input placeholder comes from `messages.search.placeholder`.
* `src/content/messages/{en,vi,ja,zh-CN}/common.json`
  Header/dialog search chrome copy. Placeholder must identify
  `you-agent-factory` (or neutral CLI docs search), not Model Atlas.
* `src/components/layout/docs-header.tsx`
  Mounts `SearchTrigger` as the first-class Search destination; primary nav
  must not also link `/search` (avoids duplicating the same control).
