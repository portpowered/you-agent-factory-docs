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
import { resolveProductionMetadataHref } from "@/lib/seo/production-metadata-base";
import { listPublicSitemapAbsoluteUrls } from "@/lib/seo/public-sitemap-routes";
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
    title: "you-agent-factory",
    description: "CLI documentation",
    languages: {
      en: "/",
      ja: "/ja",
      "zh-CN": "/zh-CN",
      vi: "/vi",
    },
  },
  "/search": {
    title: "Search",
    description: "Search factory docs",
    languages: { en: "/search" },
  },
  "/docs/concepts/harness": {
    title: "Harness",
    description: "Persistent workspaces",
    languages: { en: "/docs/concepts/harness" },
  },
  "/blog/bottlenecks": {
    title: "Bottlenecks",
    description: "Where agent work stalls",
    languages: { en: "/blog/bottlenecks" },
  },
  "/docs/concepts/task-queue": {
    title: "Task queue",
    description: "Queued agent work",
    languages: { en: "/docs/concepts/task-queue" },
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
        resolveProductionMetadataHref("/docs/models", PROJECT_SITE_EXPORT_ENV),
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
