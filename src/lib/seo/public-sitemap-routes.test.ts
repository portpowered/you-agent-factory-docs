import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  buildLocalizedRoute,
  defaultLocale,
  FACTORY_SHIPPED_LOCALES,
} from "@/lib/content/factory-locale-base-path";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionSitemapLocHref,
} from "@/lib/seo/production-metadata-base";
import {
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES,
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES,
  listPublicSitemapAbsoluteUrls,
  listPublicSitemapRoutes,
  PUBLIC_SITEMAP_LOCALE_HOME_ROUTES,
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
      const absolute = resolveProductionSitemapLocHref(
        route,
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(absolute.endsWith("/")).toBe(true);
      expect(urls).toContain(absolute);
    }

    expect(resolveProductionSitemapLocHref("/", PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${BUILT_APP_GITHUB_PAGES_BASE_PATH}/`,
    );
  });

  test("includes every non-default FACTORY_SHIPPED_LOCALES home via buildLocalizedRoute", () => {
    const routes = listPublicSitemapRoutes();
    const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
    const expectedHomes = FACTORY_SHIPPED_LOCALES.filter(
      (locale) => locale !== defaultLocale,
    ).map((locale) => buildLocalizedRoute({ surface: "home" }, locale));

    expect(PUBLIC_SITEMAP_LOCALE_HOME_ROUTES).toEqual(expectedHomes);
    expect(expectedHomes).toEqual(["/ja", "/zh-CN", "/vi"]);
    expect(routes).toContain("/");
    expect(routes).not.toContain("/en");

    for (const route of expectedHomes) {
      expect(routes).toContain(route);
      expect(route.endsWith("/")).toBe(false);
      const absolute = resolveProductionSitemapLocHref(
        route,
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(absolute.endsWith("/")).toBe(true);
      expect(absolute).toBe(
        `${PRODUCTION_SITE_ORIGIN}${BUILT_APP_GITHUB_PAGES_BASE_PATH}${route}/`,
      );
      expect(urls).toContain(absolute);
    }
  });

  test("exclusion proofs stay out of app-relative and absolute sitemap inventories", () => {
    const routes = new Set(listPublicSitemapRoutes());
    const urls = new Set(
      listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV),
    );
    for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
      expect(routes.has(route)).toBe(false);
      expect(
        urls.has(
          resolveProductionSitemapLocHref(route, PROJECT_SITE_EXPORT_ENV),
        ),
      ).toBe(false);
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
