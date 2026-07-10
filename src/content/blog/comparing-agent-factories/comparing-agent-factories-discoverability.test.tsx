/**
 * Discoverability proof for /blog/comparing-agent-factories (story 004).
 * Empty tags: discovery is index + prose/title search (no tag landings).
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { loadRegistry } from "@/lib/content/registry";
import {
  BLOG_SEARCH_DOCUMENT_KIND,
  buildBlogSearchDocuments,
  loadBlogSearchPostSources,
} from "@/lib/search/build-blog-search-document";
import { docsSearchApi } from "@/lib/search/search-server";

const BLOG_SLUG = "comparing-agent-factories";
const BLOG_ROUTE = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "Comparing agent factories and orchestration systems";
const BLOG_DESCRIPTION =
  "A practical comparison of you-agent-factory with custom scripts, Gas Town, DBOS, Dagster, N8N, and Temporal for agent workflows and orchestration tradeoffs.";

const DISCOVERY_QUERIES = [
  "comparing agent factories",
  "you-agent-factory orchestration",
  "Gas Town DBOS Temporal",
  "file-first agent harness",
] as const;

describe("comparing-agent-factories blog discoverability (004)", () => {
  test("blog index lists the post with title, description, and published date", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html).toContain('dateTime="2026-07-09"');
    expect(html).toContain("July 9, 2026");
    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain(`aria-label="Read blog post: ${BLOG_TITLE}"`);
  });

  test("blog index orders the post after bottlenecks by slug tie-break when dates match", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);
    const comparePosition = html.indexOf(`href="${BLOG_ROUTE}"`);
    const bottlenecksPosition = html.indexOf('href="/blog/bottlenecks"');

    expect(comparePosition).toBeGreaterThanOrEqual(0);
    expect(bottlenecksPosition).toBeGreaterThanOrEqual(0);
    expect(bottlenecksPosition).toBeLessThan(comparePosition);
  });

  test("search indexes the production post with title, description, and comparison prose", async () => {
    const indexes = await loadRegistry();
    const posts = await loadBlogSearchPostSources();
    const document = buildBlogSearchDocuments(posts, indexes).find(
      (entry) => entry.url === BLOG_ROUTE,
    );

    expect(document).toMatchObject({
      id: BLOG_ROUTE,
      url: BLOG_ROUTE,
      kind: BLOG_SEARCH_DOCUMENT_KIND,
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      publishedAt: "2026-07-09",
      tags: [],
    });
    expect(document?.headings).toEqual(
      expect.arrayContaining([
        "Why a lightweight agent factory exists",
        "Comparison matrix",
        "you-agent-factory",
        "How to choose",
      ]),
    );
    expect(document?.bodyText).toContain("you-agent-factory");
    expect(document?.bodyText).toContain("Gas Town");
    expect(document?.bodyText).toContain("Temporal");
    expect(document?.bodyText).not.toContain("AgentFactoriesComparisonTable");
    expect(document?.bodyText).not.toContain("BlogRelatedDocs");
  });

  test.each(DISCOVERY_QUERIES.map((query) => [query] as const))(
    "search surfaces the post for %s",
    async (query) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === BLOG_ROUTE)).toBe(true);
    },
    { timeout: 20_000 },
  );

  test("published post still renders narrative, related docs, and factory-ui DataTable", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("Why a lightweight agent factory exists");
    expect(html).toContain("agent-factories-comparison-table");
    expect(html).toContain("you-agent-factory");
    expect(html).toContain("/docs/documentation/what-is-you-agent-factory");
    expect(html).toContain('data-testid="blog-related-docs"');
  });
});
