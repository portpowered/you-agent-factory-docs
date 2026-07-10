import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionMetadataHref,
} from "@/lib/seo/production-metadata-base";
import {
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
      expect(urls).toContain(
        resolveProductionMetadataHref(route, PROJECT_SITE_EXPORT_ENV),
      );
    }

    expect(resolveProductionMetadataHref("/", PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${BUILT_APP_GITHUB_PAGES_BASE_PATH}/`,
    );
  });

  test("exclusion proofs stay out of the public route list", () => {
    const routes = new Set(listPublicSitemapRoutes());
    for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
      expect(routes.has(route)).toBe(false);
    }
  });
});
