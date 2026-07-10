/**
 * Post-owned render proof for blog/bottlenecks.
 * Covers listicle shell, related concept link, and factory-ui teaching chart.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderBlogPostPage } from "@/app/(site)/site-renderers";

describe("bottlenecks blog post", () => {
  test("renders listicle, related concept link, and stage-throughput chart", async () => {
    const page = await renderBlogPostPage("bottlenecks");
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Factory bottlenecks");
    expect(html).toContain("Saturated task queue");
    expect(html).toContain("Where one stage caps the run");
    expect(html).toContain("bottlenecks-stage-throughput-chart");
    expect(html).toContain("Stage capacity vs end-to-end throughput");
    expect(html).toContain("Harness capacity is the scarce stage");
    expect(html).toContain("/docs/concepts/bottlenecks");
  });
});
