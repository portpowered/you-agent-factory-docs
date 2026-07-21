import { describe, expect, test } from "bun:test";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  buildLocalizedRoute,
  defaultLocale,
  FACTORY_SHIPPED_LOCALES,
} from "@/lib/content/factory-locale-base-path";
import {
  getShippedLocalizedDocsSlugs,
  isShippedLocalizedDocsSlug,
  type NonDefaultLocale,
} from "@/lib/content/shipped-localized-docs";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionSitemapLocHref,
} from "@/lib/seo/production-metadata-base";
import {
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES,
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_INCLUSION_ROUTES,
  listPublicSitemapAbsoluteUrls,
  listPublicSitemapLocalizedDocsRoutes,
  listPublicSitemapRoutes,
  PUBLIC_SITEMAP_LOCALE_HOME_ROUTES,
  SITEMAP_EXCLUSION_PROOF_ROUTES,
  SITEMAP_INCLUSION_PROOF_ROUTES,
  SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_ROUTE,
  SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_SLUG,
} from "@/lib/seo/public-sitemap-routes";

const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: BUILT_APP_GITHUB_PAGES_BASE_PATH,
} as const;

/** Published English docs slug that is not shipped for non-default locales. */
const UNSHIPPED_LOCALIZED_DOCS_PROOF_SLUG = "workstations/poller";

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

  test("inclusion proofs require locale homes and a shipped localized docs route", () => {
    const routes = listPublicSitemapRoutes();
    const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
    const proofSet = new Set<string>(SITEMAP_INCLUSION_PROOF_ROUTES);

    expect(PUBLIC_SITEMAP_LOCALE_HOME_ROUTES).toEqual(["/ja", "/zh-CN", "/vi"]);
    for (const home of PUBLIC_SITEMAP_LOCALE_HOME_ROUTES) {
      expect(proofSet.has(home)).toBe(true);
      expect(routes).toContain(home);
      const absolute = resolveProductionSitemapLocHref(
        home,
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(absolute.endsWith("/")).toBe(true);
      expect(urls).toContain(absolute);
    }

    expect(
      isShippedLocalizedDocsSlug(
        SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_SLUG,
        "ja",
      ),
    ).toBe(true);
    expect(SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_ROUTE).toBe(
      "/ja/docs/concepts/harness",
    );
    expect(proofSet.has(SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_ROUTE)).toBe(true);
    expect(routes).toContain(SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_ROUTE);
    expect(urls).toContain(
      resolveProductionSitemapLocHref(
        SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_ROUTE,
        PROJECT_SITE_EXPORT_ENV,
      ),
    );

    // Inclusion proofs must not invent unshipped locale×page combinations.
    const unshippedGhost = buildLocalizedRoute(
      { surface: "docs-page", slug: UNSHIPPED_LOCALIZED_DOCS_PROOF_SLUG },
      "ja",
    );
    expect(proofSet.has(unshippedGhost)).toBe(false);
    expect(routes).not.toContain(unshippedGhost);
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

  test("includes shipped localized docs routes only (fail-closed, no cartesian product)", () => {
    const routes = listPublicSitemapRoutes();
    const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
    const localizedCandidates = listPublicSitemapLocalizedDocsRoutes();
    const nonDefaultLocales = FACTORY_SHIPPED_LOCALES.filter(
      (locale): locale is NonDefaultLocale => locale !== defaultLocale,
    );

    expect(
      isShippedLocalizedDocsSlug(
        SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_SLUG,
        "ja",
      ),
    ).toBe(true);
    expect(
      isShippedLocalizedDocsSlug(UNSHIPPED_LOCALIZED_DOCS_PROOF_SLUG, "ja"),
    ).toBe(false);

    for (const locale of nonDefaultLocales) {
      const expectedFromManifest = getShippedLocalizedDocsSlugs(locale).map(
        (slug) => buildLocalizedRoute({ surface: "docs-page", slug }, locale),
      );
      for (const route of expectedFromManifest) {
        expect(localizedCandidates).toContain(route);
      }

      const shippedProof = buildLocalizedRoute(
        {
          surface: "docs-page",
          slug: SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_SLUG,
        },
        locale,
      );
      expect(routes).toContain(shippedProof);
      expect(shippedProof.endsWith("/")).toBe(false);
      const absolute = resolveProductionSitemapLocHref(
        shippedProof,
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(absolute.endsWith("/")).toBe(true);
      expect(absolute).toBe(
        `${PRODUCTION_SITE_ORIGIN}${BUILT_APP_GITHUB_PAGES_BASE_PATH}${shippedProof}/`,
      );
      expect(urls).toContain(absolute);

      const unshippedGhost = buildLocalizedRoute(
        { surface: "docs-page", slug: UNSHIPPED_LOCALIZED_DOCS_PROOF_SLUG },
        locale,
      );
      expect(localizedCandidates).not.toContain(unshippedGhost);
      expect(routes).not.toContain(unshippedGhost);
      expect(urls).not.toContain(
        resolveProductionSitemapLocHref(
          unshippedGhost,
          PROJECT_SITE_EXPORT_ENV,
        ),
      );
    }

    // Candidate list is exactly the manifest expansion — not English×locale.
    expect(localizedCandidates).toEqual(
      nonDefaultLocales.flatMap((locale) =>
        getShippedLocalizedDocsSlugs(locale).map((slug) =>
          buildLocalizedRoute({ surface: "docs-page", slug }, locale),
        ),
      ),
    );
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
