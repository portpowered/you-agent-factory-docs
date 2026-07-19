# Static SEO Metadata Relevant Files

Use these files when completing production SEO/discovery output for the
factory-only static export (metadataBase, absolute canonicals, Open Graph,
social assets, sitemap, robots).

## Key files

| Path | Role |
| --- | --- |
| `src/lib/seo/production-metadata-base.ts` | Production origin + `resolveProductionMetadataBase` / `resolveProductionMetadataHref` |
| `src/lib/seo/production-metadata-base.test.ts` | Origin/base-path resolution for project-site vs root modes |
| `src/lib/seo/export-absolute-canonical.ts` | Absolute production canonical HTML checks + export-dir verification for home/docs/blog proof routes |
| `src/lib/seo/export-absolute-canonical.test.ts` | Fixture + metadata + temp-`out/` proofs that canonicals are absolute under the production origin/base path and never legacy Atlas routes |
| `src/lib/seo/page-open-graph.ts` | `pageOpenGraph` / `withPageOpenGraph` — page-specific OG title/description/url mirroring Metadata fields |
| `src/lib/seo/page-open-graph.test.ts` | Helper unit proofs for OG field mirroring |
| `src/lib/seo/export-page-open-graph.ts` | Export HTML OG extraction + verification for home/search/docs/blog proof routes |
| `src/lib/seo/export-page-open-graph.test.ts` | Metadata + temp-`out/` proofs that OG matches page identity and absolute production `og:url` |
| `src/lib/seo/social-preview-assets.ts` | Default social card path (`/images/og-default.png`) + Metadata/public-href helpers |
| `src/lib/seo/social-preview-assets.test.ts` | Project-site vs root public-asset prefix + absolute production URL proofs |
| `src/lib/seo/export-social-preview-images.ts` | Export HTML `og:image` / `twitter:image` extraction + verification |
| `src/lib/seo/export-social-preview-images.test.ts` | Metadata + temp-`out/` proofs that social images resolve under production origin/base path |
| `src/lib/seo/export-localized-alternates.ts` | Export HTML hreflang extraction + shipped-only absolute production alternate verification |
| `src/lib/seo/export-localized-alternates.test.ts` | Multi-locale home + subset-locale docs (`concepts/task-queue`) metadata and temp-`out/` proofs |
| `src/lib/seo/public-sitemap-routes.ts` | Live public factory route inventory for sitemap (shell, docs sections/articles, blog, tags) |
| `src/lib/seo/public-sitemap-routes.test.ts` | Inclusion/exclusion proofs for live vs retired Atlas paths |
| `src/lib/seo/export-sitemap.ts` | `buildPublicSitemapEntries` + `verifyExportSitemap` / loc extraction for `out/sitemap.xml` |
| `src/lib/seo/export-sitemap.test.ts` | Absolute production sitemap URL proofs + temp-`out/` verification |
| `src/app/sitemap.ts` | Next.js App Router sitemap generator (static export → `out/sitemap.xml`; requires `export const dynamic = "force-static"`) |
| `src/lib/seo/export-robots.ts` | `buildPublicRobots` / `resolveProductionSitemapUrl` + `verifyExportRobots` for `out/robots.txt` |
| `src/lib/seo/export-robots.test.ts` | Production sitemap reference proofs + no legacy Atlas advertising |
| `src/app/robots.ts` | Next.js App Router robots generator (static export → `out/robots.txt`; requires `export const dynamic = "force-static"`) |
| `src/lib/seo/verify-export-seo-discovery.ts` | Composite export gate: canonicals + OG + social + alternates + sitemap + robots |
| `src/lib/seo/verify-export-seo-discovery.test.ts` | Temp-`out/` proofs for the full SEO discovery contract |
| `src/lib/seo/documentation-route-migration.ts` | W18 temporary §10 migration ledger + locked static compatibility mechanism (no server redirects); canonical slug/path remap helpers |
| `src/lib/seo/documentation-route-migration.test.ts` | Ledger completeness + export-safe mechanism contract proofs |
| `src/lib/seo/documentation-route-compatibility.test.tsx` | Every §10 old route still publishes compatibility HTML + target link; static params not silently omitted |
| `src/lib/content/factory-documentation-route-migration-compat-preservation.test.tsx` | Repair demotion proof: stubs stay published with compatibility HTML, family canonical, and sitemap exclusion |
| `src/lib/content/factory-documentation-route-migration-demoted-contract.test.tsx` | Repair story 005 consolidating proof: explorer/search/sitemap/section-index absence + colocated compatibility page tests |
| `src/lib/seo/documentation-route-migration-canonical.test.ts` | §10 old→target Metadata canonical/OG + sitemap exclusion/inclusion proofs |
| `src/lib/seo/documentation-route-migration-links.test.tsx` | §10 related-id / related-href / browse retarget proofs |
| `src/lib/content/factory-documentation-route-migration-inbound-retarget.test.tsx` | Repair inbound retarget proof: registry/related/RegistryLinkList prefer family hrefs |
| `src/lib/content/registry-linking.ts` | `registryRecordHref` remaps §10 stub published URLs to family destinations |
| `src/lib/seo/documentation-route-migration-closure.test.tsx` | §10 ledger closure + old/target/canonical/important-anchor proofs |
| `src/lib/seo/export-absolute-canonical.ts` | Also exports `isCanonicalPublicDiscoveryPath` (Atlas live + W18 migration old-path discovery gate) |
| `src/features/docs/components/DocumentationRouteCompatibilityDocument.tsx` | Shared static compatibility document for §10 old `/docs/documentation/*` routes |
| `src/features/docs/components/DocumentationRouteCompatibilityDocument.test.tsx` | Component-level old→target link + unknown-route error proofs |
| `public/images/og-default.png` | Shipped default Open Graph / Twitter preview asset |
| `src/app/root-layout.shared.tsx` | Root `siteMetadata.metadataBase` + default social image wiring |
| `src/lib/i18n/route-locale.ts` | App-relative canonical + language alternates (`localizedRouteAlternates`) |
| `src/app/docs/docs-slug-renderer.tsx` | Docs `buildDocsPageAlternates` fail-closed filter via `isDocsPageShippedForLocale` |
| `src/lib/navigation/site-metadata-path.ts` | Public-asset / non-Metadata path helpers; do not double-prefix Metadata fields |
| `src/lib/build/static-export.ts` | `resolveGitHubPagesBasePath` / normalize helpers shared with metadataBase |
| `src/lib/build/built-app-html-paths.ts` | Live project-site base path constant `/you-agent-factory-docs` |
| `src/lib/build/verify-export-base-path.ts` | Export HTML checks accept path-prefixed or absolute production metadata hrefs |
| `src/lib/build/build-contract-required-test-paths.ts` | Register focused SEO `*.test.ts` paths here for `make test-build-contract` / `bun run test:build-contract` (do not inline them in `package.json`) |

## Contract

1. **Origin** is always `https://portpowered.github.io`.
2. **Project-site export** `metadataBase` =
   `https://portpowered.github.io/you-agent-factory-docs`.
3. **Root / unset-base-path / non-export** `metadataBase` = origin only — never
   force `/you-agent-factory-docs`.
4. **Metadata field hrefs** (canonical, hreflang, OG url/image paths) stay
   **app-relative**. Next.js joins them onto `metadataBase.pathname`. Prefixing
   those fields with `prefixMetadataAlternates` / `resolveSiteAbsoluteHref`
   double-prefixes under project-site export.
5. Use `site-metadata-path` helpers for hardcoded `public/` assets and other
   non-Metadata absolute href contexts that do not go through `metadataBase`.
6. **Absolute canonicals** (story 002): exported HTML must emit
   `rel=canonical` as an absolute production URL (for example
   `https://portpowered.github.io/you-agent-factory-docs/docs/concepts/harness`),
   not a path-prefixed relative href. Use
   `exportHtmlHasAbsoluteProductionCanonical` /
   `verifyExportAbsoluteCanonicals` for that stricter check; keep
   `exportHtmlReferencesPrefixedMetadataHrefs` for base-path consumer proofs
   that still accept either shape.
7. **Page-specific Open Graph** (story 003): use `withPageOpenGraph` (or
   `pageOpenGraph`) so `openGraph.title` / `openGraph.description` mirror the
   page Metadata title/description and `openGraph.url` stays app-relative like
   the canonical. Exported HTML must emit `og:title`, `og:description`, and
   absolute production `og:url` matching the canonical. Proof routes: `/`,
   `/search`, `/docs/concepts/harness`, `/blog/bottlenecks`. Use
   `exportHtmlHasPageSpecificOpenGraph` / `verifyExportPageOpenGraph`.
8. **Social preview assets** (story 004): ship `public/images/og-default.png`
   and reference it via app-relative Metadata (`openGraph.images` /
   `twitter.images`). Project-site export resolves to
   `https://portpowered.github.io/you-agent-factory-docs/images/og-default.png`;
   root / unset-base-path keeps `/images/og-default.png` (no forced project
   prefix). Use `resolveSocialPreviewImagePublicHref` for non-Metadata
   public-asset contexts and
   `exportHtmlHasBasePrefixedSocialImages` /
   `verifyExportSocialPreviewImages` for export HTML gates.
9. **Localized alternates** (story 005): keep hreflang Metadata app-relative;
   filter docs alternates with `isDocsPageShippedForLocale` (fail-closed).
   Exported HTML must emit absolute production hreflang URLs for shipped
   locales only. Proof routes: `/` (en/ja/zh-CN/vi) and
   `/docs/concepts/task-queue` (en only). Use
   `exportHtmlHasShippedAbsoluteAlternates` /
   `verifyExportLocalizedAlternates`. Never advertise deleted Atlas paths.
10. **Sitemap** (story 006): `listPublicSitemapRoutes` / `buildPublicSitemapEntries`
    emit only current public factory routes as absolute production URLs.
    Project-site export writes `out/sitemap.xml` via `src/app/sitemap.ts`.
    Inclusion proofs: `/`, `/search`, `/browse`, `/tags`, `/blog`,
    `/blog/bottlenecks`, `/docs/concepts`, `/docs/concepts/harness`.
    Exclusion proofs: retired `/docs/models|modules|papers|training|systems`,
    `/topology`, `/docs/timeline`, deleted Atlas blog slugs. Use
    `verifyExportSitemap` / `sitemapLocsMatchPublicFactoryContract`.
11. **Robots + discovery gate** (story 007): `buildPublicRobots` /
    `src/app/robots.ts` emit `out/robots.txt` with a normal allow-all policy
    and `Sitemap:` pointing at the absolute production sitemap URL
    (`https://portpowered.github.io/you-agent-factory-docs/sitemap.xml` on
    project-site export). Do not specially advertise retired Atlas paths in
    Allow/Disallow. Use `verifyExportRobots` for the robots file and
    `verifyExportSeoDiscovery` as the composite gate over canonicals, OG,
    social images, localized alternates, sitemap, and robots against an
    exported `out/`. Both `src/app/sitemap.ts` and `src/app/robots.ts` must
    export `dynamic = "force-static"` so `output: "export"` can emit the
    discovery files at build time.
12. **Build-contract wiring:** keep `package.json` `test:build-contract` as
    `bun ./scripts/run-build-contract-required-tests.ts`. Add new SEO focused
    tests to `BUILD_CONTRACT_REQUIRED_TEST_PATHS` in
    `src/lib/build/build-contract-required-test-paths.ts` so they stay in
    `make test-build-contract` after merges with required-gates work.

## W18 documentation → family route migration

Own migration/compat and moved-route SEO/sitemap under `src/lib/seo/`:

1. **Ledger** — `DOCUMENTATION_ROUTE_MIGRATION_LEDGER` enumerates every plan
   §10 `/docs/documentation/*` → family mapping with `open`/`closed` status
   (fourteen rows from W00 baseline / plan inventory).
2. **Mechanism** — `DOCUMENTATION_ROUTE_STATIC_COMPATIBILITY_MECHANISM` locks a
   static-export-safe pattern: static compatibility HTML at the old path that
   declares the new family canonical, paired with Metadata canonical + sitemap
   exclusion of the old path. Forbidden: `next.config` redirects, host
   `_redirects`, runtime server redirects. Silent removal of a published §10
   old URL is forbidden — every old route needs one explicit compatibility
   outcome.
3. **Compatibility documents (story 002):** each §10 old route’s `page.mdx`
   mounts `DocumentationRouteCompatibilityDocument` (registered in
   `src/lib/content/mdx-components.tsx` — local MDX imports do not resolve
   under `compileMDX`) with the ledger `oldRoute`. The component stamps
   `data-documentation-route-compatibility`, `data-compatibility-old-route`,
   `data-compatibility-target-route`, and a `data-compatibility-target-link`
   Next `<Link>` to the family target — no live factory host and no server
   redirects. Keep every old route in published docs / catch-all static params
   (silent removal is forbidden).
4. **Canonical + sitemap (story 003):** `localizedShippedDocsPageAlternates`
   remaps §10 old docs slugs to the family target slug so Metadata
   `alternates.canonical` and Open Graph `url` name the new path only.
   `isCanonicalPublicDiscoveryPath` (Atlas live-path gate + migration old-path
   exclusion) filters `listPublicSitemapRoutes` so old `/docs/documentation/*`
   URLs stay out of sitemap while compatibility HTML remains published.
   Target family routes stay in the sitemap. Helpers live under
   `src/lib/seo/documentation-route-migration.ts` and
   `src/lib/seo/export-absolute-canonical.ts`.
5. **Link retarget (story 004):** registry `relatedIds` prefer published
   family identities via
   `DOCUMENTATION_ROUTE_MIGRATION_PREFERRED_REGISTRY_IDS` (for example
   `documentation.configuration` → `documentation.factories-configuration`,
   `documentation.api-doc` → `reference.api`) inside
   `resolveRelatedRegistryDocs`, curated related-id listing, graph related
   resolution, and `RegistryLinkList`. Workers/workstations indexes keep
   `documentation.workers` / `documentation.workstations` related ids (App
   Router indexes are not MDX published entries). Reader-facing registry hrefs
   remap through `registryRecordHref` →
   `remapDocumentationRouteMigrationDestinationHref` so
   `RegistryLinkList` / related / graph destinations never advertise stub URLs.
   Hard-coded MDX `LocalizedLinkList` hrefs and browse documentation entries
   point at family routes; browse excludes §10 old compatibility URLs so they
   are not preferred discovery destinations. Repair proof:
   `src/lib/content/factory-documentation-route-migration-inbound-retarget.test.tsx`.
   Do not invent W16 search projection or W17 chrome localization work here.
6. **Closure (story 005):** mark every ledger row `closed` only after focused
   proofs cover old compatibility HTML, target resolution, Metadata canonical
   consistency, sitemap exclusion/inclusion, and an important on-target
   anchor (`DOCUMENTATION_ROUTE_MIGRATION_IMPORTANT_ANCHORS`, typically
   `what-it-covers`; projection-first API reference uses `operations`; CLI
   inventory-first uses `command-inventory`; use
   `{ kind: "none", reason: "index-only-target" }` only when an index truly
   has no section id). Do not invent per-route redirect helpers.
7. **Repair demotion (moved-duplicate stubs):** demoting §10 stubs from Program
   documentation explorer/search must keep the minimal compatibility MDX +
   `DocumentationRouteCompatibilityDocument` published. Do not delete ledger
   old routes or reopen W18 rows without evidence. Required-suite proof:
   `src/lib/content/factory-documentation-route-migration-compat-preservation.test.tsx`
   locks published presence, compatibility HTML + target link, family
   Metadata canonical, and sitemap exclusion after demotion.

See also `docs/internal/processes/factory-references-w00-baseline-relevant-files.md`
(Compatibility and redirect mechanisms) and
`docs/temp/references/baseline.md` (Plan migration inventory).

## Sibling lanes

Leave search-nav convergence, required-gate inventory, a11y, and ops runbooks
to sibling B09c lanes. This lane owns SEO/discovery metadata and export
validation only. W18 consumes that SEO pairing for moved documentation routes
without redesigning four-family nav (W15) or owning W16/W17.
