/**
 * Post-owned render proof for blog/factories-building-factory-docs (story 001).
 * Covers examination shell: title, context, summary, and related-docs affordance.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

const BLOG_SLUG = "factories-building-factory-docs";
const BLOG_TITLE = "Factories building the factory docs";

describe("factories-building-factory-docs blog post shell", () => {
  test("renders examination title, context, summary, and related docs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(
      "This documentation site was not authored as a one-shot chat dump",
    );
    expect(html).toContain("Why this docs site is a factory workload");
    expect(html).toContain("Patterns that showed up");
    expect(html).toContain("Planner and executor lanes");
    expect(html).toContain("Harness-driven loops");
    expect(html).toContain("Worktrees and isolation");
    expect(html).toContain("/docs/documentation/what-is-you-agent-factory");
    expect(html).toContain("/docs/techniques/planner-executor");
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain(
      'data-testid="blog-related-docs-partial-unavailable"',
    );
    expect(html).toContain("/docs/concepts/harness");
    expect(html).toContain("/docs/concepts/worktree");
    expect(html).toContain("/docs/concepts/loop");
  });
});
