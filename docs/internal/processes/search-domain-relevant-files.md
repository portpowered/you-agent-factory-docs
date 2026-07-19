# Search Domain Relevant Files

Use these files when changing search document construction, Orama indexing, or
`/api/search` behavior.

## Core search boundary

* `src/lib/search/factory-search-kinds.ts`
  Factory-only public search result kinds (`guide`, `concept`, `technique`,
  `documentation`, `glossary`, `reference`, `blog`) plus retired Atlas kind
  denylist and fail-closed `assertFactorySearchDocuments` used by document
  builders. `REFERENCE_SEARCH_DOCUMENT_KIND` is the shared page/item kind for
  W16 reference search projection (aligned with W04/W09 search shapes).
* `src/lib/search/adapt-reference-search-document.ts`
  Pure adapter from W04/W09 `ReferenceSearchDocumentShape` → live Orama
  `SearchDocument` (kind `reference`, fragment URL required, empty topology).
  `enrichReferenceItemAliases` merges title + registry anchor with
  shape-provided common-name / discriminator aliases (W16 story 005).
  `referenceItemEnglishSearchFields` projects English identity fields for
  cross-locale equality proofs (W16 story 007).
* `src/lib/search/create-search-catalog-from-documents.ts`
  Builds the Fumadocs advanced Orama server from parsed documents. Always
  uses `FACTORY_SEARCH_ORAMA_LANGUAGE` (`english`) so non-`en` UI locale
  catalogs still tokenize/stem English contract identifiers (W16-007).
* `src/lib/search/build-reference-search-documents.ts`
  Loads settled inventory shapes (events corpus, API operations, schema
  definitions/fields, CLI commands, MCP tools, JavaScript runtime symbols /
  shared schemas), adapts them, and caches for shared locale builds.
* `src/lib/search/build-api-reference-search-documents.ts`
  W16 story 003: projects packaged OpenAPI operations into reference search
  shapes deep-linking to `/docs/references/api#<registry-anchor>`.
* `src/lib/search/build-schema-reference-search-documents.ts`
  W16 story 003: projects settled factory / you-config / mock-workers schema
  definitions and addressable field paths onto per-schema owning pages
  (`factory-schema`, `you-config-schema`, `mock-workers-schema`) — never the
  placeholder `/docs/references/schema` path.
* `src/lib/search/build-cli-mcp-javascript-reference-search-documents.ts`
  W16 story 004: projects packaged CLI commands, MCP tools, and JavaScript
  runtime symbols / shared schemas into reference search shapes deep-linking
  to `/docs/references/cli|mcp|javascript-runtime#<registry-anchor>` via
  shared `assign*RegistryAnchors` helpers.
* `src/lib/content/factory-search-categories.test.tsx`
  Required `bun run test` proof that pageKind labels, live search meta, and
  representative `harness` / `ralph` queries stay inside the factory category
  set and never advertise Model Atlas result kinds.
* `src/lib/content/factory-search-reference-kind.test.tsx`
  W16 story 001 required-suite proof that `reference` is a live search kind
  for page and item documents, stays aligned with W04
  `REFERENCE_SEARCH_DOCUMENT_KIND`, and a representative `/docs/references/events`
  hit exposes the reader-visible Reference category (not a retired Atlas kind).
* `src/lib/content/factory-search-reference-shape-adaptation.test.ts`
  W16 story 002 required-suite proof that W04/W09 event-corpus shapes adapt
  into live Orama documents with registry-anchor fragment URLs, join
  `buildSearchDocumentsForLocale` for every shipped locale, and remain
  findable via representative Orama queries.
* `src/lib/content/factory-search-api-schema-indexing.test.ts`
  W16 story 003 required-suite proof that API operations and schema
  definition/field items index as Orama documents with correct owning-page
  deep links (`/docs/references/api#…`, per-schema pages) and that
  representative `submitWorkBySessionId` / `workers` queries return item hits.
* `src/lib/content/factory-search-cli-mcp-js-event-indexing.test.ts`
  W16 story 004 required-suite proof that CLI commands, MCP tools, JavaScript
  symbols / shared schemas, and event variants index as Orama documents with
  correct owning-page deep links and that representative
  `you config init` / `you.factory_session.get` / `javascript.log` /
  `RUN_REQUEST` queries return item hits.
* `src/lib/content/factory-search-authored-pages-aliases.test.ts`
  W16 story 005 required-suite proof that authored factories / workers /
  workstations pages remain normal page documents (no fragment, kind
  `documentation`) and that reference item aliases cover literal
  discriminators (`RUN_REQUEST`) plus common names
  (`RunRequestEventPayload`), with representative page + alias queries.
* `src/lib/content/factory-search-item-hits-above-page-crowding.test.ts`
  W16 story 006 required-suite proof that collapse/rerank preserves
  reference item deep-link URLs (`#…`) instead of collapsing solely to the
  owning page, while ordinary non-reference pages still collapse to bare
  page URLs.
* `src/lib/content/factory-search-english-identifiers-every-locale.test.ts`
  W16 story 007 required-suite proof that shipped locales (`en`, `ja`,
  `zh-CN`, `vi`) share identical English reference identifiers/aliases in
  searchable fields, Orama language stays `english` for every UI locale
  catalog, and representative English identifier queries succeed against
  non-`en` locale catalogs (same item URL/anchor contract). Does not own
  W17 chrome localization.
* `src/lib/search/measure-reference-search-bootstrap-payload.ts`
  W16 story 008: measures serialized advanced-Orama bootstrap bytes for
  reference-item documents and each shipped locale catalog (same
  `JSON.stringify(payload) + "\\n"` shape as `emitExportSearchIndex`), then
  compares the locale sum to `FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes`.
* `src/lib/content/factory-search-payload-gate-representative-queries.test.ts`
  W16 story 008 required-suite proof that the expanded bootstrap payload
  stays within the factory search budget (raised with measured evidence after
  ~585 item documents) and that representative
  `submitWorkBySessionId` / factory-schema `workers` / `Poller behavior` /
  `RUN_REQUEST` / `you config init` / `you.factory_session.get` queries return
  item-level deep links via live `docsSearchApi.search`.
* `src/lib/content/factory-search-alias-body-tag.test.ts`
  Required `bun run test` proof that factory alias, body-phrase, and tag
  queries find live pages (`agent runtime` → harness, `Ralph loop` → ralph,
  `Quickstart` → getting-started, `one-story-per-iteration` → ralph,
  `foundations` tag → `/blog/bottlenecks`) without needing Atlas tags.
* `src/lib/search/factory-search-deleted-records.ts`
  Deleted Atlas URL denylist (retired route prefixes + deleted blog URLs),
  locale-aware matching, and fail-closed
  `assertNoDeletedAiSearchDocuments` used by document builders.
* `src/lib/content/factory-search-deleted-records.test.ts`
  Required `bun run test` proof that public search documents, advanced
  indexes, search-result meta, and queries such as `grouped-query attention`
  / `GQA` / `evolution of diffusion` never surface deleted AI records while
  `harness` / `ralph` stay searchable.
* `src/lib/content/factory-locale-base-path.ts`
  Factory locale + Pages base-path contract (`FACTORY_SHIPPED_LOCALES`,
  `FACTORY_PAGES_BASE_PATH=/you-agent-factory-docs`) with resolvers for
  localized search-result hrefs and search bootstrap, plus fail-closed
  asserts. SearchResultRow / SearchPagePanel use
  `resolveFactorySearchResultHref`.
* `src/lib/content/factory-locale-base-path.test.tsx`
  Required `bun run test` proof that shipped locales (en, ja, zh-CN, vi)
  preserve locale routing on search/nav hrefs, default-locale roots stay
  unprefixed, and project-site export prefixes bootstrap + nav under
  `/you-agent-factory-docs`.
* `src/lib/content/factory-search-edge-cases.ts`
  Factory empty/malformed/unavailable/deleted-content contract:
  `FACTORY_SEARCH_EMPTY_SUGGESTION_TERM` (`harness`) + ralph docs href,
  Atlas handoff denylist, malformed classification fixtures, unavailable
  error test ids, and fail-closed asserts. `SearchPagePanel` resolves empty
  suggestions through `resolveFactorySearchEmptySuggestion`.
* `src/lib/content/factory-search-edge-cases.test.tsx`
  Required `bun run test` proof that empty copy stays factory-only, no-match
  queries return empty, malformed classifications fall back unscoped,
  unavailable bootstrap stays on `/api/search` with error/retry copy, and
  deleted Atlas destinations remain not-found / undiscoverable from
  search/nav chrome.
* `src/lib/content/factory-search-navigation-convergence.test.tsx`
  Story 009 cross-cutting end-to-end gate: required-suite proof that factory
  categories, alias/body/tag discovery, deleted-record exclusion,
  tags/browse/breadcrumb/sidebar/previous-next/related, locale/base-path,
  and empty/malformed/unavailable/deleted-content cases stay factory-only
  together. Per-story suites (001–008) remain the detailed contracts.
* `src/lib/search/build-base-document.ts`
  Generic base search document construction from localized docs pages and
  registry fields. Produces page-derived fields with empty topology and
  kind/tag facets only.
* `src/lib/search/enrich-search-document.ts`
  Generic enrichment step that resolves published classification lineage, topology
  relationship terms, and legacy taxonomy compatibility onto base documents.
* `src/lib/search/build-documents.ts`
  Search builder: composes base documents with generic `enrichSearchDocument`
  only, then asserts every document kind is in `FACTORY_SEARCH_RESULT_KINDS`
  and every URL is outside the deleted Atlas inventory denylist. Also omits
  W18 documentation-route-migration old browse paths
  (`isDocumentationRouteMigrationOldBrowsePath`) so move stubs stay out of
  ordinary search while compatibility HTML remains published. Model Atlas
  AI facet enrichment (`modelFamily`, `sourceType`, `modalities`,
  `trainingRegimeIds`, `optimizes`) is no longer applied.
* `src/lib/content/factory-search-documentation-route-migration-exclusion.test.ts`
  Required-suite proof that §10 old stub URLs are absent from search documents
  / advanced indexes / representative API queries while family destinations
  remain findable and stub pages stay published for compatibility.
* `src/lib/verify/concepts-program-docs-discovery-r02-convergence.test.ts` /
  `src/lib/verify/focused-repair-suites-r02-convergence.test.ts`
  R02 discovery suites treat remaining non-stub Program documentation pages as
  ordinary search/sitemap destinations and lock W18 move stubs as
  compatibility-only (family search targets; stub URLs omitted).
* `src/lib/search/to-advanced-index.ts`
  Projects `SearchDocument` records into Fumadocs advanced search indexes.
* `src/lib/search/search-server.ts`
  Localized search catalog, `/api/search` query handling, classification scope,
  and reranking. Collapse preserves reference item deep links (W16-006).
* `src/lib/search/collapse-search-results-to-page-hits.ts`
  Groups ordinary fragment/heading/page duplicates to one bare page URL while
  keeping registered reference item documents as separate `#fragment` rows.
* `src/app/api/search/route.ts`
  Public search API route; re-exports `docsSearchApi.GET`.

### Pattern: factory-only search result kinds

Public search categories / result-kind labels are the factory set only. Keep
`FACTORY_SEARCH_RESULT_KINDS` as the single allowlist (including first-class
`reference` for page and item documents), assert it when building documents,
and prove reader-facing labels via `messages.pageKind` (no Atlas keys such as
`module` / `model` / `paper`). Place the required-suite proof under
`src/lib/content/` because `src/lib/search/` remains excluded from
`run-website-functionality-tests.ts` for leftover Atlas-coupled suites. W16
reference-item Orama projection reuses `REFERENCE_SEARCH_DOCUMENT_KIND` rather
than inventing a second public category. Adapt W04/W09 shapes through
`adaptReferenceSearchShapeToSearchDocument` and include them via
`buildReferenceItemSearchDocuments` in `buildSearchDocumentsForLocale` /
`loadSearchDocumentsByLocale` (shared once across locales). Authored
factories / workers / workstations pages stay normal page documents;
`enrichReferenceItemAliases` adds title + registry anchor alongside
shape-provided common-name / discriminator aliases so literals like
`RUN_REQUEST` and names like `RunRequestEventPayload` stay searchable.
`collapseSearchResultsToPageHits` preserves registered reference item
documents (kind `reference` + `#fragment`) as deep-link rows instead of
collapsing them into the bare owning-page URL; ordinary heading/text
duplicates still collapse to one page hit. Every locale catalog reuses the
same English reference item documents and indexes Orama with
`FACTORY_SEARCH_ORAMA_LANGUAGE` (`english`) so canonical English identifiers
remain findable from `ja` / `zh-CN` / `vi` UI locales without translating
those literals (W16-007; W17 owns broader chrome localization). W16-008
measures the expanded bootstrap via
`measureReferenceSearchBootstrapPayload` and gates the locale sum against
`FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes` (raise the
ceiling only with measured evidence — ~29.69 MiB after ~585 item documents).
Prove representative family queries through live `docsSearchApi.search`.
When search loads the events corpus during static-export catalog build,
`eventsOpenApiTurbopackLoadDependencies` must use the ancestor
`node_modules` walk (`resolveApiPackageManifestFsPath`) — webpack stubs
`createRequire().resolve` and can return a non-string module id.
Layout `metaByUrl` must **omit** reference item documents (kind
`reference` + `#fragment`); embedding them previously inflated every
HTML/RSC payload by ~2 MiB. Client collapse preserves
`/docs/references/…#…` via URL shape when meta has no item rows; server
catalogs that include item docs still require membership so ordinary
reference-page headings collapse.

### Pattern: reference owning pages and inventory items omit standalone heading rows

Fumadocs advanced search turns `structuredData.headings` into standalone
`type: "heading"` hits at `#heading-N`. For reference owning pages
(`/docs/references` and `/docs/references/**` without a registry-anchor
fragment) **and** true inventory item deep links (`/docs/references/…#…`
with a non-`heading-N` fragment), `toStructuredData` must emit an empty
`headings` array and leave content blocks without a `heading` fragment so
subsection titles and item auto-heading children cannot flood search. Fold
collected heading text into page-level content so owning pages and exact
inventory identifiers stay discoverable on their canonical URLs. Gate with
`shouldSuppressReferenceStandaloneSearchHeadings` (owning-page + inventory
helpers in `reference-owning-page-search-url.ts`). Prove via live Orama
outcomes: no `#heading-N` rows for owning pages or exact MCP/API/CLI/JS
identifier queries; registry-anchor item URLs still match; bare `#heading-N`
is never treated as an inventory item (`resolveReferenceItemDeepLinkUrl`).

### Pattern: generic queries prefer page titles over reference item/heading spam

`rerankSearchResults` must boost **every** page-level title/slug/alias match
(score ≥ 90), not only the single best seeded URL. Otherwise a generic query
like `mcp` keeps `/docs/concepts/mcp` on top while
`/docs/documentation/mcp` and `/docs/references/mcp` sink below the inventory
item flood (`#you.factory_session.*`, `you mcp`, …). Exact inventory title /
direct-alias matches (score ≥ 95) still outrank incidental owning-page body
hits. Residual `type: "heading"` / `#heading-N` rows under
`/docs/references/**` demote below ordinary hits. Prove with unit fixtures in
`rerank-search-results.test.ts` and live `docsSearchApi.search("mcp")` /
`you.factory_session.get` outcomes in
`prefer-page-titles-over-reference-heading-spam.test.ts`. Lock the same
observable outcomes (page preference, no `#heading-N`, exact MCP/API/CLI/JS
deep links) in `src/tests/search/reference-heading-despam-contract.test.ts`
and keep both files on the reader-facing required suite path. Collapse must
also fold bare reference `#heading-N` spam into the owning page URL
(`collapse-search-results-to-page-hits.test.ts`).

### Pattern: factory alias / body / tag discovery

Live factory pages are discoverable by frontmatter/registry aliases, distinctive
body phrases, and published factory tags. Prefer representative factory fixtures
(`agent runtime`, `Ralph loop`, `Quickstart`, `one-story-per-iteration`,
`foundations` → `/blog/bottlenecks`) in required-suite proofs. Do not depend on
retired Atlas tags (`attention`, `model-family`, `inference`, `alignment`) for
discovery success. Keep these proofs under `src/lib/content/` so `bun run test`
runs them.

### Pattern: deleted AI records stay out of search

Public search documents, advanced indexes, search-result meta, and `/api/search`
results must never include retired Atlas route families (`/docs/models`,
`/docs/modules`, `/docs/papers`, `/docs/training`, `/docs/systems`) or deleted
Atlas blog URLs (`evolution-of-diffusion`,
`llms-no-longer-wholly-reliant-on-the-internet`,
`roofline-throughput-explorer`). Keep the denylist + fail-closed assert in
`factory-search-deleted-records.ts`, wire it through document builders, and
prove with required-suite coverage under `src/lib/content/` using
representative deleted-inventory queries (`grouped-query attention`, `GQA`,
`evolution of diffusion`) plus live factory keepers (`harness`, `ralph`).

### Pattern: factory search/nav convergence end-to-end gate

When a lane finishes converging search + navigation onto factory-only
collections, keep a single required-suite cross-cutting proof under
`src/lib/content/factory-search-navigation-convergence.test.tsx` that exercises
categories, alias/body/tag discovery, deleted-record exclusion, tags/browse,
breadcrumb/sidebar, previous/next/related, locale/base-path, and edge cases
together. Do not replace the per-story suites; the convergence file is the
PRD-level gate before SEO / later B09c lanes depend on the contract. Pair with
`make linkcheck` and browser verification of representative factory surfaces.

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
* `src/lib/search/to-structured-data.test.ts`
  Reference owning-page + inventory-item heading de-spam: empty
  `structuredData.headings`, no `#heading-N` Orama rows for owning pages or
  exact MCP/API/CLI/JS identifier queries; heading text folded into
  page/item-level content; `#heading-N` rejected as inventory.
* `src/lib/search/prefer-page-titles-over-reference-heading-spam.test.ts`
  Generic `mcp` page-title preference over inventory/heading spam; exact
  `you.factory_session.get` still returns the item deep link first.
* `src/tests/search/reference-heading-despam-contract.test.ts`
  Reader-facing lock for generic `mcp` page preference + no `#heading-N`,
  plus exact MCP/API/CLI/JS inventory deep-link availability.
* `src/lib/search/reference-owning-page-search-url.test.ts`
  URL gates for owning pages, inventory item deep links, `#heading-N`
  rejection, and standalone-heading suppression.
* `src/lib/reader-facing-required-test-paths.ts`
  Includes the reference heading de-spam proofs above so
  `make test-reader-facing` / CI keep the contract green.
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
  Live published-page search indexing for the default locale, including the
  W18 move-stub exclusion (stubs stay published; ordinary search omits them),
  plus topology normalization coverage.
* `src/tests/search/search-api.test.ts`
  `/api/search` HTTP contract and `docsSearchApi` ranking regressions.
* `src/tests/search/helpers.ts`
  Shared search test URLs and result assertion helpers.

## Header search chrome (shell)

* `src/features/docs/search/SearchTrigger.tsx`
  Header search control (`data-search`); uses `messages.search.open` /
  `messages.search.shortcut` for trigger chrome. Resting fill is
  `!bg-background` (matches header/page background)—not
  `bg-secondary/50`. Border, accent hover, and `focus-visible:ring-*`
  stay on the trigger.
* `src/app/globals.css`
  `button[data-search]` resting background is `var(--background)` so the
  header trigger blends at rest; scoped to `button` so the `/search` page
  input (`input[data-search]`) keeps transparent-on-card fill. Hover
  accent rules remain under `[data-search][data-search]:hover`.
* `src/features/docs/search/SearchDialog.tsx`
  Dialog input placeholder comes from `messages.search.placeholder`.
* `src/content/messages/{en,vi,ja,zh-CN}/common.json`
  Header/dialog search chrome and public search metadata
  (`search.placeholder`, `search.idle`, `searchEntry.description`) must
  identify you-agent-factory docs (or neutral CLI docs search), not Model
  Atlas. Prove via `loadUiMessages` / route metadata assertions
  (`src/tests/content/ui-messages.test.ts`,
  `src/tests/features/search-ui.test.ts`,
  `src/tests/layout/localized-route-metadata.test.ts`).
  Search empty-state suggestions use `searchEntry.emptySuggestionTerm` +
  `emptySuggestionLinkLabel` pointing at live factory docs (for example
  term `harness` and link `/docs/techniques/ralph`), not Atlas GQA /
  attention tag handoffs. `SearchPagePanel` owns that wiring via
  `resolveFactorySearchEmptySuggestion` from
  `factory-search-edge-cases.ts`; lock with message assertions plus the
  required `factory-search-edge-cases.test.tsx` suite (and optional
  `search-page-panel` empty-state coverage).
* `src/components/layout/docs-header.tsx`
  Mounts `SearchTrigger` as the first-class Search destination; primary nav
  must not also link `/search` (avoids duplicating the same control).
* `src/features/docs/search/SearchTrigger.test.tsx` and
  `src/tests/layout/home-shell-styling-contract.test.tsx`
  Lock resting `!bg-background` (no `bg-secondary/50`) plus hover/focus
  accent and focus-ring classes on the header trigger. The home-shell
  contract also locks shared prose/chrome link underline accent
  (`proseAutoLinkClassName`: `text-secondary` + `decoration-secondary`,
  not primary yellow) alongside the quieter search fill.

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

### Pattern: B09 factory-only search ownership gate

After public-copy / empty-state / denylist repair, prove the cleanup gate with:

```sh
bun ./scripts/audit-retired-ai-content-infrastructure.ts
bun run check:retired-product-docs
bun test src/tests/content/ui-messages.test.ts -t "factory-only public search"
bun test src/tests/layout/localized-route-metadata.test.ts -t "home and search|localized shell metadata"
bun test src/tests/search/search-page-panel.test.tsx -t "empty state suggests live factory"
bun test src/lib/governance/retired-ai-content-infrastructure-denylist.test.ts
make check
bun run test
```

Worktree browser note: Claude worktrees often lack a local `node_modules`
(hoisted at repo root). Symlinking root `node_modules` makes Turbopack panic
(`Symlink …/node_modules is invalid, it points out of the filesystem root`).
For `/search` empty-state + metadata proof in that environment, use
`generateSearchMetadata()` / `loadUiMessages` plus the happy-dom
`search-page-panel` empty-state test (harness term + `/docs/techniques/ralph`
link; no GQA / attention tag handoff) instead of `bun run dev`/`start`.
