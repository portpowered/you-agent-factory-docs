/**
 * Discoverability + locale proof for /blog/comparing-orchestrators (story 004).
 * Empty tags: discovery is index + prose/title search (no tag landings).
 * Locale contract: English-only messages → no localized blog params.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { generateStaticParams as generateLocalizedBlogPostStaticParams } from "@/app/[locale]/(with-docs-chrome)/blog/[slug]/page";
import { hasBlogPostMessagesForLocale } from "@/lib/content/blog-post-list";
import { BLOG_ROOT } from "@/lib/content/content-paths";
import { loadRegistry } from "@/lib/content/registry";
import {
  BLOG_SEARCH_DOCUMENT_KIND,
  buildBlogSearchDocuments,
  loadBlogSearchPostSources,
} from "@/lib/search/build-blog-search-document";
import { docsSearchApi } from "@/lib/search/search-server";

const BLOG_SLUG = "comparing-orchestrators";
const BLOG_ROUTE = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "Comparing orchestrators by feature attributes";
const BLOG_DESCRIPTION =
  "Explore orchestrator tradeoffs across open source, license, hosting, and capabilities—feature-attribute comparison, not a benchmark leaderboard.";

const DISCOVERY_QUERIES = [
  "comparing orchestrators",
  "orchestrator feature attributes",
  "feature matrix open source",
  "hosting capabilities registry",
] as const;

describe("comparing-orchestrators blog discoverability (004)", () => {
  test("blog index lists the post with title, description, and published date", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html).toContain('dateTime="2026-07-21"');
    expect(html).toContain("July 21, 2026");
    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain(`aria-label="Read blog post: ${BLOG_TITLE}"`);
  });

  test("blog index orders the post ahead of older published factory posts", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    const comparingOrchPos = html.indexOf(`href="${BLOG_ROUTE}"`);
    const usefulPos = html.indexOf('href="/blog/useful-factory-links"');
    const agentFactoriesPos = html.indexOf(
      'href="/blog/comparing-agent-factories"',
    );

    expect(comparingOrchPos).toBeGreaterThanOrEqual(0);
    expect(usefulPos).toBeGreaterThanOrEqual(0);
    expect(agentFactoriesPos).toBeGreaterThanOrEqual(0);
    expect(comparingOrchPos).toBeLessThan(usefulPos);
    expect(comparingOrchPos).toBeLessThan(agentFactoriesPos);
  });

  test("search indexes the production post with title, description, and matrix prose", async () => {
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
      publishedAt: "2026-07-21",
      tags: [],
    });
    expect(document?.headings).toEqual(
      expect.arrayContaining([
        "What an orchestrator is",
        "How to read the feature matrix",
        "Feature matrix",
        "Reading notes",
      ]),
    );
    expect(document?.bodyText).toContain("feature attributes");
    expect(document?.bodyText).toContain("you-agent-factory");
    expect(document?.bodyText).toContain("worktrees");
    expect(document?.bodyText).toContain("planner–executor");
    expect(document?.bodyText).not.toContain("ComparingOrchestratorsMatrix");
    expect(document?.bodyText).not.toContain("BlogRelatedDocs");
    expect(document?.bodyText).not.toContain("Model Atlas");
  });

  test.each(DISCOVERY_QUERIES.map((query) => [query] as const))(
    "search surfaces the post for %s",
    async (query) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === BLOG_ROUTE)).toBe(true);
    },
    { timeout: 20_000 },
  );

  test("ships English messages only and omits locale-prefixed static routes", () => {
    const messageFiles = readdirSync(
      join(BLOG_ROOT, BLOG_SLUG, "messages"),
    ).sort();

    expect(messageFiles).toEqual(["en.json"]);
    expect(hasBlogPostMessagesForLocale(BLOG_SLUG, "en")).toBe(true);
    expect(hasBlogPostMessagesForLocale(BLOG_SLUG, "ja")).toBe(false);
    expect(hasBlogPostMessagesForLocale(BLOG_SLUG, "zh-CN")).toBe(false);
    expect(hasBlogPostMessagesForLocale(BLOG_SLUG, "vi")).toBe(false);

    const localizedParams = generateLocalizedBlogPostStaticParams().filter(
      (param) => param.slug === BLOG_SLUG,
    );
    expect(localizedParams).toEqual([]);
  });

  test("published post renders Intro, matrix, notes, and next-post control", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html.match(/<h1\b/g)?.length).toBe(1);
    expect(html).not.toContain(">Summary</");
    expect(html).toContain("What an orchestrator is");
    expect(html).toContain("How to read the feature matrix");
    expect(html).toContain('data-testid="comparing-orchestrators-matrix"');
    expect(html).toContain("data-orchestrator-feature-matrix");
    expect(html).toContain("Attribute filters");
    expect(html).toContain('data-testid="teaching-list"');
    expect(html).toContain("/docs/documentation/what-is-you-agent-factory");
    expect(html).toContain("/docs/concepts/harness");
    expect(html).toContain("/docs/techniques/planner-executor");
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
    // Newest published post — next-post points at the prior newest card.
    expect(html).toContain('data-testid="blog-next-post"');
  });

  test("post title is a relative self-link for Pages representative nav hrefs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(BLOG_TITLE);
  });
});
