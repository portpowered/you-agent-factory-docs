# Shell Domain Relevant Files

Use these files when changing collection-driven browse, section index, sidebar,
or shell fixture proofs that must stay independent from AI registry helpers.

## Generic shell primitives

* `src/lib/docs/collection-definition-contract.ts`
  Shared `ShellCollectionDefinition` contract for AI and non-AI collections.
  Public `DocsCollectionId` / `DOCS_COLLECTION_IDS` are factory-only:
  `guides`, `concepts`, `techniques`, `documentation`, `glossary`. Retired
  Atlas ids (`models`, `modules`, `papers`, `training`, `systems`) are not in
  the public collection contract; sidebar grouping resolvers are only
  `glossary` and `concepts`.
* `src/lib/docs/docs-collection-definitions.ts`
  Canonical inventory matching `DOCS_COLLECTION_IDS`. CLI collections keep
  empty `starterSlugs`; glossary keeps route-relative starters.
* `src/lib/docs/browse-collection-sections.ts`
  Collection-driven browse sections; default order is the four CLI collections
  from `CLI_DOCS_COLLECTION_IDS` via `DOCS_BROWSE_COLLECTION_IDS` /
  `DOCS_BROWSE_SECTION_ORDER`. Public browse no longer accepts glossary-derived
  Atlas section refs (Model Types / Inference / Module Components).
* `src/lib/docs/section-collection-index.ts`
  Generic section-index message resolution and `renderShellSectionCollectionIndexPage`.
  `SectionIndexFrontmatterKind` maps only factory kinds (`guide`, `concept`,
  `technique`, `documentation`).
* `src/lib/navigation/shell-collection-page-tree.ts`
  Generic sidebar/page-tree builder with optional grouping resolvers.
* `src/lib/navigation/docs-sidebar-sections.ts`
  Default `DOCS_SIDEBAR_SECTION_ORDER` is the five factory collection folders
  (guides → glossary). Section refs are collection-only; glossary pages stay in
  the Glossary folder (no Model Types / Inference / Module Components splits).
* `src/features/docs/components/DocsPageBreadcrumb.tsx`
  Docs breadcrumbs only emit a collection crumb for accepted factory route
  slugs (`isAcceptedDocsSourceSection`); retired Atlas section labels/hrefs are
  not public crumbs.
* `src/lib/navigation/docs-sidebar-adapter.ts`
  Factory docs shell sidebar labels, grouping resolvers, collection ids, and
  `getDocsShellPageTreeSettings()` for public docs collections.
* `src/lib/navigation/generated-docs-page-tree.ts`
  Docs page tree; composes adapter settings into `buildDocsSidebarSectionNodes`.
* `src/lib/navigation/generated-docs-page-tree-wiring.test.ts`
  Adapter-to-shell wiring regression for base-tree preservation and page inclusion.
* `src/lib/navigation/docs-sidebar-adapter-parity.test.ts`
  Consolidated factory docs adapter parity and non-AI fixture sidebar independence regression.
* `src/app/(site)/site-renderers.tsx`
  AI browse and section-index render entry points used by public routes.

## Non-AI fixture proof

* `src/tests/fixtures/non-ai-shell/fixture.ts`
  Test-owned collections, pages, messages, and composable builders for browse,
  section index, sidebar, and search proofs.
* `src/tests/fixtures/non-ai-shell/shell-renderers.tsx`
  Fixture browse and section-index render helpers for tests.
* `src/tests/fixtures/non-ai-shell/browse-and-index.test.tsx`
  Fixture browse and section-index behavioral coverage.
* `src/tests/fixtures/non-ai-shell/sidebar.test.ts`
  Fixture sidebar/page-tree behavioral coverage.
* `src/tests/fixtures/non-ai-shell/search.test.ts`
  Fixture base search document and Orama query coverage without AI enrichment.

## CLI docs header / primary-nav regression

* `src/components/layout/docs-header.tsx`
  Product-neutral docs shell header (`DocsHeader`); brand via
  `data-docs-header-brand`, CLI primary nav, and header `SearchTrigger`.
* `src/components/layout/docs-header.test.tsx`
  Unit regression locking you-agent-factory brand, Home/Guides/Docs/Glossary/Blog
  primary destinations (no Topology/Timeline), and Search chrome without Model
  Atlas copy — including the consolidated "locks CLI shell header brand,
  primary nav, and Search together" case.
* `src/tests/a11y/primary-navigation.a11y.test.tsx`
  A11y smoke for brand + Primary landmark + Search on the canonical docs layout.
* `src/components/layout/primary-nav.ts` / `primary-nav.test.ts`
  Site-config-driven CLI primary nav item resolution. Link hrefs stay unprefixed
  (Next `basePath` prefixes at render); absolute/export resolution uses
  `resolveSiteNavigationHrefs` from `site-navigation-href.ts`.
* `src/lib/navigation/site-navigation-href.ts` / `site-navigation-href.test.ts`
  Root vs `/you-agent-factory-docs` absolute hrefs for home/docs/blog and locale
  routes via shared `withBasePath`.
* `src/lib/navigation/site-metadata-path.ts` / `site-metadata-path.test.ts`
  Canonical/hreflang and public-asset absolute href helpers (`resolveSiteAbsoluteHref`,
  `resolvePublicAssetHref`, `prefixMetadataAlternates`). Next Metadata does not
  auto-apply `basePath` — use these instead of hardcoding root paths.
* `src/lib/i18n/route-locale.ts` (`localizedRouteAlternates`)
  Shared metadata alternates consumer; project-site export prefixes through
  `resolveGitHubPagesBasePath` + `prefixMetadataAlternates`.

## AI shell parity regression

* `src/tests/fixtures/non-ai-shell/ai-shell-behavior-parity.test.ts`
  Consolidated regression proving AI browse, section index, sidebar, and search
  behavior stayed stable and fixture routes remain off public AI surfaces.
* `src/tests/content/browse-index.test.tsx`
  Detailed AI browse quick-route and localized browse assertions.
* `src/tests/content/section-indexes.test.tsx`
  CLI section-index page render and metadata coverage for guides, concepts,
  techniques, and documentation (default + localized routes). Asserts CLI
  `*Index` empty-state message fields stay free of Model Atlas product phrasing.
* `src/lib/docs/empty-cli-browse-indexes-verification.test.tsx`
  Consolidated end-to-end SSR proof for empty CLI browse hub + four section
  indexes (CLI headings, empty states, Atlas-free message fields, no authored
  CLI page bundles). Run directly — `src/lib/docs/` is excluded from required
  `bun run test` after Atlas deletion.
* `src/app/(site)/docs/{guides,concepts,techniques,documentation}/page.tsx`
  Default-locale CLI section index routes via `renderSectionCollectionIndexPage`.
* `src/app/[locale]/docs/{guides,concepts,techniques,documentation}/page.tsx`
  Localized CLI section index routes mirroring the default-locale pattern.
* Retired Atlas collection index modules under
  `src/app/(site)/docs/{models,modules,papers,training,systems}/` and
  `src/app/[locale]/docs/{models,modules,papers,training,systems}/` must stay
  deleted. Old URLs such as `/docs/models` and `/ja/docs/models` hit the docs
  catch-all / slug renderer and return the normal docs not-found page
  (`src/app/docs/not-found.tsx`); they must not appear in
  `source.generateParams()` or default/localized docs `generateStaticParams`
  inventories. Prove with
  `src/lib/content/retired-atlas-collection-routes.test.ts` (included in
  required `bun run test`).
* `src/lib/content/factory-only-public-inventory.test.tsx`
  End-to-end shell/navigation proof that the public docs inventory is only
  guides/concepts/techniques/documentation/glossary, browse/sidebar omit
  retired Atlas destinations, and Blog + Search stay reachable as separate
  surfaces (included in required `bun run test`).
* `src/content/messages/{en,ja,vi,zh-CN}/common.json`
  Factory-only public UI copy: `guidesIndex` / `conceptsIndex` /
  `techniquesIndex` / `documentationIndex` / `glossaryIndex` plus
  `browseIndex` hub + CLI section blurbs. Also keep
  `search.idle`, `searchEntry.description`, `shell.sidebarDescription`,
  blog/tags/architecture/glossary index copy, and `pageKind` /
  `tagCategories` free of Model Atlas / atlas product ownership and
  retired models/modules/papers/training live-surface labels (keep
  factory kinds + live tag categories such as `architecture` /
  `inference`). Do not ship retired Atlas
  `models|modules|papers|training|systems` index blocks, Atlas browse
  section keys (including Model Types / Inference / Module Components),
  retired `/topology` explorer `topologyPrototype` product copy, or
  home `atlasLink*` / module featured-link keys. Preserve legitimate factory
  model-provider / external-model product wording when present.
* `src/lib/content/ui-messages.types.ts`
  `BrowseIndexMessages`, `HomeMessages`, `AiCollectionIndexMessages`, and
  `UI_MESSAGES_COMPATIBILITY_KEYS` stay aligned with the factory-only
  message inventory above (`topologyPrototype` omitted).
* `src/lib/navigation/docs-sidebar-collection-verification.test.ts`
  AI sidebar folder order, grouping labels, and representative links.
* `src/tests/search/search-behavior-parity.test.ts`
  AI search indexing and query parity for attention, GQA, and classification scope.
