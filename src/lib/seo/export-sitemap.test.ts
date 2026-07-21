import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sitemap, { dynamic as sitemapDynamic } from "@/app/sitemap";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { FACTORY_PUBLISHED_TAG_SLUGS } from "@/lib/content/factory-tags-browse";
import { listPublishedDocsEntries } from "@/lib/content/published-docs-registry-ids";
import { isDocumentationRouteMigrationOldPath } from "@/lib/seo/documentation-route-migration";
import { isLiveFactoryCanonicalPath } from "@/lib/seo/export-absolute-canonical";
import {
  buildPublicSitemapEntries,
  EXPORT_SITEMAP_RELATIVE_PATH,
  extractSitemapLocUrls,
  sitemapLocsMatchPublicFactoryContract,
  verifyExportSitemap,
} from "@/lib/seo/export-sitemap";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionMetadataHref,
  resolveProductionSitemapLocHref,
} from "@/lib/seo/production-metadata-base";
import {
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES,
  listPublicSitemapAbsoluteUrls,
  listPublicSitemapRoutes,
  PUBLIC_SITEMAP_DOCS_SECTION_ROUTES,
  PUBLIC_SITEMAP_SHELL_ROUTES,
  SITEMAP_EXCLUSION_PROOF_ROUTES,
  SITEMAP_INCLUSION_PROOF_ROUTES,
} from "@/lib/seo/public-sitemap-routes";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;
const ROOT_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: "",
} as const;

function sitemapXml(urls: readonly string[]): string {
  const body = urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

describe("public sitemap routes", () => {
  test("lists shell, docs sections, published articles, blog, and tags", () => {
    const routes = listPublicSitemapRoutes();

    for (const route of PUBLIC_SITEMAP_SHELL_ROUTES) {
      expect(routes).toContain(route);
    }
    for (const route of PUBLIC_SITEMAP_DOCS_SECTION_ROUTES) {
      expect(routes).toContain(route);
    }
    for (const entry of listPublishedDocsEntries()) {
      if (isDocumentationRouteMigrationOldPath(entry.url)) {
        expect(routes).not.toContain(entry.url);
        continue;
      }
      expect(routes).toContain(entry.url);
    }
    expect(routes).toContain("/blog/bottlenecks");
    expect(routes).toContain("/blog/comparing-agent-factories");
    for (const slug of FACTORY_PUBLISHED_TAG_SLUGS) {
      expect(routes).toContain(`/tags/${slug}`);
    }
  });

  test("never lists retired Atlas routes or deleted blogs", () => {
    const routes = listPublicSitemapRoutes();
    for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
      expect(routes).not.toContain(route);
      expect(isLiveFactoryCanonicalPath(route)).toBe(false);
    }
  });

  test("never lists §10 migration old documentation routes", () => {
    const routes = listPublicSitemapRoutes();
    for (const route of DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES) {
      expect(routes).not.toContain(route);
    }
  });

  test("absolute URLs use production origin and project-site base path", () => {
    const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(
        url.startsWith(`${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}`),
      ).toBe(true);
      expect(url.endsWith("/")).toBe(true);
    }
    for (const route of SITEMAP_INCLUSION_PROOF_ROUTES) {
      expect(urls).toContain(
        resolveProductionSitemapLocHref(route, PROJECT_SITE_EXPORT_ENV),
      );
    }
  });

  test("representative absolute sitemap locs use trailing slash while app-relative stay non-slash", () => {
    const routes = listPublicSitemapRoutes();
    const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
    const representativeRoutes = [
      "/docs/factories",
      "/docs/workers",
      "/docs/workstations",
      "/docs/concepts/harness",
      "/blog/bottlenecks",
      "/",
    ] as const;

    for (const route of representativeRoutes) {
      expect(routes).toContain(route);
      if (route !== "/") {
        expect(route.endsWith("/")).toBe(false);
        expect(routes).not.toContain(`${route}/`);
      }
      const absolute = resolveProductionSitemapLocHref(
        route,
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(absolute.endsWith("/")).toBe(true);
      expect(urls).toContain(absolute);
      if (route !== "/") {
        expect(urls).not.toContain(
          resolveProductionMetadataHref(route, PROJECT_SITE_EXPORT_ENV),
        );
      }
    }
  });

  test("absolute loc lists use the sitemap helper path and exclude Atlas / migration-old routes", () => {
    const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);

    for (const route of SITEMAP_INCLUSION_PROOF_ROUTES) {
      expect(urls).toContain(
        resolveProductionSitemapLocHref(route, PROJECT_SITE_EXPORT_ENV),
      );
    }
    for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
      expect(urls).not.toContain(
        resolveProductionSitemapLocHref(route, PROJECT_SITE_EXPORT_ENV),
      );
      expect(urls).not.toContain(
        resolveProductionMetadataHref(route, PROJECT_SITE_EXPORT_ENV),
      );
    }
    for (const route of DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES) {
      expect(urls).not.toContain(
        resolveProductionSitemapLocHref(route, PROJECT_SITE_EXPORT_ENV),
      );
    }
  });

  test("root / unset-base-path absolute URLs stay origin-only", () => {
    const urls = listPublicSitemapAbsoluteUrls(ROOT_EXPORT_ENV);
    for (const url of urls) {
      expect(url.startsWith(`${PRODUCTION_SITE_ORIGIN}/`)).toBe(true);
      expect(
        url.startsWith(`${PRODUCTION_SITE_ORIGIN}/you-agent-factory-docs`),
      ).toBe(false);
    }
  });
});

describe("export sitemap helpers", () => {
  test("extractSitemapLocUrls reads loc entries", () => {
    expect(
      extractSitemapLocUrls(
        sitemapXml([
          "https://example.com/",
          "https://example.com/docs/concepts/harness",
        ]),
      ),
    ).toEqual([
      "https://example.com/",
      "https://example.com/docs/concepts/harness",
    ]);
    expect(extractSitemapLocUrls("<urlset></urlset>")).toEqual([]);
  });

  test("buildPublicSitemapEntries emits absolute production urls", () => {
    const entries = buildPublicSitemapEntries(PROJECT_SITE_EXPORT_ENV);
    expect(entries.length).toBe(listPublicSitemapRoutes().length);
    expect(entries.every((entry) => typeof entry.url === "string")).toBe(true);
    expect(entries.map((entry) => entry.url)).toEqual(
      listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV),
    );
  });

  test("app/sitemap default export matches public factory entries", () => {
    expect(sitemapDynamic).toBe("force-static");
    const previousExport = process.env.NEXT_STATIC_EXPORT;
    const previousBase = process.env.GITHUB_PAGES_BASE_PATH;
    process.env.NEXT_STATIC_EXPORT = "1";
    process.env.GITHUB_PAGES_BASE_PATH = PROJECT_SITE_BASE_PATH;
    try {
      const entries = sitemap();
      expect(entries.map((entry) => entry.url)).toEqual(
        listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV),
      );
    } finally {
      if (previousExport === undefined) {
        delete process.env.NEXT_STATIC_EXPORT;
      } else {
        process.env.NEXT_STATIC_EXPORT = previousExport;
      }
      if (previousBase === undefined) {
        delete process.env.GITHUB_PAGES_BASE_PATH;
      } else {
        process.env.GITHUB_PAGES_BASE_PATH = previousBase;
      }
    }
  });

  test("sitemapLocsMatchPublicFactoryContract requires inclusion and excludes legacy", () => {
    const good = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
    expect(
      sitemapLocsMatchPublicFactoryContract(good, PROJECT_SITE_EXPORT_ENV),
    ).toBe(true);

    const withLegacy = [
      ...good,
      resolveProductionSitemapLocHref("/docs/models", PROJECT_SITE_EXPORT_ENV),
    ];
    expect(
      sitemapLocsMatchPublicFactoryContract(
        withLegacy,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);

    const missingHome = good.filter(
      (url) =>
        url !== resolveProductionSitemapLocHref("/", PROJECT_SITE_EXPORT_ENV),
    );
    expect(
      sitemapLocsMatchPublicFactoryContract(
        missingHome,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });

  test("sitemapLocsMatchPublicFactoryContract rejects non-slash absolute locs", () => {
    const good = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
    const nonSlashHarness = resolveProductionMetadataHref(
      "/docs/concepts/harness",
      PROJECT_SITE_EXPORT_ENV,
    );
    expect(nonSlashHarness.endsWith("/")).toBe(false);

    const withNonSlash = good.map((url) =>
      url ===
      resolveProductionSitemapLocHref(
        "/docs/concepts/harness",
        PROJECT_SITE_EXPORT_ENV,
      )
        ? nonSlashHarness
        : url,
    );
    expect(
      sitemapLocsMatchPublicFactoryContract(
        withNonSlash,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });

  test("verifyExportSitemap accepts a matching temp out/sitemap.xml", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "export-sitemap-"));
    try {
      const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
      writeFileSync(
        join(tempRoot, EXPORT_SITEMAP_RELATIVE_PATH),
        sitemapXml(urls),
      );

      const result = verifyExportSitemap({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.urls).toEqual(urls);
        for (const url of result.urls) {
          expect(url.endsWith("/")).toBe(true);
        }
        for (const route of SITEMAP_INCLUSION_PROOF_ROUTES) {
          expect(result.urls).toContain(
            resolveProductionSitemapLocHref(route, PROJECT_SITE_EXPORT_ENV),
          );
        }
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test("verifyExportSitemap rejects missing file, legacy urls, and relative locs", () => {
    const missing = verifyExportSitemap({
      env: PROJECT_SITE_EXPORT_ENV,
      outDir: join(tmpdir(), "export-sitemap-missing-does-not-exist"),
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.reason).toContain("missing");
    }

    const tempRoot = mkdtempSync(join(tmpdir(), "export-sitemap-bad-"));
    try {
      mkdirSync(tempRoot, { recursive: true });
      const urls = [
        ...listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV),
        resolveProductionSitemapLocHref(
          "/docs/modules/grouped-query-attention",
          PROJECT_SITE_EXPORT_ENV,
        ),
      ];
      writeFileSync(
        join(tempRoot, EXPORT_SITEMAP_RELATIVE_PATH),
        sitemapXml(urls),
      );
      const withLegacy = verifyExportSitemap({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(withLegacy.ok).toBe(false);
      if (!withLegacy.ok) {
        expect(withLegacy.reason).toMatch(/retired Atlas|non-live|unexpected/i);
      }

      writeFileSync(
        join(tempRoot, EXPORT_SITEMAP_RELATIVE_PATH),
        sitemapXml([`${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`]),
      );
      const relative = verifyExportSitemap({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(relative.ok).toBe(false);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test("verifyExportSitemap rejects non-slash absolute locs and §10 migration old urls", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "export-sitemap-slash-"));
    try {
      mkdirSync(tempRoot, { recursive: true });
      const good = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
      const slashHarness = resolveProductionSitemapLocHref(
        "/docs/concepts/harness",
        PROJECT_SITE_EXPORT_ENV,
      );
      const nonSlashHarness = resolveProductionMetadataHref(
        "/docs/concepts/harness",
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(nonSlashHarness.endsWith("/")).toBe(false);

      writeFileSync(
        join(tempRoot, EXPORT_SITEMAP_RELATIVE_PATH),
        sitemapXml(
          good.map((url) => (url === slashHarness ? nonSlashHarness : url)),
        ),
      );
      const withNonSlash = verifyExportSitemap({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(withNonSlash.ok).toBe(false);
      if (!withNonSlash.ok) {
        expect(withNonSlash.reason).toContain(slashHarness);
      }

      const migrationOld =
        DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES[0] as string;
      writeFileSync(
        join(tempRoot, EXPORT_SITEMAP_RELATIVE_PATH),
        sitemapXml([
          ...good,
          resolveProductionSitemapLocHref(
            migrationOld,
            PROJECT_SITE_EXPORT_ENV,
          ),
        ]),
      );
      const withMigrationOld = verifyExportSitemap({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(withMigrationOld.ok).toBe(false);
      if (!withMigrationOld.ok) {
        expect(withMigrationOld.reason).toMatch(
          /migration old|unexpected|§10/i,
        );
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
