import { describe, expect, test } from "bun:test";
import {
  blogPostHref,
  loadBlogPostFromDisk,
} from "@/lib/content/blog-page-load";
import { renderBlogPostShell } from "@/lib/content/blog-shell-render";

const BOTTLENECKS_BLOG_SLUG = "bottlenecks";
const COMPARING_BLOG_SLUG = "comparing-agent-factories";

describe("blog related docs integration", () => {
  test("published blog post renders explicit relatedDocIds as compact docs links", async () => {
    const post = await loadBlogPostFromDisk(BOTTLENECKS_BLOG_SLUG);
    const html = renderBlogPostShell(post);

    expect(blogPostHref(BOTTLENECKS_BLOG_SLUG)).toBe("/blog/bottlenecks");
    expect(post.frontmatter.relatedDocIds).toEqual(["concept.bottlenecks"]);
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).toContain('href="/docs/concepts/bottlenecks"');
    expect(html).not.toContain("concept.bottlenecks");
  });

  test("comparing-agent-factories renders landed documentation and concept related docs", async () => {
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
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).toContain(
      'href="/docs/documentation/what-is-you-agent-factory"',
    );
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).not.toContain("documentation.what-is-you-agent-factory");
    expect(html).not.toContain("concept.harness");
  });
});
