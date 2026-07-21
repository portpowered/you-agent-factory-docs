import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionSitemapLocHref,
} from "@/lib/seo/production-metadata-base";
import {
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES,
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES,
  listPublicSitemapAbsoluteUrls,
  listPublicSitemapRoutes,
  SITEMAP_EXCLUSION_PROOF_ROUTES,
  SITEMAP_INCLUSION_PROOF_ROUTES,
} from "@/lib/seo/public-sitemap-routes";

const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: BUILT_APP_GITHUB_PAGES_BASE_PATH,
} as const;

describe("public-sitemap-routes unit", () => {
  test("inclusion proofs resolve under production project-site base", () => {
    const routes = listPublicSitemapRoutes();
    const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);

    for (const route of SITEMAP_INCLUSION_PROOF_ROUTES) {
      expect(routes).toContain(route);
      expect(route === "/" || !route.endsWith("/")).toBe(true);
      expect(urls).toContain(
        resolveProductionSitemapLocHref(route, PROJECT_SITE_EXPORT_ENV),
      );
    }

    expect(resolveProductionSitemapLocHref("/", PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${BUILT_APP_GITHUB_PAGES_BASE_PATH}/`,
    );
  });

  test("exclusion proofs stay out of the public route list", () => {
    const routes = new Set(listPublicSitemapRoutes());
    for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
      expect(routes.has(route)).toBe(false);
    }
  });

  test("§10 migration old routes stay out of the sitemap while targets remain", () => {
    const routes = new Set(listPublicSitemapRoutes());
    for (const route of DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES) {
      expect(routes.has(route)).toBe(false);
    }
    for (const route of DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES) {
      expect(routes.has(route)).toBe(true);
    }
  });
});
