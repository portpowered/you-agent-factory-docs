# Shell Domain Relevant Files

Use these files when changing collection-driven browse, section index, sidebar,
or shell fixture proofs that must stay independent from AI registry helpers.

## Generic shell primitives

* `src/lib/content/sidebar-grouping.ts`
  Docs-shell sidebar subgroup labels and resolvers. Factory Concepts explorer
  subgroups are **Harnesses → Industrial engineering → Model inference** via
  `SIDEBAR_GROUP_LABELS.concepts` and explicit slug membership in
  `FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG` (including reserved skills/mcp/
  tool-calling slots). Program documentation uses a three-level taxonomy:
  top groups **System feature set → Interfaces → Packaged factories →
  Factory Configuration → System Operations → Internal Architecture →
  Additional references** via `SIDEBAR_GROUP_LABELS.documentation`, with
  secondaries under Factory Configuration (Workers → Workstations →
  Factories → Resources) and System Operations (Observability) via
  `DOCUMENTATION_SIDEBAR_SECONDARY_LABELS`. Slug membership lives in
  `FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG` (FAQ omitted; top-level
  explorer page; W18 documentation move stubs omitted as compatibility-only
  routes); `FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG` is the
  top-group-only derived view. The documentation sidebar adapter nests
  secondaries from the membership map and also filters W18 move stubs via
  `isDocumentationRouteMigrationOldBrowsePath`. Glossary still uses ontology-first classification membership
  with editorial `sidebarGrouping.glossary` fallback.
* `src/lib/navigation/docs-sidebar-grouping-adapter.ts`
  Builds grouped Concepts/Glossary/Program documentation sidebar nodes;
  Concepts and documentation resolution pass page slug into the factory
  assignment maps so explicit membership applies. Program documentation
  emits three-level nodes: top-group separators, nested secondary folders
  (Workers / Workstations / Factories / Resources under Factory
  Configuration; Observability under System Operations), then page links.
  Empty top groups and empty secondaries are omitted; FAQ and W18
  documentation move stubs are never Program documentation children.
* `src/lib/navigation/docs-sidebar-sections.ts`
  Builds explorer top-level folders; skips FAQ (promoted to top-level page)
  and W18 documentation move stubs when assigning pages to collection
  folders so stubs are not advertised under Program documentation.
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
  `DOCS_BROWSE_SECTION_ORDER`. Glossary-derived Atlas browse helpers are
  deleted (no Model Types / Inference / Module Components sections). W18
  documentation move stubs are filtered via
  `isDocumentationRouteMigrationOldBrowsePath` so family targets remain the
  discoverable destinations.
* `src/lib/docs/browse-collection-sections.test.ts`
  Locks CLI-only browse order and asserts retired Atlas / glossary-derived
  section ids and titles stay absent from the public hub.
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
  not public crumbs. W15 family crumbs use topology `messages.nav.*` labels
  (references/factories/workers/workstations); explorer folder messages cover
  CLI collection crumbs; deeper slug ancestry (segments between family and
  leaf) becomes intermediate linked crumbs rather than collapsing to one path.
* `src/lib/navigation/w15-family-breadcrumbs.test.tsx`
  Nested-family breadcrumb proofs: Home → family index → page title for each
  W15 family, localized nav labels across shipped locales, and deeper ancestry
  between family and leaf.
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
  `renderShellSectionCollectionIndexPage` also omits W18 move stubs from
  documentation (and other) section-index entry lists.

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

## Shared content-column alignment contract

* `src/lib/layout/content-column-alignment.ts`
  Single shared left-edge / horizontal-inset contract for shell content
  columns. Tokens and utility classes (`CONTENT_COLUMN_INSET_CLASS`,
  `CONTENT_COLUMN_INSET_FROM_MD_CLASS`, `CONTENT_COLUMN_CLASS`,
  `CONTENT_COLUMN_FULL_CLASS`) match Fumadocs DocsPage `#nd-page` padding
  (`px-4 md:px-6 xl:px-8`) and max-widths (`900px` / `1168px`). Use
  `CONTENT_COLUMN_INSET_FROM_MD_CLASS` for nested chrome whose parent already
  applies the mobile `px-4` shell inset. Do not fake alignment with negative
  margins — apply the shared inset directly. Intended consumers:
  `CONTENT_COLUMN_CONSUMER_SURFACES` (header/docs nav, home article/Browse,
  `/browse`, `/blog`, normal docs pages).
* `src/lib/layout/content-column-alignment.test.ts`
  Contract tests: inset matches Fumadocs page padding, reusable column
  classes share one inset, from-md nested inset, no negative-margin
  compensation, CSS var names, and consumer-surface inventory.
* `src/app/globals.css` (`:root` `--site-content-column-*`)
  CSS custom properties mirroring the TypeScript inset / max-width tokens
  for any stylesheet consumers of the same contract.
* Home article + Browse (`home-article-browse`): consume the shared left edge
  via DocsPage `#nd-page` inset — do **not** nest `CONTENT_COLUMN_INSET_CLASS`
  on `HomeArticle`. Wire `data-content-column-surface="home-article-browse"`
  and keep `HOME_ARTICLE_CLASS` width-only (`max-w-3xl`). Remove Browse/list
  card indentation at the source with `bulletlessListMarkersClassName`
  (`list-none ps-0`) in `src/features/docs/components/list-decoration.ts` —
  DocsBody `prose` adds `padding-inline-start` to `ul` even when markers are
  removed; never fake alignment with negative margins.
* `src/components/home/home-article-alignment.test.tsx`
  Locks home article/Browse shared left-edge contract (surface marker, no
  nested inset, `ps-0` bulletless lists, no negative-margin compensation).
* `/browse` (`browse-index`) and `/blog` (`blog-index`): wire
  `data-content-column-surface` on the DocsPage `#nd-page` container in
  `renderBrowseIndexPage` / `renderBlogIndexPage` so DocsTitle header and
  DocsBody share one left edge. Keep index card lists on
  `bulletlessListClassName` (`list-none ps-0`); do not nest
  `CONTENT_COLUMN_INSET_CLASS` inside the body or fake alignment with
  negative margins. Surface constants:
  `BROWSE_INDEX_CONTENT_COLUMN_SURFACE` (`BrowseIndexPage.tsx`),
  `BLOG_INDEX_CONTENT_COLUMN_SURFACE` (`BlogIndexPostList.tsx`).
* `src/features/docs/components/browse-blog-index-alignment.test.tsx`
  Locks `/browse` and `/blog` shared left-edge contract (surface markers on
  `#nd-page`, DocsTitle + body present, `ps-0` bulletless lists, no
  negative-margin compensation).
* Normal docs pages (`docs-page`): wire `data-content-column-surface` on the
  DocsPage `#nd-page` container in `renderLocalDocsPage` /
  `renderDocsSlugPage` (`src/app/docs/docs-slug-renderer.tsx`) so article
  content shares the same left edge as header/docs nav. Do not nest
  `CONTENT_COLUMN_INSET_CLASS` on the article body or fake alignment with
  negative margins; leave sidebar taxonomy and MDX prose untouched. Surface
  constant: `DOCS_PAGE_CONTENT_COLUMN_SURFACE`.
* `src/app/docs/docs-page-alignment.test.tsx`
  Locks normal docs page shared left-edge contract (surface marker on
  `#nd-page`, shared inset tokens with header nav, no nested article inset,
  no negative-margin compensation).
* `src/lib/layout/content-column-brand-alignment-coverage.ts`
  Brand + content-column verification matrix: home/browse/blog/docs routes ×
  mobile/tablet/laptop/wide viewports, expected display brand
  (`You Agent Factory`), and when inline left-edge geometry applies (`md+`).
* `src/lib/layout/content-column-brand-alignment-coverage.test.ts`
  Contract tests for the brand-alignment matrix and viewport widths.
* `src/tests/a11y/content-column-brand-alignment.a11y.test.tsx`
  Always-on focused layout coverage: brand text, shared surfaces, header inset,
  `DOCS_HEADER_SHELL_CLASS` `md:gap-0` contract, and layout-snapshot coverage
  across home/browse/blog/docs (gates meaningful brand regressions via
  hash/contract failure).
* `src/lib/verify/a11y-content-column-left-edge-geometry.test.ts`
  Always-on Playwright fixture: zero header column gap keeps the nav track
  aligned with `#nd-page`; a 16px (`gap-4`) header gap reproduces the
  historical ~32px drift — no production build required.
* `src/lib/verify/a11y-content-column-brand-alignment-page.test.ts`
  Served matrix (also in `PRODUCTION_INTEGRATION_TEST_PATHS`): brand,
  content-column surface, no page overflow, and `#nd-page` ↔ header-nav
  left-edge geometry at all four viewports after `make build`.

## CLI docs header / primary-nav regression

* `src/components/layout/docs-header.tsx`
  Product-neutral docs shell header (`DocsHeader`); brand via
  `data-docs-header-brand`, CLI primary nav, and header `SearchTrigger`.
  Shell grid is `DOCS_HEADER_SHELL_CLASS` (`gap-4 md:gap-0` — desktop must
  match zero-gap `#nd-docs-layout` tracks). Desktop primary nav uses
  `DOCS_HEADER_PRIMARY_NAV_COLUMN_CLASS` (`CONTENT_COLUMN_CLASS`); actions use
  `DOCS_HEADER_ACTIONS_COLUMN_CLASS` (`CONTENT_COLUMN_INSET_FROM_MD_CLASS` +
  full max-width). Mobile shell keeps outer `px-4 md:px-0` — no
  negative-margin compensation.
* `src/components/layout/docs-header.test.tsx`
  Unit regression locking you-agent-factory brand, Home/Guides/Docs/Glossary/Blog
  primary destinations (no Topology/Timeline), Search chrome without Model
  Atlas copy — including the consolidated "locks CLI shell header brand,
  primary nav, and Search together" case — plus shared content-column left-edge
  alignment for desktop nav/actions and `md:gap-0` shell contract.
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
  `FACTORY_SIDEBAR_COLLECTION_IDS` (CLI collections + W15 route families in
  topology order references → factories → workers → workstations),
  `FACTORY_SIDEBAR_FOLDER_LABELS`, retired Atlas nav collection/label
  denylists, and fail-closed asserts used by `DocsPageBreadcrumb` /
  `buildDocsSidebarSectionNodes` so chrome never advertises retired Atlas
  collection crumbs or sidebar destinations. Glossary stays out of the
  explorer folder list.
* `src/lib/content/factory-breadcrumb-sidebar.test.tsx`
  Required-suite proof that breadcrumbs resolve Home → factory collection →
  page for guides/concepts/techniques/documentation, sidebar folders stay
  factory-only with published page links (including W15 family folders), and
  retired Atlas section slugs never become collection crumbs.
* `src/lib/navigation/w15-family-sidebar-discovery.test.ts`
  W15 story 003 proof: four family folders appear in topology relative order
  with settled published page children only (no operation / event-variant /
  schema-definition inventory paths in the global explorer).
* `src/features/docs/styles/docs-page-footer-chrome.ts` (+ `.css` / `.test.ts`)
  Shared DocsPage Previous/Next footer **chrome** (hover/focus background +
  focus ring; no title-text accent-foreground recolor; muted sublabel stays
  muted; compact `padding`/`gap` overrides for Fumadocs `p-4`/`gap-2`). Prefer
  CSS/token overrides on the Fumadocs accent-hover card selectors over
  redesigning footer neighbor data.
* `src/features/docs/styles/docs-page-footer-chrome.browser.test.ts`
  Always-on Playwright behavioral gate: embeds the real chrome CSS in a
  minimal `#nd-page` prev/next fixture (no Next build / `bun run dev`),
  probes `getComputedStyle` on hover and focus-visible for stable title color
  (not accent-foreground), muted sublabel retention, background + focus-ring
  affordances, and compact padding/gap (`8px/12px` + `4px`). Includes a
  negative fixture (chrome CSS omitted) that still reproduces tall `p-4`/`gap-2`
  and accent title recolor. Pattern mirrors
  `a11y-content-column-left-edge-geometry.test.ts` (`page.setContent`).
* `src/lib/navigation/docs-page-footer-contract.ts` (+ `.test.ts`)
  Built-HTML / bundled-CSS convergence helpers for footer card accent-hover
  classes, muted directional sublabels, the no-text-recolor CSS pairing, and
  compact padding/gap overrides (`FOOTER_COMPACT_PADDING` /
  `FOOTER_COMPACT_GAP`). Use `assertDocsFooterChromeCssConvergence` when both
  repairs must stay locked together. Source/CSS string helpers are supporting
  contracts only — behavioral proof lives in the browser test above.
* Worktree browser verify for footer chrome: Turbopack rejects hoisted
  out-of-root `node_modules` symlinks, so `bun run dev` often cannot start in
  a worktree. Prefer the committed Playwright `page.setContent` fixture in
  `docs-page-footer-chrome.browser.test.ts` (same pattern as left-edge
  geometry) over inventing a second Next bootstrap or ad-hoc HTTP server.
  Competing fixture hover text utilities must stay inside `@layer utilities`
  (or lose to unlayered resting color); resting link color belongs in
  `@layer base` so the negative (no-chrome) case can still show accent
  recolor.
* `src/lib/content/factory-prev-next-related.ts`
  Factory previous/next and related-link contract: footer neighbor resolution
  mirroring Fumadocs `useFooterItems`, W15 family-scoped linearization
  (`collectFamilyDocsFooterPageItems` / `resolveFamilyScopedDocsFooterNeighbors`)
  so family pages omit directions at family edges instead of crossing into
  other collections, plus fail-closed asserts used by
  `resolveRelatedRegistryDocs` / `RelatedDocs` / `DerivedRelatedDocs` so
  navigation never advertises deleted Atlas destinations.
* `src/lib/content/resolve-family-docs-footer.ts`
  Server helper that loads locale UI messages + pruned page tree and returns
  family-scoped previous/next neighbors for W15 family index/nested slugs
  (`resolveFamilyDocsFooterNeighborsForSlug`).
* `src/features/docs/components/FamilyDocsFooterNeighbors.tsx`
  Renders those neighbors without Fumadocs `Footer` / `useFooterItems`, so App
  Router entry unit tests and DocsPage surfaces stay free of DocsLayout tree
  context while keeping family-scoped prev/next cards.
* `src/lib/navigation/w15-family-prev-next.test.ts`
  W15 story 005 proof: index + nested pages keep previous/next inside each
  family topology; edges omit cleanly; localized trees keep locale-prefixed
  family destinations.
* `src/lib/content/w15-family-related-overrides.ts`
  W15 story 006 high-value cross-family related-doc override pairs
  (references ↔ factories, workers ↔ workstations, schema ↔ factories),
  merged into curated related derivation via
  `listCuratedRelatedTargetIds` / `deriveCuratedRelatedItems`.
* `src/lib/navigation/w15-family-related-docs.test.tsx`
  W15 story 006 proof: documentation/reference records participate in
  related-doc lookup, override pairs emit published family hrefs, RelatedDocs
  renders representative cross-family links, and empty/missing targets keep
  clear fallbacks without broken hrefs.
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
  `techniquesIndex` / `documentationIndex` plus `browseIndex` hub + CLI
  section blurbs. Glossary index / home featured / browse quick-route
  advertising keys (`glossaryIndex`, `home.glossaryLink*`,
  `browseIndex.glossaryRouteDescription`, `browseIndex.glossarySection*`)
  are retired with the `/docs/glossary` index destination; residual glossary
  collection definitions reuse concepts messageKeys for resolve callers.
  Also keep `search.idle`, `searchEntry.description`,
  `shell.sidebarDescription`, blog/tags/architecture index copy, and
  `pageKind` / `tagCategories` free of Model Atlas / atlas product ownership
  and retired models/modules/papers/training live-surface labels (keep
  factory kinds + live tag categories such as `architecture` /
  `inference`). Do not ship retired Atlas
  `models|modules|papers|training|systems` index blocks, Atlas browse
  section keys (including Model Types / Inference / Module Components),
  retired `/topology` explorer `topologyPrototype` product copy, or
  home `atlasLink*` / module featured-link keys. Preserve legitimate factory
  model-provider / external-model product wording when present.
  Explorer chrome labels live under top-level `explorer` (`folders`,
  `conceptsGroups`, `documentationGroups`, `documentationSecondaries`) for
  en/ja/zh-CN/vi; English values must stay aligned with
  `FACTORY_EXPLORER_FOLDER_LABELS` / `SIDEBAR_GROUP_LABELS` /
  `DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS`. Program documentation
  top-group and secondary labels localize; literal CLI/package/route
  identifiers in page titles stay untranslated. Nested secondary labels
  (Workers, Observability, …) are declared in
  `DOCUMENTATION_SIDEBAR_SECONDARY_LABELS`, flattened for catalogs via
  `DOCUMENTATION_SIDEBAR_SECONDARY_CATALOG_LABELS`, and remapped by
  `localizePageTree` through `buildDefaultSecondaryLabelLocalizer`.
  Colliding Workers/Workstations/Factories secondary strings stay aligned
  with `explorer.folders` in each locale. `assertExplorerMessages` fails
  closed when any explorer catalog (including secondaries) is incomplete.
* `src/lib/i18n/explorer-labels.ts` / `src/lib/i18n/localize-page-tree.ts`
  Locale-aware explorer folder/subgroup/secondary/page label resolution
  consumed by desktop sidebar and mobile drawer through the same localized
  page tree.
* `src/lib/navigation/explorer-tree-signature.ts`
  Serializes a page tree into the explorer IA contract (top-level order, FAQ
  placement, subgroup separators, nested secondary folders, page
  membership/labels/hrefs) for desktop/mobile parity comparisons.
  `pageEntriesInFolder` / `pageEntriesUnderSeparator` descend into secondary
  folders; `secondaryFolderNamesUnderSeparator` locks Workers/Observability
  nesting under Program documentation top groups;
  `pageEntriesInSecondaryFolderUnderSeparator` locks exact page membership
  inside a named secondary (Workers, Observability, …).
* `src/lib/navigation/explorer-ia-contract.test.ts`
  Exact-order proofs against `FACTORY_EXPLORER_SECTION_ORDER` /
  `SIDEBAR_GROUP_LABELS` (top-level folders + FAQ, Concepts subgroups, Program
  documentation subgroups) plus fail-closed `localizePageTree` /
  `assertExplorerMessages` coverage when explorer catalogs are missing or empty.
  Story 003 locks exact direct-under-top-group membership for System feature
  set / Interfaces / Packaged factories / Internal Architecture / Additional
  references and proves config/ops pages stay out of System feature set.
  Story 004 locks Factory Configuration secondaries (Workers → Workstations →
  Factories → Resources) and System Operations → Observability page membership,
  and proves `replays-records` stays under System feature set only.
  Story 006 consolidates the three-level Program documentation contract: FAQ
  remains the sole top-level explorer page (absent from Program documentation
  children), former ten-group Basics/Feature support/Functions/… separators are
  rejected, and Workers/Observability nesting plus full membership remain locked.
  Repair story 005 consolidates demoted W18 stub absence across explorer,
  search, sitemap, and section-index in
  `src/lib/content/factory-documentation-route-migration-demoted-contract.test.tsx`
  (R02 discovery / visual-review suites sample non-stub Program pages only).
* `src/lib/navigation/generated-docs-page-tree.test.ts` /
  `src/lib/source.test.ts` /
  `src/lib/navigation/docs-sidebar-collection-verification.test.ts` /
  `src/lib/navigation/docs-sidebar-adapter-parity.test.ts`
  Generated/source/parity sidebar proofs share the same three-level separator
  order, secondary nesting, FAQ-outside, and former ten-group rejection.
* `src/tests/layout/desktop-mobile-explorer-parity.test.tsx`
  Focused proof that every locale’s constructed explorer tree matches the IA
  contract and that CanonicalDocsLayout’s desktop `#nd-sidebar` and mobile
  drawer expose the same docs explorer folders/links after excluding the
  drawer’s primary-nav landmark.
* `src/tests/a11y/docs-sidebar-navigation.a11y.test.tsx`
  Keyboard-reachable FAQ and Concepts subgroup page links, no Glossary folder
  control, Program documentation accessible name, and localized Vietnamese
  folder/sidebar accessible names on CanonicalDocsLayout. Story 003 also
  proves Interfaces (`/docs/documentation/cli`) and Additional references
  (`/docs/documentation/install`) appear after their Program documentation
  separators in DOM order (disambiguate CLI from `/docs/references/cli`).
  Story 006 browser proof: FAQ stays after Program documentation as a top-level
  link, former flat ten-group separator labels are absent, and nested Workers /
  Observability secondaries remain reachable.
* `src/lib/content/ui-messages.types.ts`
  `BrowseIndexMessages`, `HomeMessages`, `AiCollectionIndexMessages`, and
  `UI_MESSAGES_COMPATIBILITY_KEYS` stay aligned with the factory-only
  message inventory above (`topologyPrototype` omitted).
* `src/lib/navigation/docs-sidebar-collection-verification.test.ts`
  AI sidebar folder order, grouping labels, and representative links.
* `src/tests/search/search-behavior-parity.test.ts`
  AI search indexing and query parity for attention, GQA, and classification scope.
