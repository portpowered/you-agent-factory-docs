# Related Registry Docs — Relevant Files

Use these files when implementing explicit registry-id → published docs link resolution
and the shared related-registry-docs component/blog wrapper.

## Resolver surface

* `src/lib/content/related-registry-docs.ts`
  Generic `resolveRelatedRegistryDocs(registryIds)` returning `available` link items
  (`registryId`, `title`, `href`) and `unavailable` entries (`missing` / `unpublished`).
  Preserves input order; not blog-specific. Available hrefs are fail-closed via
  `assertFactoryRelatedLinkItems` from `factory-prev-next-related.ts`.
* `src/lib/content/factory-prev-next-related.ts`
  Shared factory previous/next + related destination contract (footer neighbor
  resolution + deleted-Atlas URL asserts) used by related-registry resolution
  and docs related components.
* `src/lib/content/factory-prev-next-related.test.tsx`
  Required-suite proof for factory-only previous/next neighbors and
  related-registry empty/unavailable/published destinations.
* `src/lib/content/related-registry-docs.test.ts`
  Focused resolver tests with injectable `getRecordById` / `publishedRegistryIds`.
* `src/lib/content/related-registry-docs.test-fixtures.ts`
  Shared resolver/component/blog test fixtures and `relatedRegistryDocsResolveOptions`.
* `src/lib/content/related-registry-docs-behavior.test.tsx`
  Consolidated story-004 acceptance tests across resolver, `RelatedRegistryDocs`, and
  `BlogRelatedDocs` with explicit anchor-count and docs-page-less coverage.

## Shared linking primitives

* `src/lib/content/registry-linking.ts`
  `registryDisplayTitle`, `registryRecordHref`, `hasPublishedDocsPageForRecord`.
* `src/lib/content/published-docs-registry-ids.ts`
  `PUBLISHED_DOCS_REGISTRY_IDS`, `getPublishedDocsHrefForRecord`.
* `src/lib/content/registry-runtime.ts`
  `getRegistryRecordById` / `listRelatedRegistryRecords` for synchronous
  related-doc lookup (includes documentation + reference family records for
  W15 topology, not only concept/dataset/organization).
* `src/lib/content/w15-family-related-overrides.ts`
  Explicit high-value cross-family related override pairs consumed by
  curated related-doc derivation (`related-docs.ts`).
* `src/lib/navigation/w15-family-related-docs.test.tsx`
  W15 story 006 behavioral proof for family-aware related-doc derivation and
  cross-family override rendering.

## Shared UI component (story 002)

* `src/features/docs/components/RelatedRegistryDocs.tsx`
  Resolves explicit `registryIds` via `resolveRelatedRegistryDocs`, renders compact
  `docsChromeLinkClassName` links in an accessible list, and exposes empty,
  all-unavailable, and partial-unavailable fallback states. Optional `resolveOptions`
  prop supports injected lookup in tests.
* `src/features/docs/components/RelatedRegistryDocs.test.tsx`
  Render/fallback/localization tests with injectable resolver options.
* `src/features/docs/components/RelatedDocList.tsx`
  Curated related-docs list with reason labels and expand/collapse; styling reference
  for docs chrome links.

## Blog wrapper (legacy component; not on published posts)

* `src/features/blog/components/BlogRelatedDocs.tsx`
  Blog wrapper accepting `relatedDocIds` and delegating to `RelatedRegistryDocs` with
  blog-specific empty/all-unavailable fallback copy and `testId="blog-related-docs"`.
  Published blog MDX posts no longer render this chrome; keep the component for
  unit/contract coverage and docs-family reuse patterns.
* `src/features/blog/components/BlogRelatedDocs.test.tsx`
  Wrapper render/fallback tests with injectable `resolveOptions`.
* `src/features/blog/components/blog-related-docs-blog-integration.test.tsx`
  Loads remaining factory blog posts (`bottlenecks`, `comparing-agent-factories`)
  and asserts published shells keep `relatedDocIds` metadata and in-prose docs
  links without rendering `blog-related-docs` chrome.
* `src/lib/content/blog-mdx-components.tsx`
  Still registers `BlogRelatedDocs` for MDX if referenced; published posts should
  not import or render it.

## Component examples (browser verification)

* `src/component-examples/registry.tsx`
  `related-registry-docs-published`, `related-registry-docs-empty`, and
  `related-registry-docs-unavailable` examples on `/component-examples` (dev or
  `ENABLE_COMPONENT_EXAMPLES=1`).

## Related-section chrome copy

* Live docs related headings use factory wording **`Related To`**
  (`sections.related.title` in page messages).
* Page-formatting Q1 curated-only exception: when a lane must ship an
  **unlabeled** Related block (no Related To heading), do not blank
  `sections.related.title` to `""` (`pageSectionSchema` rejects empty
  titles). Drop the heading instead: plain `<section id="related">` +
  `<RelatedDocs />`, and omit `sections.related` from page messages. See
  `content-page-generation-workflow-relevant-files.md` §5b.
* Do not reintroduce Atlas chrome **`Related Concepts And Modules`** in concept
  (or other) page messages, `docs/templates/concept.messages.en.json`, or
  `docs/templates/glossary.messages.en.json`. The retired path
  `src/lib/content/__generate-fixtures__/` is denylisted and must stay absent
  (`bun run audit:retired-ai-content-infrastructure`).
* Home browse chrome must not ship retired Atlas featured-link keys
  (`atlasLinkTitle` / “Browse the atlas”); see
  `rewrite-home-page-relevant-files.md`.

## Retarget after Atlas blog/tag purge

* Related-registry fixtures and component examples should use factory concepts
  (`concept.bottlenecks`, `concept.harness`), not deleted Atlas modules such as
  `module.grouped-query-attention`.
* Remaining blog posts (`bottlenecks`, `comparing-agent-factories`) must keep
  `relatedDocIds` / `BlogRelatedDocs` pointed at live factory docs only.
* Story proof: `src/tests/content/purge-legacy-related-links.test.tsx` asserts
  blog index/posts omit deleted blog and Atlas-only tag hrefs, and
  `resolveRelatedRegistryDocs` treats deleted `tag.*` ids as missing.

## Verification

* `bun test src/lib/content/factory-prev-next-related.test.tsx`
* `bun test src/lib/content/related-registry-docs.test.ts`
* `bun test src/features/docs/components/RelatedRegistryDocs.test.tsx`
* `bun test src/features/blog/components/BlogRelatedDocs.test.tsx`
* `bun test src/features/blog/components/blog-related-docs-blog-integration.test.tsx`
* `bun test src/tests/content/purge-legacy-related-links.test.tsx`
* `bun test src/lib/content/purge-legacy-public-indexes.test.ts`
* `bun test src/content/docs/concepts/bottlenecks/bottlenecks-page.test.tsx src/content/docs/concepts/task-queue/task-queue-page.test.tsx src/tests/content/home-page.test.tsx`
* `bun run typecheck`
* `bun run lint`
* `bun run validate-data` and `bun run linkcheck` after the purge
* Blog/tags/search browser check: build then curl `/blog`, `/tags`, `/search`,
  and `/blog/bottlenecks` and assert HTML has no
  `/blog/evolution-of-diffusion`,
  `/blog/llms-no-longer-wholly-reliant-on-the-internet`,
  `/blog/roofline-throughput-explorer`, `/tags/model-family`,
  `/tags/inference`, or `/tags/alignment` hrefs.
* Concept/home chrome check: render or curl a concept page and `/` and assert
  HTML has `Related To` (or factory browse links) and does not contain
  `Related Concepts And Modules` or `Browse the atlas`.
