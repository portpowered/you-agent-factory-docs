# Shell Domain Relevant Files

Use these files when changing collection-driven browse, section index, sidebar,
or shell fixture proofs that must stay independent from AI registry helpers.

## Generic shell primitives

* `src/lib/content/sidebar-grouping.ts`
  Docs-shell sidebar subgroup labels and resolvers. Factory Concepts explorer
  subgroups are **Harnesses → Industrial engineering → Model inference** via
  `SIDEBAR_GROUP_LABELS.concepts` and explicit slug membership in
  `FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG` (including reserved skills/mcp/
  tool-calling slots). Program documentation subgroups are **Basics → Feature
  support → Functions → Configuration → API → CLI → MCP → Operational →
  Internal architecture → Additional reference** via
  `SIDEBAR_GROUP_LABELS.documentation` and
  `FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG` (FAQ omitted; top-level
  explorer page). Glossary still uses ontology-first classification membership
  with editorial `sidebarGrouping.glossary` fallback.
* `src/lib/navigation/docs-sidebar-grouping-adapter.ts`
  Builds grouped Concepts/Glossary/Program documentation sidebar nodes;
  Concepts and documentation resolution pass page slug into the factory
  assignment maps so explicit membership applies.
* `src/lib/docs/collection-definition-contract.ts`
  Shared `ShellCollectionDefinition` contract for AI and non-AI collections.
  Public `DocsCollectionId` / `DOCS_COLLECTION_IDS` are factory-only:
  `guides`, `concepts`, `techniques`, `documentation`, `glossary`. Retired
  Atlas ids (`models`, `modules`, `papers`, `training`, `systems`) are not in
  the public collection contract; sidebar grouping resolvers are
  `glossary`, `concepts`, and `documentation`.
* `src/lib/docs/docs-collection-definitions.ts`
  Canonical inventory matching `DOCS_COLLECTION_IDS`. CLI collections keep
  empty `starterSlugs`; glossary keeps route-relative starters. Concepts,
  glossary, and documentation set `sidebarGroupingResolverId`.

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
  Default `DOCS_SIDEBAR_SECTION_ORDER` is `FACTORY_EXPLORER_SECTION_ORDER`
  (guides → documentation folders, then top-level FAQ page). Collection refs
  build folders; the FAQ page ref is emitted as a top-level page node and is
  excluded from Program documentation children. Glossary is not an explorer
  folder.
* `src/features/docs/components/DocsPageBreadcrumb.tsx`
  Docs breadcrumbs only emit a collection crumb for accepted factory route
  slugs (`isAcceptedDocsSourceSection`); retired Atlas section labels/hrefs are
  not public crumbs.
* `src/lib/navigation/docs-sidebar-adapter.ts`
  Factory docs shell sidebar labels, grouping resolvers, explorer collection
  ids (no Glossary folder), and `getDocsShellPageTreeSettings()` for public
  docs explorer composition.
* `src/lib/navigation/generated-docs-page-tree.ts`
  Docs page tree; sets explorer brand `You Agent Factory` and composes adapter
  settings into `buildDocsSidebarSectionNodes`.
* `src/lib/navigation/generated-docs-page-tree-wiring.test.ts`
  Adapter-to-shell wiring regression for explorer brand and page inclusion.
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
* `src/lib/seo/production-metadata-base.ts` / `production-metadata-base.test.ts`
  Production origin + `metadataBase` resolution. Project-site export uses
  `https://portpowered.github.io/you-agent-factory-docs`; root / unset stays
  origin-only. Compose absolute SEO URLs with `resolveProductionMetadataHref`.
* `src/lib/navigation/site-metadata-path.ts` / `site-metadata-path.test.ts`
  Public-asset and non-Metadata absolute href helpers (`resolveSiteAbsoluteHref`,
  `resolvePublicAssetHref`, `prefixMetadataAlternates`). Metadata canonical /
  hreflang fields should stay app-relative under root `metadataBase` — do not
  also prefix those fields or project-site export double-prefixes.
* `src/lib/i18n/route-locale.ts` (`localizedRouteAlternates`)
  Shared metadata alternates consumer; emits app-relative hrefs so root
  `metadataBase` owns production origin + base path.
* `src/app/root-layout.shared.tsx` (`siteMetadata.metadataBase`)
  Wires `resolveProductionMetadataBase()` into every shell layout metadata.

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
  inventories.   The docs not-found page must offer factory recovery links to
  Getting Started (`/docs/guides/getting-started`), Browse (`/browse`),
  Search (`/search`), and Blog (`/blog`) with visible focus styles and no
  Model Atlas / retired-collection advertising. Prove with
  `src/lib/content/retired-atlas-collection-routes.test.ts` and
  `src/app/docs/not-found.test.tsx` (included in required `bun run test`),
  plus a11y smoke
  `src/tests/a11y/contributing-not-found-empty.a11y.test.tsx` (`make a11y`).
* `src/features/docs/components/DocsIndexEmptyState.tsx`
  Shared empty-state for collection/blog/glossary/architecture indexes.
  Always offers home + browse + search (`SearchTrigger`); non-blog empties also
  pass `includeBlogLink` so Blog is a recovery path. Empty title/description/
  home-link copy in `src/content/messages/*/common.json` must stay free of
  Model Atlas / coming-soon Atlas advertising. Prove with
  `src/features/docs/components/DocsIndexEmptyState.test.tsx` and the empty-state
  case in `src/tests/a11y/contributing-not-found-empty.a11y.test.tsx`.
* `src/content/docs/documentation/contributing-to-these-docs/`
  Published contributing guidance page (`documentation.contributing-to-these-docs`).
  Colocated publish/copy proof:
  `contributing-to-these-docs-page.test.tsx`. A11y landmarks/keyboard/Atlas-free
  smoke lives in `contributing-not-found-empty.a11y.test.tsx`.
* `src/lib/content/factory-only-public-inventory.test.tsx`
  End-to-end shell/navigation proof that the public docs inventory is only
  guides/concepts/techniques/documentation/glossary, browse/sidebar omit
  retired Atlas destinations, and Blog + Search stay reachable as separate
  surfaces (included in required `bun run test`).
* `src/lib/content/factory-tags-browse.ts`
  Factory tags/browse contract: published factory tag slugs, deleted Atlas
  tag denylist, factory tag-resource kind order, and fail-closed asserts used
  by `tags.ts` / `tag-resources.ts` so tags index and landings never advertise
  retired Atlas tags or deleted AI destinations.
* `src/lib/content/factory-tags-browse.test.tsx`
  Required-suite proof that browse hub cards stay on CLI collections (+
  glossary quick route), tags index lists only factory tags, tag landings
  keep factory destinations or factory empty next-steps, and empty
  section-index copy stays Atlas-free.
* `src/lib/content/factory-breadcrumb-sidebar.ts`
  Factory breadcrumb/sidebar contract: `FACTORY_NAV_COLLECTION_IDS`,
  `FACTORY_SIDEBAR_FOLDER_LABELS`, retired Atlas nav collection/label
  denylists, and fail-closed asserts used by `DocsPageBreadcrumb` /
  `buildDocsSidebarSectionNodes` so chrome never advertises retired Atlas
  collection crumbs or sidebar destinations.
* `src/lib/content/factory-breadcrumb-sidebar.test.tsx`
  Required-suite proof that breadcrumbs resolve Home → factory collection →
  page for guides/concepts/techniques/documentation, sidebar folders stay
  factory-only with published page links, and retired Atlas section slugs
  never become collection crumbs.
* `src/lib/content/factory-prev-next-related.ts`
  Factory previous/next and related-link contract: footer neighbor resolution
  mirroring Fumadocs `useFooterItems`, plus fail-closed asserts used by
  `resolveRelatedRegistryDocs` / `RelatedDocs` / `DerivedRelatedDocs` so
  navigation never advertises deleted Atlas destinations.
* `src/lib/content/factory-prev-next-related.test.tsx`
  Required-suite proof that previous/next neighbors stay on published factory
  docs pages (or omit a direction at the ends), related-registry docs render
  only factory destinations, and empty/unavailable related targets use clear
  fallbacks without Atlas hrefs.
* `src/lib/content/factory-locale-base-path.ts`
  Factory locale + Pages base-path contract for search/nav hrefs
  (`FACTORY_SHIPPED_LOCALES`, `FACTORY_PAGES_BASE_PATH`). Resolvers compose
  `buildLocalizedRoute` / `switchRouteLocale` / `withBasePath`; search
  bootstrap uses `resolveDocsSearchBootstrapFromForLocale`. Collection
  breadcrumb crumbs may stay unprefixed when the section index is not a
  shipped localized docs slug (`localizeDocsHref` fail-open to default
  locale) — home, search, tags, browse, and shipped page destinations still
  localize.
* `src/lib/content/factory-locale-base-path.test.tsx`
  Required-suite proof that en/ja/zh-CN/vi preserve locale routing on
  breadcrumbs (home), sidebar previous/next, tags/browse/related, and search
  result hrefs; default-locale roots stay unprefixed; project-site export
  prefixes bootstrap + nav under `/you-agent-factory-docs`.
* `src/lib/content/factory-search-navigation-convergence.test.tsx`
  Cross-cutting end-to-end gate (story 009) that also covers tags/browse,
  breadcrumb/sidebar, previous/next/related, and locale/base-path together
  with search. See `search-domain-relevant-files.md` for the full pattern.
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
  Explorer chrome labels live under top-level `explorer` (`folders`,
  `conceptsGroups`, `documentationGroups`) for en/ja/zh-CN/vi; English
  values must stay aligned with `FACTORY_EXPLORER_FOLDER_LABELS` /
  `SIDEBAR_GROUP_LABELS`. Literal `API` / `CLI` / `MCP` stay untranslated.
  `localizePageTree` overlays those labels plus shipped page-message titles
  and fails closed via `assertExplorerMessages` when catalogs are incomplete.
* `src/lib/i18n/explorer-labels.ts` / `src/lib/i18n/localize-page-tree.ts`
  Locale-aware explorer folder/subgroup/page label resolution consumed by
  desktop sidebar and mobile drawer through the same localized page tree.
* `src/lib/navigation/explorer-tree-signature.ts`
  Serializes a page tree into the explorer IA contract (top-level order, FAQ
  placement, subgroup separators, page membership/labels/hrefs) for
  desktop/mobile parity comparisons.
* `src/tests/layout/desktop-mobile-explorer-parity.test.tsx`
  Focused proof that every locale’s constructed explorer tree matches the IA
  contract and that CanonicalDocsLayout’s desktop `#nd-sidebar` and mobile
  drawer expose the same docs explorer folders/links after excluding the
  drawer’s primary-nav landmark.
* `src/lib/content/ui-messages.types.ts`
  `BrowseIndexMessages`, `HomeMessages`, `AiCollectionIndexMessages`, and
  `UI_MESSAGES_COMPATIBILITY_KEYS` stay aligned with the factory-only
  message inventory above (`topologyPrototype` omitted).
* `src/lib/navigation/docs-sidebar-collection-verification.test.ts`
  AI sidebar folder order, grouping labels, and representative links.
* `src/tests/search/search-behavior-parity.test.ts`
  AI search indexing and query parity for attention, GQA, and classification scope.
