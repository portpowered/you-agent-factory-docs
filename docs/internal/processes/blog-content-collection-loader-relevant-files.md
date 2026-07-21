# Blog Content Collection Loader — Relevant Files

Use these files when extending the blog content loading foundation. This lane
loads `src/content/blog/<slug>/page.mdx` posts for future route renderers without
adding public blog routes, shell hardening, or committed real posts.

## Blog-owned loader surface

* `src/lib/content/blog-frontmatter.ts`
  Typed frontmatter contract, calendar-date validation, and published visibility.
* `src/lib/content/blog-post-messages.ts`
  Blog-specific local message schema (`title`, `description`, `contextSentence`, `takeaway`).
* `src/lib/content/blog-post-load.ts`
  Sidecar loading for local `messages/<locale>.json` and optional `assets.json`.
* `src/lib/content/blog-post-list.ts`
  Published post discovery, draft filtering, and newest-first sorting.
* `src/lib/content/blog-next-post.ts`
  Next published neighbor under the same newest-first index order (null when
  last / unknown). Used by blog post chrome, not related-docs lists.
* `src/lib/content/blog-post-get.ts`
  Single published post lookup by slug with typed not-found (`null`) behavior.
* `src/lib/content/page-asset-paths.ts`
  Build-time helpers for resolving colocated page asset filesystem paths; keep out of
  `assets.ts` so client components do not bundle `node:path`.
  Build-time validation for published blog metadata, controlled tags, related docs,
  local messages, local asset files, asset message keys, MDX asset references, MDX links,
  and local asset config. Wired into `validateRegistryContent`.

## Shared path helper (minimum touch)

* `src/lib/content/content-paths.ts`
  `getBlogRoot()` and `BLOG_ROOT` only — do not add broader shell or browse helpers here.

## Fixture and isolation tests

* `src/lib/content/blog-frontmatter.test.ts`
* `src/lib/content/blog-post-load.test.ts`
* `src/lib/content/blog-post-list.test.ts`
* `src/lib/content/blog-next-post.test.ts`
* `src/lib/content/blog-post-get.test.ts`
* `src/lib/content/blog-content-loader-scope.test.ts`
  Production-root emptiness, blog-owned import surfaces, and public shell catalog isolation.
* `src/lib/content/validate-blog-posts.test.ts`
  Published blog metadata, tag, related-doc, message, asset file, asset message key,
  MDX asset reference, and MDX link validation fixtures.
* `src/lib/content/blog-prose-validation-boundaries.test.ts`
  Behavioral proof that narrative blog MDX prose stays exempt from canonical docs prose
  checks while canonical docs pages still reject raw reader-facing prose.
* `src/lib/content/validate-canonical-mdx-prose.ts`
  `isBlogContentPath` and `shouldValidateCanonicalMdxProse` keep blog routes and
  `src/content/blog/*` bundles outside canonical MDX prose validation.

## Search indexing (story 003+)

* `src/lib/search/build-blog-search-document.ts`
  Published blog search document builder: local messages, MDX prose, controlled tag terms,
  `publishedAt`, and distinct `blog` kind.
* `src/lib/search/build-blog-search-document.test.ts`
  Fixture indexing, draft exclusion, MDX prose extraction, and search API discovery.
* `src/lib/search/build-documents.ts`
  `buildSearchDocumentsForLocale` accepts optional published blog post sources.
* `src/lib/search/search-server.ts`
  Loads published blog posts into the live search catalog.

## Tag landing grouping (story 004+)

* `src/lib/content/tag-resources.ts`
  Loads published blog posts into tag landing groups with distinct `blog` kind, `/blog/<slug>` URLs,
  localized title/description, `publishedAt`, and frontmatter tags.
* `src/features/docs/components/TagResourceList.tsx`
  Renders blog group metadata (published date and supplemental tag pills) on tag landing pages.
* `src/lib/content/blog-tag-landing.test.ts`
  Fixture and production tag landing coverage for blog grouping, draft exclusion, and render proof.

## Out of scope for this lane

* Public `/blog` or `/blog/<slug>` routes under `src/app`
* Blog navigation or sidebar entries
* Real blog post content under `src/content/blog`
* Generic shell hardening lanes (`shell-domain-relevant-files.md`, browse, sidebar, search enrichment beyond blog indexing)

## Verification

* `bun run typecheck`
* `bun run lint`
* `bun test src/lib/content/blog-`

Canonical frontmatter reference: `docs/templates/blog-post.mdx`.

## Patterns

* Blog post `relatedDocIds` frontmatter must use block-list YAML (`relatedDocIds:\n  - concept.example`). Inline `relatedDocIds: []` is parsed as a string by `parseYamlFrontmatterBlock` and as `null` by `compileMDX`, which fails `blogPostFrontmatterSchema`.
* When adding a new published production blog slug, update the inventory assertion in
  `src/lib/content/blog-content-loader-scope.test.ts` (sorted slug list +
  `getPublishedBlogPostBySlug` match). That test is in the required website suite;
  `src/tests/content/blog-*.test.tsx` rows are excluded from `make test` and are not
  a substitute for the loader-scope inventory update. Also extend
  `src/tests/content/purge-legacy-related-links.test.tsx` so the new slug is
  included in the remaining-factory-posts loop (index href + per-post deleted-
  destination check).
* Worktree checkouts often resolve `next` from a parent `node_modules`. Turbopack
  rejects out-of-root `node_modules` symlinks; prefer SSR `renderBlogPostPage` +
  `renderToStaticMarkup` (or `next dev --webpack`) for local post-shell verification
  instead of inventing a second package layout.
* Published blog posts no longer render `## Related reference pages` /
  `<BlogRelatedDocs />` chrome. Keep frontmatter `relatedDocIds` for metadata
  when useful, and link canonical docs from MDX prose instead. Colocated
  discoverability/page SSR tests should assert absence of
  `data-testid="blog-related-docs"` and the heading `Related reference pages`,
  while still checking in-prose hrefs (for example `/docs/concepts/...`). The
  `BlogRelatedDocs` component may remain for unit/contract coverage of the
  wrapper itself; do not reintroduce it on published post bodies.
* Published blog posts no longer render `## Summary` / `<T k="takeaway" />`
  chrome that duplicates renderer `DocsDescription`. Keep optional `takeaway`
  in `messages/*.json` for search indexing; SSR/page tests should assert
  `DocsDescription` (description) once and absence of a Summary heading /
  takeaway body block. Do not edit DocsOpeningSummary / docs-slug-renderer
  opening-summary chrome from blog lanes.
* Published blog posts keep a single title via renderer `DocsTitle` and a
  single tags presentation via `BlogPostMeta`. Do not render MDX
  `# <T k="title" />`, body `TagPillList`, or bottom `## Tags` sections.
  SSR/page tests should assert exactly one `h1`, absence of
  `data-testid="tag-pill-list"`, and absence of a `Tags` h2, while still
  checking frontmatter tag labels from `BlogPostMeta` when tags are present.
* Published blog post pages render a compact next-post control
  (`data-testid="blog-next-post"`, `aria-label="Next blog post"`) via
  `BlogNextPostControl` when a next published neighbor exists under the
  newest-first index order from `listPublishedBlogPosts`. Omit the control
  (no dead href) when the post is last. Do not reintroduce `BlogRelatedDocs`
  lists for neighbor navigation.
* Blog chrome-repair convergence (discoverability / page / integration /
  a11y): assert repaired single chrome (no related-docs, no Summary, one
  `h1`, no `tag-pill-list`) **and** next-post presence/absence on the same
  SSR or Testing Library surface. Representative mid-list proof:
  `/blog/cursor-composer-six-billion-tokens` → `/blog/changelog`; last-post
  omit proof: `/blog/comparing-agent-factories`. Prefer
  `renderBlogPostPage` + `renderToStaticMarkup` over inventing source
  inventories.
* Historical note: `BlogRelatedDocs` / `resolveRelatedRegistryDocs` only resolve
  related-doc kinds wired through `getRegistryRecordById` (concept, module,
  model, and other tagged kinds in that lookup). Published `documentation.*`
  and `technique.*` ids validate in frontmatter `relatedDocIds` but render as
  missing in the component when used — prefer prose links for those routes.
* Page-local blog illustrations (DataTable, charts) need the same
  `page-mdx-components.tsx` + `blog-page-load.ts` single-slug static-import
  switch as concept SPC graphs: relative imports in `page.mdx` do not resolve
  under `compileMDX`. Keep the component out of shared `blog-mdx-components.tsx`.
* Interactive orchestrator feature matrix posts (`comparing-orchestrators`): keep
  a **server** entry that calls `listOrchestrators()` / `listAttributeDefs()` from
  `@/lib/content/orchestrators`, then pass serializable props into a **"use
  client"** composer that owns `visibleOrchestratorIds`, `AttributeFilterState`,
  sort, and `focusColumnId` / `focusRowId` and renders `OrchestratorFeatureMatrix`
  from `@/features/teaching-ui`. Do not call registry fs loaders from the client
  module; do not expand teaching-ui package APIs. Attribute labels belong in
  colocated `messages/en.json` (host `labels` map keyed by attribute id). Focus
  controls stay page-local—the matrix recipe consumes focus ids but does not
  ship a focus picker.
* Optional NotesList on the same post: colocate a thin wrapper that imports
  `TeachingList` from `@/features/teaching-ui/lists` (not the top-level
  teaching-ui barrel), pass messages-owned `items` + required `listLabel`, and
  export it from the post `page-mdx-components.tsx` beside the matrix composer.
  MDX section order is Intro prose → matrix composer → Reading notes
  (`TeachingList`). Do not register NotesList in shared `blog-mdx-components.tsx`.
* Published blog MDX must stay customer-facing: rewrite PRD / acceptance-criteria
  leftovers (for example “URL-synced … optional”, “first pass”, “should show an
  accessible empty state”) into reader teaching prose. Expand recurring acronyms
  such as Model Context Protocol (MCP) on the first narrative mention; registry
  tag values like `mcp` can stay short. Smoke tests can assert the expanded form
  and reject leftover authoring phrases.
* Empty `tags: []` is valid when no published tag fits. Discoverability then
  relies on the blog index card plus prose/title search documents (not tag
  landings). Keep that proof colocated under
  `src/content/blog/<slug>/*-discoverability.test.tsx` so the lane stays
  blog-local and still runs in the required website suite. When the story
  requires locale fail-closed behavior, assert `messages/` contains only
  `en.json` and `hasBlogPostMessagesForLocale(slug, locale)` is false for
  every non-`en` supported locale — do not add incomplete `ja` / `zh-CN` /
  `vi` stubs. English-only bundles should also assert
  `hasBlogPostMessagesForLocale(slug, "en")` and that non-default locales lack
  `messages/<locale>.json` so localized `/[locale]/blog/<slug>` params are not
  generated without message files.
* English-only blog posts should ship only `messages/en.json`. Prove fail-closed
  locale behavior in the colocated discoverability test with
  `hasBlogPostMessagesForLocale(slug, locale)` false for `ja`/`zh-CN`/`vi` and
  `generateStaticParams` from `src/app/[locale]/blog/[slug]/page.tsx` omitting
  the slug (locale-prefixed routes generate only when colocated messages exist).
* Final blog-lane validation (story 004): run `make validate-data` as the primary
  bundle proof, and colocate a `*-validation.test.tsx` that asserts published
  frontmatter tags via `indexes.tagsBySlug`, `relatedDocIds` via
  `PUBLISHED_DOCS_REGISTRY_IDS`, Atlas-free messages/render, and English-only
  message shipping. Do not edit sibling B10 bundles or shared validators for
  that proof.
* `T` / prose auto-link rewrites registry aliases inside message strings (for
  example `harness` and `agent runtime` → `/docs/concepts/harness`). When SSR
  tests assert exact takeaway/context substrings, avoid those alias phrases or
  assert around the inserted `<a data-prose-auto-link>` markup.
* Curated-links blog posts: prefer published internal docs routes for stable
  factory topics; include external URLs only when factory-relevant. Check
  reachability at author time (`curl -sL -o /dev/null -w "%{http_code}"
  --max-time 10`) and drop or replace dead/off-topic destinations—do not add a
  CI external-link scanner in a blog-local lane. Treat npmjs HTML 403 / registry
  `"Not found"` as non-shippable unless a real package exists.
