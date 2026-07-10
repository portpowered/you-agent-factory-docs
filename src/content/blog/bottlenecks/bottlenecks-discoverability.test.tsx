/**
 * Discoverability proof for `/blog/bottlenecks` (story 004).
 * Covers blog index listing, search queries, and foundations tag landing.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { loadTagResourceGroups } from "@/lib/content/tag-resources";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { docsSearchApi } from "@/lib/search/search-server";

const BLOG_SLUG = "bottlenecks";
const BLOG_ROUTE = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "Factory bottlenecks: where long-running agent work actually stalls";
const BLOG_DESCRIPTION =
  "A listicle comparison of common you-agent-factory limiting stages—queues, workers, harness latency, shared resources, and token pressure—and how to read them against the bottlenecks concept.";

const DISCOVERY_QUERIES = [
  "factory bottlenecks",
  "harness latency",
  "token pressure",
  "saturated task queue",
] as const;

describe("bottlenecks blog discoverability (004)", () => {
  test("blog index lists the post with title, description, published date, and tags", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html).toContain('dateTime="2026-07-09"');
    expect(html).toContain("July 9, 2026");
    expect(html).toContain("Foundations");
    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain(`aria-label="Read blog post: ${BLOG_TITLE}"`);
  });

  test("blog index orders the post ahead of comparing-agent-factories by slug tie-break when dates match", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    const bottlenecksPos = html.indexOf(`href="${BLOG_ROUTE}"`);
    const comparingPos = html.indexOf('href="/blog/comparing-agent-factories"');
    expect(bottlenecksPos).toBeGreaterThanOrEqual(0);
    expect(comparingPos).toBeGreaterThanOrEqual(0);
    expect(bottlenecksPos).toBeLessThan(comparingPos);
  });

  test.each(DISCOVERY_QUERIES.map((query) => [query] as const))(
    "search surfaces the post for %s",
    async (query) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === BLOG_ROUTE)).toBe(true);
    },
    { timeout: 20_000 },
  );

  test("foundations tag landing includes the post in blog groups", async () => {
    const messages = await loadUiMessages();
    const groups = await loadTagResourceGroups("foundations", messages, "en");
    const blogGroup = groups.find((group) => group.kind === "blog");

    expect(blogGroup).toBeDefined();
    expect(
      blogGroup?.resources.some((resource) => resource.slug === BLOG_SLUG),
    ).toBe(true);
    expect(
      blogGroup?.resources.some((resource) => resource.title === BLOG_TITLE),
    ).toBe(true);
  });

  test("post still renders narrative, related concept link, and factory-ui chart", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("Saturated task queue");
    expect(html).toContain("Where one stage caps the run");
    expect(html).toContain("bottlenecks-stage-throughput-chart");
    expect(html).toContain("/docs/concepts/bottlenecks");
    expect(html).toContain('data-testid="blog-related-docs"');
  });
});
