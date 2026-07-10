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
| `src/app/sitemap.ts` | Next.js App Router sitemap generator (static export → `out/sitemap.xml`) |
| `public/images/og-default.png` | Shipped default Open Graph / Twitter preview asset |
| `src/app/root-layout.shared.tsx` | Root `siteMetadata.metadataBase` + default social image wiring |
| `src/lib/i18n/route-locale.ts` | App-relative canonical + language alternates (`localizedRouteAlternates`) |
| `src/app/docs/docs-slug-renderer.tsx` | Docs `buildDocsPageAlternates` fail-closed filter via `isDocsPageShippedForLocale` |
| `src/lib/navigation/site-metadata-path.ts` | Public-asset / non-Metadata path helpers; do not double-prefix Metadata fields |
| `src/lib/build/static-export.ts` | `resolveGitHubPagesBasePath` / normalize helpers shared with metadataBase |
| `src/lib/build/built-app-html-paths.ts` | Live project-site base path constant `/you-agent-factory-docs` |
| `src/lib/build/verify-export-base-path.ts` | Export HTML checks accept path-prefixed or absolute production metadata hrefs |

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

## Sibling lanes

Leave search-nav convergence, required-gate inventory, a11y, and ops runbooks
to sibling B09c lanes. This lane owns SEO/discovery metadata and export
validation only.
