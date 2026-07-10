import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import robots, { dynamic as robotsDynamic } from "@/app/robots";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import {
  buildPublicRobots,
  EXPORT_ROBOTS_RELATIVE_PATH,
  parseRobotsTxt,
  resolveProductionSitemapUrl,
  robotsPathAdvertisesLegacyAtlasRoute,
  robotsTxtMatchesPublicFactoryContract,
  verifyExportRobots,
} from "@/lib/seo/export-robots";
import { EXPORT_SITEMAP_RELATIVE_PATH } from "@/lib/seo/export-sitemap";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionMetadataHref,
} from "@/lib/seo/production-metadata-base";
import { SITEMAP_EXCLUSION_PROOF_ROUTES } from "@/lib/seo/public-sitemap-routes";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;
const ROOT_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: "",
} as const;

function robotsTxtBody(options: {
  sitemapUrl: string;
  allow?: string;
  disallow?: string;
}): string {
  const lines = ["User-Agent: *", `Allow: ${options.allow ?? "/"}`];
  if (options.disallow !== undefined) {
    lines.push(`Disallow: ${options.disallow}`);
  }
  lines.push(`Sitemap: ${options.sitemapUrl}`);
  return `${lines.join("\n")}\n`;
}

describe("resolveProductionSitemapUrl", () => {
  test("project-site export uses origin + base path + sitemap.xml", () => {
    expect(resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/${EXPORT_SITEMAP_RELATIVE_PATH}`,
    );
    expect(resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV)).toBe(
      resolveProductionMetadataHref(
        `/${EXPORT_SITEMAP_RELATIVE_PATH}`,
        PROJECT_SITE_EXPORT_ENV,
      ),
    );
  });

  test("root / unset-base-path stays origin-only", () => {
    expect(resolveProductionSitemapUrl(ROOT_EXPORT_ENV)).toBe(
      `${PRODUCTION_SITE_ORIGIN}/${EXPORT_SITEMAP_RELATIVE_PATH}`,
    );
    expect(resolveProductionSitemapUrl(ROOT_EXPORT_ENV)).not.toContain(
      "/you-agent-factory-docs",
    );
  });
});

describe("buildPublicRobots", () => {
  test("points sitemap at production URL and uses normal allow policy", () => {
    const entry = buildPublicRobots(PROJECT_SITE_EXPORT_ENV);
    expect(entry.sitemap).toBe(
      resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV),
    );
    expect(entry.rules).toEqual({
      userAgent: "*",
      allow: "/",
    });
  });

  test("does not specially advertise deleted legacy Atlas routes", () => {
    const entry = buildPublicRobots(PROJECT_SITE_EXPORT_ENV);
    const serialized = JSON.stringify(entry);
    for (const route of SITEMAP_EXCLUSION_PROOF_ROUTES) {
      expect(serialized).not.toContain(route);
    }
  });

  test("app/robots default export matches public factory robots", () => {
    expect(robotsDynamic).toBe("force-static");
    const previousExport = process.env.NEXT_STATIC_EXPORT;
    const previousBase = process.env.GITHUB_PAGES_BASE_PATH;
    process.env.NEXT_STATIC_EXPORT = "1";
    process.env.GITHUB_PAGES_BASE_PATH = PROJECT_SITE_BASE_PATH;
    try {
      expect(robots()).toEqual(buildPublicRobots(PROJECT_SITE_EXPORT_ENV));
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
});

describe("parseRobotsTxt and contract helpers", () => {
  test("parseRobotsTxt reads Sitemap / Allow / Disallow", () => {
    const parsed = parseRobotsTxt(
      robotsTxtBody({
        sitemapUrl: "https://example.com/sitemap.xml",
        allow: "/",
        disallow: "/private",
      }),
    );
    expect(parsed.sitemapUrls).toEqual(["https://example.com/sitemap.xml"]);
    expect(parsed.allowPaths).toEqual(["/"]);
    expect(parsed.disallowPaths).toEqual(["/private"]);
  });

  test("robotsPathAdvertisesLegacyAtlasRoute ignores site-root allow", () => {
    expect(robotsPathAdvertisesLegacyAtlasRoute("/")).toBe(false);
    expect(robotsPathAdvertisesLegacyAtlasRoute("/docs/models")).toBe(true);
    expect(robotsPathAdvertisesLegacyAtlasRoute("/topology")).toBe(true);
  });

  test("robotsTxtMatchesPublicFactoryContract requires production sitemap", () => {
    const good = robotsTxtBody({
      sitemapUrl: resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV),
    });
    expect(
      robotsTxtMatchesPublicFactoryContract(good, PROJECT_SITE_EXPORT_ENV),
    ).toBe(true);

    const wrongSitemap = robotsTxtBody({
      sitemapUrl: "https://example.com/sitemap.xml",
    });
    expect(
      robotsTxtMatchesPublicFactoryContract(
        wrongSitemap,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);

    const withLegacy = robotsTxtBody({
      sitemapUrl: resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV),
      disallow: "/docs/models",
    });
    expect(
      robotsTxtMatchesPublicFactoryContract(
        withLegacy,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });
});

describe("verifyExportRobots", () => {
  test("accepts matching temp out/robots.txt", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "export-robots-"));
    try {
      const sitemapUrl = resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV);
      writeFileSync(
        join(tempRoot, EXPORT_ROBOTS_RELATIVE_PATH),
        robotsTxtBody({ sitemapUrl }),
      );

      const result = verifyExportRobots({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.sitemapUrl).toBe(sitemapUrl);
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });

  test("rejects missing file, wrong sitemap, and legacy Atlas advertising", () => {
    const missing = verifyExportRobots({
      env: PROJECT_SITE_EXPORT_ENV,
      outDir: join(tmpdir(), "export-robots-missing-does-not-exist"),
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.reason).toContain("missing");
    }

    const tempRoot = mkdtempSync(join(tmpdir(), "export-robots-bad-"));
    try {
      mkdirSync(tempRoot, { recursive: true });
      writeFileSync(
        join(tempRoot, EXPORT_ROBOTS_RELATIVE_PATH),
        robotsTxtBody({ sitemapUrl: "https://example.com/sitemap.xml" }),
      );
      const wrong = verifyExportRobots({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(wrong.ok).toBe(false);
      if (!wrong.ok) {
        expect(wrong.reason).toContain("production sitemap");
      }

      writeFileSync(
        join(tempRoot, EXPORT_ROBOTS_RELATIVE_PATH),
        robotsTxtBody({
          sitemapUrl: resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV),
          disallow: "/docs/modules",
        }),
      );
      const legacy = verifyExportRobots({
        env: PROJECT_SITE_EXPORT_ENV,
        outDir: tempRoot,
      });
      expect(legacy.ok).toBe(false);
      if (!legacy.ok) {
        expect(legacy.reason).toMatch(/legacy Atlas|retired Atlas/i);
      }
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
