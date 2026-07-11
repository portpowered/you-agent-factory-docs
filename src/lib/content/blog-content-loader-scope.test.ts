/**
 * Lane isolation proof for the blog content loader foundation.
 * Verifies loader APIs stay blog-owned and public shell surfaces remain blog-free.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBrowseIndexPage } from "@/app/(site)/site-renderers";
import * as blogFrontmatter from "@/lib/content/blog-frontmatter";
import { getPublishedBlogPostBySlug } from "@/lib/content/blog-post-get";
import { listPublishedBlogPosts } from "@/lib/content/blog-post-list";
import * as blogPostLoad from "@/lib/content/blog-post-load";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { collectSidebarPageLinks } from "@/lib/navigation/docs-sidebar-contract";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import { source } from "@/lib/source";

const BLOG_URL_PREFIX = "/blog";

function expectExportDefined(
  module: Record<string, unknown>,
  exportName: string,
): void {
  expect(module[exportName]).toBeDefined();
}

describe("blog content loader lane isolation", () => {
  test("production blog root exposes committed published posts through loader APIs while unknown slugs stay null", async () => {
    const published = await listPublishedBlogPosts();
    const slugs = published.map((post) => post.slug).sort();

    expect(slugs).toEqual(
      [
        "bottlenecks",
        "comparing-agent-factories",
        "factories-building-factory-docs",
        "lies-damned-lies-evals",
        "useful-factory-links",
      ].sort(),
    );
    await expect(
      getPublishedBlogPostBySlug("bottlenecks"),
    ).resolves.toMatchObject({ slug: "bottlenecks" });
    await expect(
      getPublishedBlogPostBySlug("comparing-agent-factories"),
    ).resolves.toMatchObject({ slug: "comparing-agent-factories" });
    await expect(
      getPublishedBlogPostBySlug("factories-building-factory-docs"),
    ).resolves.toMatchObject({ slug: "factories-building-factory-docs" });
    await expect(
      getPublishedBlogPostBySlug("lies-damned-lies-evals"),
    ).resolves.toMatchObject({ slug: "lies-damned-lies-evals" });
    await expect(
      getPublishedBlogPostBySlug("useful-factory-links"),
    ).resolves.toMatchObject({ slug: "useful-factory-links" });

    await expect(
      getPublishedBlogPostBySlug("evolution-of-diffusion"),
    ).resolves.toBeNull();
    await expect(
      getPublishedBlogPostBySlug(
        "llms-no-longer-wholly-reliant-on-the-internet",
      ),
    ).resolves.toBeNull();
    await expect(
      getPublishedBlogPostBySlug("roofline-throughput-explorer"),
    ).resolves.toBeNull();
    await expect(
      getPublishedBlogPostBySlug("example-post"),
    ).resolves.toBeNull();
  });

  test("blog loader public APIs are consumable from blog-owned modules", () => {
    expectExportDefined(blogFrontmatter, "parseBlogPostFrontmatter");
    expectExportDefined(blogFrontmatter, "isBlogPostPubliclyVisible");
    expectExportDefined(blogPostLoad, "loadBlogPostSidecars");
    expectExportDefined(blogPostLoad, "readBlogPostFrontmatter");
    expect(typeof listPublishedBlogPosts).toBe("function");
    expect(typeof getPublishedBlogPostBySlug).toBe("function");
  });

  test("public browse, sidebar, and search catalogs do not expose blog routes", async () => {
    const browseHtml = renderToStaticMarkup(await renderBrowseIndexPage());
    const sidebarUrls = collectSidebarPageLinks(source.pageTree).map(
      (link) => link.url,
    );
    const registry = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const searchUrls = buildSearchDocuments(pages, registry).map(
      (document) => document.url,
    );

    expect(browseHtml).not.toContain(BLOG_URL_PREFIX);
    expect(sidebarUrls.some((url) => url.startsWith(BLOG_URL_PREFIX))).toBe(
      false,
    );
    expect(searchUrls.some((url) => url.startsWith(BLOG_URL_PREFIX))).toBe(
      false,
    );
  });
});
