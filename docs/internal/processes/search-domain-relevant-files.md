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

* `src/lib/content/purge-legacy-public-indexes.test.ts`
  Story proof that public search documents, advanced indexes, search-result
  meta, tag registry/index, and blog/tags/search HTML omit deleted Atlas blog
  URLs (`evolution-of-diffusion`, `llms-no-longer-wholly-reliant-on-the-internet`,
  `roofline-throughput-explorer`) and Atlas-only tags (`model-family`,
  `inference`, `alignment`) while keeping factory blog posts and tags.
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
  Header/dialog search chrome and public search metadata
  (`search.placeholder`, `search.idle`, `searchEntry.description`) must
  identify you-agent-factory docs (or neutral CLI docs search), not Model
  Atlas. Prove via `loadUiMessages` / route metadata assertions.
  Search empty-state suggestions use `searchEntry.emptySuggestionTerm` +
  `emptySuggestionLinkLabel` pointing at live factory docs (for example
  term `harness` and link `/docs/techniques/ralph`), not Atlas GQA /
  attention tag handoffs. `SearchPagePanel` owns that wiring.
* `src/components/layout/docs-header.tsx`
  Mounts `SearchTrigger` as the first-class Search destination; primary nav
  must not also link `/search` (avoids duplicating the same control).

## Static export bootstrap path (GitHub Pages)

* `src/lib/search/docs-search-bootstrap-path.ts`
  Resolves `/api/search` (root) vs `/you-agent-factory-docs/api/search`
  (project-site export) via `resolveGitHubPagesBasePath` + `withBasePath`.
  `bakeDocsSearchStaticBootstrapFromEnv` writes
  `NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM` onto the env object so Next/SWC
  inlining sees the value on `process.env`, not only via the `next.config`
  `env` map. `next.config.ts` calls that helper at load time.
* `src/features/docs/search/search-client.ts`
  Client `"use client"` module. `readBakedDocsSearchStaticFrom` and
  `docsSearchStaticOptions` / `buildDocsSearchStaticOptions` use a literal
  `process.env.NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM` access so the baked
  path is inlined into `out/_next/static/chunks` (no post-build rewrite).
* `src/lib/build/verify-export-search-bootstrap-client-path.ts`
  Export-chunk verifier for the baked bootstrap literal.
* `src/lib/build/verify-project-site-export-consumers.ts`
  Composite export-consumer gate: project-site chunk content must include
  `/you-agent-factory-docs/api/search` and fails when only an unprefixed
  `/api/search` bootstrap bake is present.
* `src/lib/build/guard-pages-deployed-artifact.ts`
  Deploy-path HTTP probe. Prefixed bootstrap presence uses
  `readExportClientChunkContents` (all `out/_next/static/chunks/*.js`), not
  only the first HTML script tag — Next code-splits the search-client bake
  into a separate chunk. Single-chunk HTTP GET still proves asset URL prefix.
* Focused coverage: `bun run test:website:static-search` (includes
  `docs-search-bootstrap-path`, `export-search-bootstrap`, and
  `verify-export-search-bootstrap-client-path` tests) plus
  `bun run test:website:export-consumers` / `test:build-contract` for the
  chunk-contract failure when only `/api/search` ships. Prefer
  `BUILT_APP_GITHUB_PAGES_BASE_PATH` over retired `/ai-model-reference`
  fixtures.

### Pattern: bake NEXT_PUBLIC search bootstrap onto process.env

Project-site static export must set both:

1. `process.env.NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM` (via
   `bakeDocsSearchStaticBootstrapFromEnv(process.env)` in `next.config.ts`)
2. `next.config` `env[NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM]`

Setting only the config `env` map can leave client chunks with the
`/api/search` fallback when SWC reads `process.env` for `NEXT_PUBLIC_*`
inlining. Do not post-build rewrite chunk files to inject the prefix.

### Pattern: literal NEXT_PUBLIC access in search-client static from

Client code must read `process.env.NEXT_PUBLIC_DOCS_SEARCH_BOOTSTRAP_FROM`
with a static property access (see `readBakedDocsSearchStaticFrom`). Dynamic
`env[DOCS_SEARCH_BOOTSTRAP_FROM_ENV]` is fine in server/build helpers but is
not inlined into client chunks — that leaves Orama static `from` on the
fumadocs default `/api/search`.
