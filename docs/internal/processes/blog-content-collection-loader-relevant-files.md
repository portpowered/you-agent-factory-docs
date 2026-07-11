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
  a substitute for the loader-scope inventory update.
* Worktree checkouts often resolve `next` from a parent `node_modules`. Turbopack
  rejects out-of-root `node_modules` symlinks; prefer SSR `renderBlogPostPage` +
  `renderToStaticMarkup` (or `next dev --webpack`) for local post-shell verification
  instead of inventing a second package layout.
* `BlogRelatedDocs` / `resolveRelatedRegistryDocs` only resolve related-doc kinds
  wired through `getRegistryRecordById` (concept, and other tagged kinds in that
  lookup). Published `documentation.*` and `technique.*` ids validate in
  frontmatter `relatedDocIds` but currently render as missing in the component
  (`getRegistryRecordById` returns undefined for those kinds). Until that lookup
  gap is fixed, keep those ids in frontmatter and link their routes in MDX (or
  pass only resolvable concept ids to `<BlogRelatedDocs />`) so readers still
  reach the page without a partial-unavailable status.
* Page-local blog illustrations (DataTable, charts) need the same
  `page-mdx-components.tsx` + `blog-page-load.ts` single-slug static-import
  switch as concept SPC graphs: relative imports in `page.mdx` do not resolve
  under `compileMDX`. Keep the component out of shared `blog-mdx-components.tsx`.
* Empty `tags: []` is valid when no published tag fits. Discoverability then
  relies on the blog index card plus prose/title search documents (not tag
  landings). Keep that proof colocated under
  `src/content/blog/<slug>/*-discoverability.test.tsx` so the lane stays
  blog-local and still runs in the required website suite.
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
