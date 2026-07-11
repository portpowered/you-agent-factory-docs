/**
 * Post-owned render proof for blog/useful-factory-links (stories 001–002).
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

const BLOG_SLUG = "useful-factory-links";
const BLOG_TITLE = "Useful factory links for you-agent-factory";

describe("useful-factory-links blog post (001–002)", () => {
  test("renders curated link groups, destinations, and related docs", async () => {
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

    // Five curated groups
    expect(html).toContain("CLI and repository");
    expect(html).toContain("Harnesses");
    expect(html).toContain("Workflow techniques");
    expect(html).toContain("MCP and dynamic workflows");
    expect(html).toContain("Relevant ecosystem reading");

    // Internal destinations (sample per group)
    expect(html).toContain('href="/docs/documentation/cli"');
    expect(html).toContain('href="/docs/documentation/install"');
    expect(html).toContain('href="/docs/guides/getting-started"');
    expect(html).toContain(
      'href="/docs/documentation/what-is-you-agent-factory"',
    );
    expect(html).toContain('href="/docs/documentation/harness-support"');
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).toContain('href="/docs/techniques/ralph"');
    expect(html).toContain('href="/docs/techniques/writer-reviewer"');
    expect(html).toContain('href="/docs/techniques/planner-executor"');
    expect(html).toContain(
      'href="/docs/guides/using-you-agent-factory-for-loops"',
    );
    expect(html).toContain('href="/docs/documentation/mcp"');
    expect(html).toContain('href="/docs/documentation/dynamic-workflows"');
    expect(html).toContain('href="/docs/guides/cursor-dynamic-workflows"');
    expect(html).toContain('href="/blog/comparing-agent-factories"');

    // External destinations checked at author time
    expect(html).toContain(
      'href="https://github.com/portpowered/you-agent-factory"',
    );
    expect(html).toContain('href="https://cursor.com/docs/agent/overview"');
    expect(html).toContain(
      'href="https://docs.anthropic.com/en/docs/claude-code"',
    );
    expect(html).toContain('href="https://modelcontextprotocol.io/"');
    expect(html).toContain('href="https://github.com/steveyegge/gastown"');
    expect(html).toContain('href="https://docs.temporal.io/"');
    expect(html).toContain('href="https://docs.dbos.dev/"');
    expect(html).toContain('href="https://docs.dagster.io/"');

    // Related-docs affordance (concept.harness resolves; docs also in MDX)
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("blog-related-docs-unavailable");
    expect(html).not.toContain("Give the compact version first");
    expect(html).not.toContain("Created from the blog-post MDX template");
  });
});
