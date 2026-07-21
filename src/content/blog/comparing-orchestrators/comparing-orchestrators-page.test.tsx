/**
 * Post-owned render proof for blog/comparing-orchestrators (story 001).
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

const BLOG_SLUG = "comparing-orchestrators";
const BLOG_TITLE = "Comparing orchestrators by feature attributes";
const BLOG_DESCRIPTION =
  "Explore orchestrator tradeoffs across open source, license, hosting, and capabilities—feature-attribute comparison, not a benchmark leaderboard.";

describe("comparing-orchestrators blog shell (001)", () => {
  test("renders published post shell with title, description, and intro teaching signal", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`data-blog-slug="${BLOG_SLUG}"`);
    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html.match(/<h1\b/g)?.length).toBe(1);
    expect(html).not.toContain(">Summary</");
    expect(html).not.toContain("Created from the blog-post MDX template");
    expect(html).not.toContain("Give the compact version first");

    expect(html).toContain("What an orchestrator is");
    expect(html).toContain("How to read the feature matrix");
    expect(html).toContain("feature attributes");
    expect(html).toContain("ranking of benchmark scores");
    expect(html).toContain('href="/blog/comparing-agent-factories"');
    expect(html).toContain(
      'href="/docs/documentation/what-is-you-agent-factory"',
    );
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).toContain('href="/docs/techniques/planner-executor"');
    expect(html).toContain("you-agent-factory");
    expect(html).toContain("Custom scripts");
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
  });
});
