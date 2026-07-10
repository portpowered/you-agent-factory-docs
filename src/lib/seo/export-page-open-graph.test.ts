import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateMetadata as generateBlogPostMetadata } from "@/app/(site)/blog/[slug]/page";
import { generateMetadata as generateHomeMetadata } from "@/app/(site)/page";
import { generateMetadata as generateSearchMetadata } from "@/app/(site)/search/page";
import { buildDocsPageMetadata } from "@/app/docs/docs-slug-renderer";
import { BUILT_APP_GITHUB_PAGES_BASE_PATH } from "@/lib/build/built-app-html-paths";
import { blogPostHref } from "@/lib/content/blog-page-load";
import {
  exportHtmlHasPageSpecificOpenGraph,
  extractOpenGraphTags,
  PAGE_OPEN_GRAPH_PROOF_ROUTES,
  verifyExportPageOpenGraph,
} from "@/lib/seo/export-page-open-graph";
import {
  PRODUCTION_SITE_ORIGIN,
  resolveProductionMetadataHref,
} from "@/lib/seo/production-metadata-base";

const PROJECT_SITE_BASE_PATH = BUILT_APP_GITHUB_PAGES_BASE_PATH;
const PROJECT_SITE_EXPORT_ENV = {
  NEXT_STATIC_EXPORT: "1",
  GITHUB_PAGES_BASE_PATH: PROJECT_SITE_BASE_PATH,
} as const;

function ogMeta(property: string, content: string): string {
  return `<meta property="${property}" content="${content}">`;
}

function pageHtml(options: {
  title: string;
  description: string;
  url: string;
  canonical?: string;
}): string {
  const canonical =
    options.canonical ?? `<link rel="canonical" href="${options.url}">`;
  return [
    canonical,
    ogMeta("og:title", options.title),
    ogMeta("og:description", options.description),
    ogMeta("og:url", options.url),
  ].join("\n");
}

describe("export Open Graph helpers", () => {
  test("extractOpenGraphTags reads property-first and content-first meta tags", () => {
    expect(
      extractOpenGraphTags(
        [
          ogMeta("og:title", "Home"),
          '<meta content="Desc" property="og:description">',
          ogMeta("og:url", "https://example.com/"),
        ].join(""),
      ),
    ).toEqual({
      title: "Home",
      description: "Desc",
      url: "https://example.com/",
    });
    expect(extractOpenGraphTags("<html></html>")).toEqual({
      title: null,
      description: null,
      url: null,
    });
  });

  test("exportHtmlHasPageSpecificOpenGraph requires factory OG and absolute og:url", () => {
    const appPath = "/docs/concepts/harness";
    const absolute = resolveProductionMetadataHref(
      appPath,
      PROJECT_SITE_EXPORT_ENV,
    );
    expect(
      exportHtmlHasPageSpecificOpenGraph(
        pageHtml({
          title: "Harness",
          description: "Persistent agent workspaces",
          url: absolute,
        }),
        appPath,
        PROJECT_SITE_EXPORT_ENV,
        { title: "Harness", description: "Persistent agent workspaces" },
      ),
    ).toBe(true);

    expect(
      exportHtmlHasPageSpecificOpenGraph(
        pageHtml({
          title: "Model Atlas",
          description: "Attention reference",
          url: absolute,
        }),
        appPath,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);

    expect(
      exportHtmlHasPageSpecificOpenGraph(
        pageHtml({
          title: "Harness",
          description: "Persistent agent workspaces",
          url: `${PROJECT_SITE_BASE_PATH}${appPath}`,
        }),
        appPath,
        PROJECT_SITE_EXPORT_ENV,
      ),
    ).toBe(false);
  });
});

describe("representative page metadata emits page-specific Open Graph", () => {
  test("home, search, docs article, and blog post mirror title/description/url", async () => {
    const home = await generateHomeMetadata();
    const search = await generateSearchMetadata();
    const docs = await buildDocsPageMetadata(["concepts", "harness"]);
    const blog = await generateBlogPostMetadata({
      params: Promise.resolve({ slug: "bottlenecks" }),
    });

    const cases = [
      { route: "/", metadata: home },
      { route: "/search", metadata: search },
      { route: "/docs/concepts/harness", metadata: docs },
      {
        route: blogPostHref("bottlenecks"),
        metadata: blog,
      },
    ] as const;

    for (const { route, metadata } of cases) {
      expect(typeof metadata.title).toBe("string");
      expect(typeof metadata.description).toBe("string");
      expect(String(metadata.title)).not.toMatch(/Model Atlas/i);
      expect(String(metadata.description)).not.toMatch(/Model Atlas/i);

      expect(String(metadata.openGraph?.title)).toBe(String(metadata.title));
      expect(String(metadata.openGraph?.description)).toBe(
        String(metadata.description),
      );
      expect(metadata.alternates?.canonical).toBe(route);
      expect(metadata.openGraph?.url).toBe(route);

      expect(
        resolveProductionMetadataHref(
          String(metadata.openGraph?.url),
          PROJECT_SITE_EXPORT_ENV,
        ),
      ).toBe(resolveProductionMetadataHref(route, PROJECT_SITE_EXPORT_ENV));
    }

    expect([...PAGE_OPEN_GRAPH_PROOF_ROUTES]).toEqual([
      "/",
      "/search",
      "/docs/concepts/harness",
      "/blog/bottlenecks",
    ]);
  });
});

describe("verifyExportPageOpenGraph", () => {
  test("passes when export HTML has page-specific OG matching absolute canonicals", () => {
    const dir = mkdtempSync(join(tmpdir(), "page-open-graph-export-"));
    try {
      const pages = [
        ["/", "you-agent-factory", "CLI documentation"],
        ["/search", "Search", "Search factory docs"],
        ["/docs/concepts/harness", "Harness", "Persistent workspaces"],
        ["/blog/bottlenecks", "Bottlenecks", "Where agent work stalls"],
      ] as const;

      for (const [route, title, description] of pages) {
        const absolute = resolveProductionMetadataHref(
          route,
          PROJECT_SITE_EXPORT_ENV,
        );
        const relative =
          route === "/" ? "index.html" : `${route.slice(1)}.html`;
        const absolutePath = join(dir, relative);
        mkdirSync(join(absolutePath, ".."), { recursive: true });
        writeFileSync(
          absolutePath,
          pageHtml({ title, description, url: absolute }),
        );
      }

      const result = verifyExportPageOpenGraph({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.openGraph["/"]?.url).toBe(
          `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/`,
        );
        expect(result.openGraph["/search"]?.title).toBe("Search");
        expect(result.openGraph["/docs/concepts/harness"]?.url).toBe(
          `${PRODUCTION_SITE_ORIGIN}${PROJECT_SITE_BASE_PATH}/docs/concepts/harness`,
        );
        expect(result.openGraph["/blog/bottlenecks"]?.description).toBe(
          "Where agent work stalls",
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("fails when og:url is only path-prefixed", () => {
    const dir = mkdtempSync(join(tmpdir(), "relative-og-export-"));
    try {
      const pages = [
        ["/", "Home", "Factory"],
        ["/search", "Search", "Factory search"],
        ["/docs/concepts/harness", "Harness", "Workspaces"],
        ["/blog/bottlenecks", "Bottlenecks", "Stalls"],
      ] as const;

      for (const [route, title, description] of pages) {
        const relative =
          route === "/" ? "index.html" : `${route.slice(1)}.html`;
        const absolutePath = join(dir, relative);
        mkdirSync(join(absolutePath, ".."), { recursive: true });
        writeFileSync(
          absolutePath,
          pageHtml({
            title,
            description,
            url:
              route === "/"
                ? `${PROJECT_SITE_BASE_PATH}/`
                : `${PROJECT_SITE_BASE_PATH}${route}`,
          }),
        );
      }

      const result = verifyExportPageOpenGraph({
        outDir: dir,
        env: PROJECT_SITE_EXPORT_ENV,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toContain("og:url");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
