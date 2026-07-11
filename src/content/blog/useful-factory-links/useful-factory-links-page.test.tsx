/**
 * Post-owned render proof for blog/useful-factory-links (story 001 shell).
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

const BLOG_SLUG = "useful-factory-links";
const BLOG_TITLE = "Useful factory links for you-agent-factory";

describe("useful-factory-links blog post shell (001)", () => {
  test("renders published post shell with title, context, takeaway, and related docs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`data-blog-slug="${BLOG_SLUG}"`);
    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(
      "When you already run (or are evaluating) you-agent-factory",
    );
    expect(html).toContain(
      "Use this shortlist to reach the CLI, supported-runtime, technique, MCP, and ecosystem pages",
    );
    expect(html).toContain("What this list covers");
    expect(html).toContain("CLI and repository");
    expect(html).toContain("Harnesses");
    expect(html).toContain("Workflow techniques");
    expect(html).toContain("MCP and dynamic workflows");
    expect(html).toContain("Relevant ecosystem reading");
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).toContain('href="/docs/documentation/cli"');
    expect(html).toContain('href="/docs/documentation/harness-support"');
    expect(html).toContain('href="/docs/documentation/mcp"');
    expect(html).toContain('href="/docs/documentation/dynamic-workflows"');
    expect(html).toContain(
      'href="/docs/documentation/what-is-you-agent-factory"',
    );
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).not.toContain("Give the compact version first");
    expect(html).not.toContain("Created from the blog-post MDX template");
    expect(html).not.toContain("blog-related-docs-unavailable");
  });
});
