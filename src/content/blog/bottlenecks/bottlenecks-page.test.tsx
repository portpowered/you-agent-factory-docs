/**
 * Post-owned render proof for blog/bottlenecks.
 * Covers listicle shell, related concept link, and factory-ui teaching chart.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

describe("bottlenecks blog post", () => {
  test("renders listicle, prose concept link, chart, and next-post control", async () => {
    const page = await renderBlogPostPage("bottlenecks");
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Factory bottlenecks");
    expect(html.match(/<h1\b/g)?.length).toBe(1);
    expect(html).toContain("Foundations");
    expect(html).not.toContain('data-testid="tag-pill-list"');
    expect(html).not.toContain(">Tags</h2>");
    expect(html).not.toContain(">Summary</");
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
    expect(html).toContain("Saturated task queue");
    expect(html).toContain("Where one stage caps the run");
    expect(html).toContain("bottlenecks-stage-throughput-chart");
    expect(html).toContain("Stage capacity vs end-to-end throughput");
    expect(html).toContain("Harness capacity is the scarce stage");
    expect(html).toContain("/docs/concepts/bottlenecks");
    expect(html).toContain('data-testid="blog-next-post"');
    expect(html).toContain('aria-label="Next blog post"');
    expect(html).toContain('href="/blog/comparing-agent-factories"');
  });
});
