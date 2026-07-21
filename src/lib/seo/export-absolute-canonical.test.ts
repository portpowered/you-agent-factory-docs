import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateMetadata as generateBlogPostMetadata } from "@/app/(site)/(with-docs-chrome)/blog/[slug]/page";
import { generateMetadata as generateHomeMetadata } from "@/app/(site)/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { exportHtmlRelativePath } from "@/lib/build/export-out-directory";
import { blogPostHref } from "@/lib/content/blog-page-load";
import {
  ABSOLUTE_CANONICAL_PROOF_ROUTES,
  exportHtmlHasAbsoluteProductionCanonical,
  extractCanonicalHref,
  isAbsoluteProductionCanonicalHref,
  isCanonicalPublicDiscoveryPath,
  isLiveFactoryCanonicalPath,
  verifyExportAbsoluteCanonicals,
} from "@/lib/seo/export-absolute-canonical";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionMetadataHref,
} from "@/lib/seo/production-metadata-base";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;
const ROOT_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: "",
} as const;

function canonicalLink(href: string): string {
  return `<link rel="canonical" href="${href}">`;
}

describe("export absolute canonical helpers", () => {
  test("extractCanonicalHref reads rel-first and href-first link tags", () => {
    expect(
      extractCanonicalHref(canonicalLink("https://example.com/docs")),
    ).toBe("https://example.com/docs");
    expect(
      extractCanonicalHref('<link href="/docs/guides" rel="canonical">'),
    ).toBe("/docs/guides");
    expect(extractCanonicalHref("<html></html>")).toBeNull();
  });

  test("isAbsoluteProductionCanonicalHref requires origin + project-site base on export", () => {
    const absolute = `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`;
    expect(
      isAbsoluteProductionCanonicalHref(absolute, PROJECT_SITE_EXPORT_ENV),
    ).toBe(true);
    expect(
      isAbsoluteProductionCanonicalHref(
        `${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
    expect(
      isAbsoluteProductionCanonicalHref(
        "/docs/concepts/harness",
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
    expect(
      isAbsoluteProductionCanonicalHref(
        `${PRODUCTION_SITE_ORIGIN}/docs/concepts/harness`,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });

  test("root / unset-base-path absolute canonicals stay origin-only", () => {
    expect(
      isAbsoluteProductionCanonicalHref(
        `${PRODUCTION_SITE_ORIGIN}/docs/concepts/harness`,
        ROOT_EXPORT_ENV,
      ),
    ).toBe(true);
    expect(
      isAbsoluteProductionCanonicalHref(
        `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`,
        ROOT_EXPORT_ENV,
      ),
    ).toBe(false);
  });

  test("isLiveFactoryCanonicalPath rejects retired Atlas routes and deleted blogs", () => {
    expect(isLiveFactoryCanonicalPath("/")).toBe(true);
    expect(isLiveFactoryCanonicalPath("/docs/concepts/harness")).toBe(true);
    expect(isLiveFactoryCanonicalPath("/blog/bottlenecks")).toBe(true);
    expect(isLiveFactoryCanonicalPath("/docs/models/gpt-3")).toBe(false);
    expect(isLiveFactoryCanonicalPath("/docs/modules/attention")).toBe(false);
    expect(isLiveFactoryCanonicalPath("/topology")).toBe(false);
    expect(isLiveFactoryCanonicalPath("/docs/timeline")).toBe(false);
    expect(isLiveFactoryCanonicalPath("/blog/evolution-of-diffusion")).toBe(
      false,
    );
    expect(
      isLiveFactoryCanonicalPath("/ja/docs/modules/grouped-query-attention"),
    ).toBe(false);
  });

  test("isCanonicalPublicDiscoveryPath excludes §10 migration old routes while keeping them live", () => {
    expect(isLiveFactoryCanonicalPath("/docs/documentation/api-doc")).toBe(
      true,
    );
    expect(isCanonicalPublicDiscoveryPath("/docs/documentation/api-doc")).toBe(
      false,
    );
    expect(isCanonicalPublicDiscoveryPath("/docs/references/api")).toBe(true);
    expect(
      isCanonicalPublicDiscoveryPath("/ja/docs/documentation/configuration"),
    ).toBe(false);
  });

  test("exportHtmlHasAbsoluteProductionCanonical requires absolute production href", () => {
    const appPath = "/docs/concepts/harness";
    const absolute = resolveProductionMetadataHref(
      appPath,
      PROJECT_SITE_EXPORT_ENV,
    );
    expect(
      exportHtmlHasAbsoluteProductionCanonical(
        canonicalLink(absolute),
        appPath,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(true);
    expect(
      exportHtmlHasAbsoluteProductionCanonical(
        canonicalLink(`${PROJECT_SITE_BASE_PATH}${appPath}`),
        appPath,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
    expect(
      exportHtmlHasAbsoluteProductionCanonical(
        canonicalLink(appPath),
        appPath,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });
});

describe("representative page metadata resolves to absolute production canonicals", () => {
  test("home, docs article, and blog post emit live app-relative canonicals", async () => {
    const home = await generateHomeMetadata();
    const docs = await buildDocsPageMetadata(["concepts", "harness"]);
    const blog = await generateBlogPostMetadata({
      params: Promise.resolve({ slug: "bottlenecks" }),
    });

    const homeCanonical = home.alternates?.canonical;
    const docsCanonical = docs.alternates?.canonical;
    const blogCanonical = blog.alternates?.canonical;

    expect(homeCanonical).toBe("/");
    expect(docsCanonical).toBe("/docs/concepts/harness");
    expect(blogCanonical).toBe(blogPostHref("bottlenecks"));

    for (const [route, canonical] of [
      ["/", homeCanonical],
      ["/docs/concepts/harness", docsCanonical],
      ["/blog/bottlenecks", blogCanonical],
    ] as const) {
      expect(typeof canonical).toBe("string");
      expect(isLiveFactoryCanonicalPath(canonical as string)).toBe(true);
      expect(
        resolveProductionMetadataHref(
          canonical as string,
          PROJECT_SITE_EXPORT_ENV,
        ),
      ).toBe(resolveProductionMetadataHref(route, PROJECT_SITE_EXPORT_ENV));
      expect(
        isAbsoluteProductionCanonicalHref(
          resolveProductionMetadataHref(
            canonical as string,
            PROJECT_SITE_EXPORT_ENV,
          ),
          PROJECT_SITE_EXPORT_ENV,
        ),
      ).toBe(true);
    }

    expect([...ABSOLUTE_CANONICAL_PROOF_ROUTES]).toEqual([
      "/",
      "/docs/concepts/harness",
      "/blog/bottlenecks",
    ]);
  });

  test("proof routes never resolve to deleted legacy Atlas canonicals", () => {
    for (const route of ABSOLUTE_CANONICAL_PROOF_ROUTES) {
      const absolute = resolveProductionMetadataHref(
        route,
        PROJECT_SITE_EXPORT_ENV,
      );
      expect(absolute).toContain(PROJECT_SITE_BASE_PATH);
      expect(absolute).not.toContain("/docs/models");
      expect(absolute).not.toContain("/docs/modules");
      expect(absolute).not.toContain("/topology");
      expect(absolute).not.toContain("/blog/evolution-of-diffusion");
      expect(isLiveFactoryCanonicalPath(route)).toBe(true);
    }
  });
});

describe("verifyExportAbsoluteCanonicals", () => {
  test("passes when export HTML has absolute production canonicals for proof routes", () => {
    const dir = mkdtempSync(join(tmpdir(), "absolute-canonical-export-"));
    try {
      for (const route of [
        "/",
        "/docs/concepts/harness",
        "/blog/bottlenecks",
      ] as const) {
        const relative = exportHtmlRelativePath(route);
        const absolutePath = join(dir, relative);
        mkdirSync(join(absolutePath, ".."), { recursive: true });
        writeFileSync(
          absolutePath,
          canonicalLink(
            resolveProductionMetadataHref(route, PROJECT_SITE_EXPORT_ENV),
          ),
        );
      }

      const result = verifyExportAbsoluteCanonicals({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.canonicals["/"]).toBe(
          `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/`,
        );
        expect(result.canonicals["/docs/concepts/harness"]).toBe(
          `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`,
        );
        expect(result.canonicals["/blog/bottlenecks"]).toBe(
          `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/blog/bottlenecks`,
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when export HTML only has path-prefixed relative canonicals", () => {
    const dir = mkdtempSync(join(tmpdir(), "relative-canonical-export-"));
    try {
      for (const [route, href] of [
        ["/", `${PROJECT_SITE_BASE_PATH}/`],
        [
          "/docs/concepts/harness",
          `${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`,
        ],
        ["/blog/bottlenecks", `${PROJECT_SITE_BASE_PATH}/blog/bottlenecks`],
      ] as const) {
        const relative = exportHtmlRelativePath(route);
        const absolutePath = join(dir, relative);
        mkdirSync(join(absolutePath, ".."), { recursive: true });
        writeFileSync(absolutePath, canonicalLink(href));
      }

      const result = verifyExportAbsoluteCanonicals({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("absolute production URL");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
