import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";
import {
  blogPostHref,
  loadBlogPostFromDisk,
} from "@/lib/content/blog-page-load";
import { renderBlogPostShell } from "@/lib/content/blog-shell-render";

const BOTTLENECKS_BLOG_SLUG = "bottlenecks";
const COMPARING_BLOG_SLUG = "comparing-agent-factories";

describe("blog related docs integration", () => {
  test("published blog post keeps relatedDocIds metadata without related-docs chrome", async () => {
    const post = await loadBlogPostFromDisk(BOTTLENECKS_BLOG_SLUG);
    const html = renderBlogPostShell(post);

    expect(blogPostHref(BOTTLENECKS_BLOG_SLUG)).toBe("/blog/bottlenecks");
    expect(post.frontmatter.relatedDocIds).toEqual(["concept.bottlenecks"]);
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
    expect(html).toContain('href="/docs/concepts/bottlenecks"');
    expect(html).not.toContain("concept.bottlenecks");
  });

  test("comparing-agent-factories keeps relatedDocIds and in-prose docs links without related-docs chrome", async () => {
    const post = await loadBlogPostFromDisk(COMPARING_BLOG_SLUG);
    const html = renderBlogPostShell(post);

    expect(blogPostHref(COMPARING_BLOG_SLUG)).toBe(
      "/blog/comparing-agent-factories",
    );
    expect(post.frontmatter.relatedDocIds).toEqual([
      "documentation.what-is-you-agent-factory",
      "concept.harness",
    ]);
    expect(html).toContain('href="/blog/comparing-agent-factories"');
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
    expect(html).toContain(
      'href="/docs/documentation/what-is-you-agent-factory"',
    );
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).toContain('href="/blog/comparing-orchestrators"');
    expect(html).not.toContain("documentation.what-is-you-agent-factory");
    expect(html).not.toContain("concept.harness");
  });

  test("full post render exposes next-post for mid-list and omits it for last", async () => {
    const bottlenecksHtml = renderToStaticMarkup(
      await renderBlogPostPage(BOTTLENECKS_BLOG_SLUG),
    );
    const comparingHtml = renderToStaticMarkup(
      await renderBlogPostPage(COMPARING_BLOG_SLUG),
    );

    expect(bottlenecksHtml).not.toContain('data-testid="blog-related-docs"');
    expect(bottlenecksHtml).not.toContain(">Summary</");
    expect(bottlenecksHtml).toContain('data-testid="blog-next-post"');
    expect(bottlenecksHtml).toContain('aria-label="Next blog post"');
    expect(bottlenecksHtml).toContain('href="/blog/comparing-agent-factories"');

    expect(comparingHtml).not.toContain('data-testid="blog-related-docs"');
    expect(comparingHtml).not.toContain(">Summary</");
    expect(comparingHtml).not.toContain('data-testid="blog-next-post"');
  });
});
