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
| `src/app/root-layout.shared.tsx` | Root `siteMetadata.metadataBase` wiring |
| `src/lib/i18n/route-locale.ts` | App-relative canonical + language alternates (`localizedRouteAlternates`) |
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

## Sibling lanes

Leave search-nav convergence, required-gate inventory, a11y, and ops runbooks
to sibling B09c lanes. This lane owns SEO/discovery metadata and export
validation only.
