import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { exportHtmlRelativePath } from "@/lib/build/export-out-directory";
import {
  EXPORT_ROBOTS_RELATIVE_PATH,
  resolveProductionSitemapUrl,
} from "@/lib/seo/export-robots";
import { EXPORT_SITEMAP_RELATIVE_PATH } from "@/lib/seo/export-sitemap";
import {
  resolveProductionMetadataHref,
  resolveProductionSitemapLocHref,
} from "@/lib/seo/production-metadata-base";
import {
  DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES,
  listPublicSitemapAbsoluteUrls,
  PUBLIC_SITEMAP_LOCALE_HOME_ROUTES,
  SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_ROUTE,
} from "@/lib/seo/public-sitemap-routes";
import { resolveSocialPreviewImageAbsoluteHref } from "@/lib/seo/social-preview-assets";
import { verifyExportSeoDiscovery } from "@/lib/seo/verify-export-seo-discovery";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;

const PAGE_COPY: Record<
  string,
  { title: string; description: string; languages: Record<string, string> }
> = {
  "/": {
    title: "You Agent Factory",
    description: "CLI documentation",
    languages: {
      en: "/",
      ja: "/ja",
      "zh-CN": "/zh-CN",
      vi: "/vi",
      "x-default": "/",
    },
  },
  "/search": {
    title: "Search",
    description: "Search factory docs",
    languages: { en: "/search", "x-default": "/search" },
  },
  "/docs/concepts/harness": {
    title: "Harness",
    description: "Persistent workspaces",
    languages: {
      en: "/docs/concepts/harness",
      "x-default": "/docs/concepts/harness",
    },
  },
  "/blog/bottlenecks": {
    title: "Bottlenecks",
    description: "Where agent work stalls",
    // English-only blog policy: canonical only — no language alternates.
    languages: {},
  },
  "/docs/concepts/task-queue": {
    title: "Task queue",
    description: "Queued agent work",
    languages: {
      en: "/docs/concepts/task-queue",
      "x-default": "/docs/concepts/task-queue",
    },
  },
};

function sitemapXml(urls: readonly string[]): string {
  const body = urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function robotsTxt(sitemapUrl: string): string {
  return `User-Agent: *\nAllow: /\nSitemap: ${sitemapUrl}\n`;
}

function pageHtml(route: string): string {
  const copy = PAGE_COPY[route];
  if (copy === undefined) {
    throw new Error(`missing page copy for ${route}`);
  }

  const absolute = resolveProductionMetadataHref(
    route,
    PROJECT_SITE_EXPORT_ENV,
  );
  const social = resolveSocialPreviewImageAbsoluteHref(PROJECT_SITE_EXPORT_ENV);
  const alternates = Object.entries(copy.languages)
    .map(
      ([locale, path]) =>
        `<link rel="alternate" hreflang="${locale}" href="${resolveProductionMetadataHref(path, PROJECT_SITE_EXPORT_ENV)}" />`,
    )
    .join("\n");

  return `<!doctype html><html><head>
<link rel="canonical" href="${absolute}" />
<meta property="og:title" content="${copy.title}" />
<meta property="og:description" content="${copy.description}" />
<meta property="og:url" content="${absolute}" />
<meta property="og:image" content="${social}" />
<meta name="twitter:image" content="${social}" />
${alternates}
</head><body></body></html>`;
}

function writeDiscoveryFixture(outDir: string): void {
  for (const route of Object.keys(PAGE_COPY)) {
    const relative = exportHtmlRelativePath(route);
    const absolutePath = join(outDir, relative);
    mkdirSync(join(absolutePath, ".."), { recursive: true });
    writeFileSync(absolutePath, pageHtml(route));
  }

  writeFileSync(
    join(outDir, EXPORT_SITEMAP_RELATIVE_PATH),
    sitemapXml(listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV)),
  );
  writeFileSync(
    join(outDir, EXPORT_ROBOTS_RELATIVE_PATH),
    robotsTxt(resolveProductionSitemapUrl(PROJECT_SITE_EXPORT_ENV)),
  );
}

describe("verifyExportSeoDiscovery", () => {
  test("passes when export HTML/files satisfy the full SEO discovery contract", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-export-"));
    try {
      writeDiscoveryFixture(dir);
      const locs = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
      expect(locs.length).toBeGreaterThan(0);
      for (const loc of locs) {
        expect(loc.endsWith("/")).toBe(true);
      }
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when robots.txt is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-no-robots-"));
    try {
      writeDiscoveryFixture(dir);
      rmSync(join(dir, EXPORT_ROBOTS_RELATIVE_PATH), { force: true });
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.gate).toBe("robots");
        expect(result.reason).toContain("missing");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when sitemap lists a retired Atlas route", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-legacy-sitemap-"));
    try {
      writeDiscoveryFixture(dir);
      const urls = [
        ...listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV),
        resolveProductionSitemapLocHref(
          "/docs/models",
          PROJECT_SITE_EXPORT_ENV,
        ),
      ];
      writeFileSync(join(dir, EXPORT_SITEMAP_RELATIVE_PATH), sitemapXml(urls));
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.gate).toBe("sitemap");
        expect(result.reason).toMatch(/retired Atlas|non-live|unexpected/i);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when sitemap omits a locale home or shipped localized docs loc", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-locale-sitemap-"));
    try {
      writeDiscoveryFixture(dir);
      const good = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV);
      expect(PUBLIC_SITEMAP_LOCALE_HOME_ROUTES).toEqual([
        "/ja",
        "/zh-CN",
        "/vi",
      ]);

      const jaHome = resolveProductionSitemapLocHref(
        "/ja",
        PROJECT_SITE_EXPORT_ENV,
      );
      writeFileSync(
        join(dir, EXPORT_SITEMAP_RELATIVE_PATH),
        sitemapXml(good.filter((url) => url !== jaHome)),
      );
      const missingLocaleHome = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(missingLocaleHome.ok).toBe(false);
      if (!missingLocaleHome.ok) {
        expect(missingLocaleHome.gate).toBe("sitemap");
        expect(missingLocaleHome.reason).toContain(jaHome);
      }

      const shippedDocsAbsolute = resolveProductionSitemapLocHref(
        SITEMAP_SHIPPED_LOCALIZED_DOCS_PROOF_ROUTE,
        PROJECT_SITE_EXPORT_ENV,
      );
      writeFileSync(
        join(dir, EXPORT_SITEMAP_RELATIVE_PATH),
        sitemapXml(good.filter((url) => url !== shippedDocsAbsolute)),
      );
      const missingShippedDocs = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(missingShippedDocs.ok).toBe(false);
      if (!missingShippedDocs.ok) {
        expect(missingShippedDocs.gate).toBe("sitemap");
        expect(missingShippedDocs.reason).toContain(shippedDocsAbsolute);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("discovery fixture emits x-default on multi-locale pages and keeps blog English-only", () => {
    const home = PAGE_COPY["/"];
    expect(home?.languages["x-default"]).toBe("/");
    expect(PAGE_COPY["/docs/concepts/task-queue"]?.languages["x-default"]).toBe(
      "/docs/concepts/task-queue",
    );
    expect(PAGE_COPY["/blog/bottlenecks"]?.languages).toEqual({});

    const homeHtml = pageHtml("/");
    expect(homeHtml).toMatch(/hreflang=["']x-default["']/i);
    expect(pageHtml("/blog/bottlenecks")).not.toMatch(
      /hreflang=["'](ja|zh-CN|vi)["']/i,
    );
  });

  test("fails when home omits hreflang x-default", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-no-x-default-"));
    try {
      writeDiscoveryFixture(dir);
      writeFileSync(
        join(dir, "index.html"),
        pageHtml("/").replace(
          /\s*<link rel="alternate" hreflang="x-default"[^>]*>/i,
          "",
        ),
      );
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.gate).toBe("localized-alternates");
        expect(result.reason).toMatch(/x-default/i);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when blog proof advertises a false non-English locale alternate", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-false-blog-locale-"));
    try {
      writeDiscoveryFixture(dir);
      const blogRelative = exportHtmlRelativePath("/blog/bottlenecks");
      const falseJa = resolveProductionMetadataHref(
        "/ja/blog/bottlenecks",
        PROJECT_SITE_EXPORT_ENV,
      );
      writeFileSync(
        join(dir, blogRelative),
        pageHtml("/blog/bottlenecks").replace(
          "</head>",
          `<link rel="alternate" hreflang="ja" href="${falseJa}" />\n</head>`,
        ),
      );
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.gate).toBe("localized-alternates");
        expect(result.reason).toMatch(/blog\/bottlenecks|hreflang/i);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when sitemap lists a §10 documentation-migration exclusion route", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-migration-sitemap-"));
    try {
      writeDiscoveryFixture(dir);
      const migrationOld =
        DOCUMENTATION_ROUTE_MIGRATION_SITEMAP_EXCLUSION_ROUTES[0] as string;
      const urls = [
        ...listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV),
        resolveProductionSitemapLocHref(migrationOld, PROJECT_SITE_EXPORT_ENV),
      ];
      writeFileSync(join(dir, EXPORT_SITEMAP_RELATIVE_PATH), sitemapXml(urls));
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.gate).toBe("sitemap");
        expect(result.reason).toMatch(/migration old|unexpected|§10/i);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when sitemap locs use non-slash absolute production URLs", () => {
    const dir = mkdtempSync(join(tmpdir(), "seo-discovery-nonslash-sitemap-"));
    try {
      writeDiscoveryFixture(dir);
      const slashHarness = resolveProductionSitemapLocHref(
        "/docs/concepts/harness",
        PROJECT_SITE_EXPORT_ENV,
      );
      const nonSlashHarness = resolveProductionMetadataHref(
        "/docs/concepts/harness",
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(nonSlashHarness.endsWith("/")).toBe(false);
      const urls = listPublicSitemapAbsoluteUrls(PROJECT_SITE_EXPORT_ENV).map(
        (url) => (url === slashHarness ? nonSlashHarness : url),
      );
      writeFileSync(join(dir, EXPORT_SITEMAP_RELATIVE_PATH), sitemapXml(urls));
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.gate).toBe("sitemap");
        expect(result.reason).toContain(slashHarness);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when representative HTML lacks absolute production canonical", () => {
    const dir = mkdtempSync(
      join(tmpdir(), "seo-discovery-relative-canonical-"),
    );
    try {
      writeDiscoveryFixture(dir);
      writeFileSync(
        join(dir, "index.html"),
        pageHtml("/").replace(
          resolveProductionMetadataHref("/", PROJECT_SITE_EXPORT_ENV),
          `${PROJECT_SITE_BASE_PATH}/`,
        ),
      );
      const result = verifyExportSeoDiscovery({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(["absolute-canonicals", "page-open-graph"]).toContain(
          result.gate,
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
