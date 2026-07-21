import type { BuildModeEnv } from "@/lib/build/static-export";
import { blogPostHref, listBlogSlugs } from "@/lib/content/blog-page-load";
import { tagPageHref } from "@/lib/content/content-hrefs";
import {
  buildLocalizedRoute,
  defaultLocale,
  FACTORY_SHIPPED_LOCALES,
} from "@/lib/content/factory-locale-base-path";
import { FACTORY_PUBLISHED_TAG_SLUGS } from "@/lib/content/factory-tags-browse";
import { PUBLISHED_DOCS_SECTIONS } from "@/lib/content/published-docs-registry-contract";
import { listPublishedDocsEntries } from "@/lib/content/published-docs-registry-ids";
import {
  listDocumentationRouteMigrationOldRoutes,
  listDocumentationRouteMigrationTargetRoutes,
} from "@/lib/seo/documentation-route-migration";
import { isCanonicalPublicDiscoveryPath } from "@/lib/seo/export-absolute-canonical";
import { resolveProductionSitemapLocHref } from "@/lib/seo/production-metadata-base";

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
 * Non-default shipped locale homes derived from {@link FACTORY_SHIPPED_LOCALES}
 * via {@link buildLocalizedRoute}. Default locale stays the single `/` shell
 * entry — never invent a duplicate `/en` home.
 */
export const PUBLIC_SITEMAP_LOCALE_HOME_ROUTES = FACTORY_SHIPPED_LOCALES.filter(
  (locale) => locale !== defaultLocale,
).map((locale) => buildLocalizedRoute({ surface: "home" }, locale));

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

/**
 * Plan §10 old `/docs/documentation/*` paths — still served as compatibility
 * HTML, but excluded from canonical sitemap discovery.
 */
export const DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES =
  listDocumentationRouteMigrationOldRoutes();

/**
 * Plan §10 family targets that must remain in the canonical sitemap.
 */
export const DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES =
  listDocumentationRouteMigrationTargetRoutes();

function uniqueSortedPaths(paths: readonly string[]): string[] {
  return [...new Set(paths)].sort((left, right) => left.localeCompare(right));
}

/**
 * Lists app-relative public factory routes for the sitemap. Fail-closed against
 * retired Atlas collections, deleted Atlas blogs, and §10 migration old routes
 * via {@link isCanonicalPublicDiscoveryPath}. Includes shipped non-default
 * locale homes from {@link PUBLIC_SITEMAP_LOCALE_HOME_ROUTES}.
 */
export function listPublicSitemapRoutes(): string[] {
  const docsArticles = listPublishedDocsEntries().map((entry) => entry.url);
  const blogPosts = listBlogSlugs().map((slug) => blogPostHref(slug));
  const tagPages = FACTORY_PUBLISHED_TAG_SLUGS.map((slug) => tagPageHref(slug));

  const candidates = [
    ...PUBLIC_SITEMAP_SHELL_ROUTES,
    ...PUBLIC_SITEMAP_LOCALE_HOME_ROUTES,
    ...PUBLIC_SITEMAP_DOCS_SECTION_ROUTES,
    ...docsArticles,
    ...blogPosts,
    ...tagPages,
  ];

  return uniqueSortedPaths(
    candidates.filter((path) => isCanonicalPublicDiscoveryPath(path)),
  );
}

/**
 * Resolves public sitemap routes to absolute production `<loc>` URLs under the
 * configured origin + optional project-site base path.
 *
 * Locs use {@link resolveProductionSitemapLocHref} (trailing-slash absolute
 * form matching live canonicals). App-relative
 * {@link listPublicSitemapRoutes} inventories stay non-slash.
 */
export function listPublicSitemapAbsoluteUrls(
  env: BuildModeEnv = process.env,
): string[] {
  return listPublicSitemapRoutes().map((path) =>
    resolveProductionSitemapLocHref(path, env),
  );
}
