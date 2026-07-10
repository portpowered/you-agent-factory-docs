import type { BuildModeEnv } from "@/lib/build/static-export";
import { blogPostHref, listBlogSlugs } from "@/lib/content/blog-page-load";
import { tagPageHref } from "@/lib/content/content-hrefs";
import { FACTORY_PUBLISHED_TAG_SLUGS } from "@/lib/content/factory-tags-browse";
import { PUBLISHED_DOCS_SECTIONS } from "@/lib/content/published-docs-registry-contract";
import { listPublishedDocsEntries } from "@/lib/content/published-docs-registry-ids";
import { isLiveFactoryCanonicalPath } from "@/lib/seo/export-absolute-canonical";
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";

/**
 * Fixed shell surfaces that always ship on the factory-only public site.
 */
export const PUBLIC_SITEMAP_SHELL_ROUTES = [
  "/",
  "/search",
  "/browse",
  "/blog",
  "/tags",
] as const;

/**
 * Docs collection index routes (section roots), including architecture.
 */
export const PUBLIC_SITEMAP_DOCS_SECTION_ROUTES = [
  ...PUBLISHED_DOCS_SECTIONS.map((section) => `/docs/${section}`),
  "/docs/architecture",
] as const;

/**
 * Representative live factory routes that export sitemap proofs must include.
 */
export const SITEMAP_INCLUSION_PROOF_ROUTES = [
  "/",
  "/search",
  "/browse",
  "/tags",
  "/blog",
  "/blog/bottlenecks",
  "/docs/concepts",
  "/docs/concepts/harness",
] as const;

/**
 * Representative deleted / retired Atlas paths that must never appear in the
 * sitemap (app-relative).
 */
export const SITEMAP_EXCLUSION_PROOF_ROUTES = [
  "/docs/models",
  "/docs/modules",
  "/docs/papers",
  "/docs/training",
  "/docs/systems",
  "/docs/modules/grouped-query-attention",
  "/topology",
  "/docs/timeline",
  "/blog/evolution-of-diffusion",
  "/blog/llms-no-longer-wholly-reliant-on-the-internet",
  "/blog/roofline-throughput-explorer",
] as const;

function uniqueSortedPaths(paths: readonly string[]): string[] {
  return [...new Set(paths)].sort((left, right) => left.localeCompare(right));
}

/**
 * Lists app-relative public factory routes for the sitemap. Fail-closed against
 * retired Atlas collections and deleted Atlas blogs via
 * {@link isLiveFactoryCanonicalPath}.
 */
export function listPublicSitemapRoutes(): string[] {
  const docsArticles = listPublishedDocsEntries().map((entry) => entry.url);
  const blogPosts = listBlogSlugs().map((slug) => blogPostHref(slug));
  const tagPages = FACTORY_PUBLISHED_TAG_SLUGS.map((slug) => tagPageHref(slug));

  const candidates = [
    ...PUBLIC_SITEMAP_SHELL_ROUTES,
    ...PUBLIC_SITEMAP_DOCS_SECTION_ROUTES,
    ...docsArticles,
    ...blogPosts,
    ...tagPages,
  ];

  return uniqueSortedPaths(
    candidates.filter((path) => isLiveFactoryCanonicalPath(path)),
  );
}

/**
 * Resolves public sitemap routes to absolute production URLs under the
 * configured origin + optional project-site base path.
 */
export function listPublicSitemapAbsoluteUrls(
  env: BuildModeEnv = process.env,
): string[] {
  return listPublicSitemapRoutes().map((path) =>
    resolveProductionMetadataHref(path, env),
  );
}
