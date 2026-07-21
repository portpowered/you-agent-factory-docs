/**
 * Discoverability proof for /blog/useful-factory-links (story 003).
 * Empty tags: discovery is index + prose/title search (no tag landings).
 * Locale contract: English-only messages → no localized blog params for missing locales.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { hasBlogPostMessagesForLocale } from "@/lib/content/blog-post-list";
import { BLOG_ROOT } from "@/lib/content/content-paths";
import { loadRegistry } from "@/lib/content/registry";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import {
  BLOG_SEARCH_DOCUMENT_KIND,
  buildBlogSearchDocuments,
  loadBlogSearchPostSources,
} from "@/lib/search/build-blog-search-document";
import { docsSearchApi } from "@/lib/search/search-server";
import enMessages from "./messages/en.json";

const BLOG_SLUG = "useful-factory-links";
const BLOG_ROUTE = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "Useful factory links for you-agent-factory";
const BLOG_DESCRIPTION =
  "A curated list of factory-focused destinations—CLI and repository entry points, supported runtimes, workflow techniques, MCP and dynamic workflows, and short ecosystem reading—for you-agent-factory users.";

const DISCOVERY_QUERIES = [
  "useful factory links",
  "you-agent-factory MCP",
  "harness workflow techniques",
  "CLI and repository",
] as const;

const NON_DEFAULT_LOCALES = supportedLocales.filter(
  (locale) => locale !== "en",
);

describe("useful-factory-links blog discoverability (003)", () => {
  test("default-locale messages are complete for the published English bundle", () => {
    expect(enMessages).toMatchObject({
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      contextSentence: expect.stringContaining("you-agent-factory"),
      takeaway: expect.stringContaining("shortlist"),
    });
    expect(existsSync(join(BLOG_ROOT, BLOG_SLUG, "messages", "en.json"))).toBe(
      true,
    );
  });

  test("locale contract ships English only (no localized params without messages)", () => {
    expect(hasBlogPostMessagesForLocale(BLOG_SLUG, "en")).toBe(true);

    for (const locale of NON_DEFAULT_LOCALES) {
      expect(hasBlogPostMessagesForLocale(BLOG_SLUG, locale)).toBe(false);
      expect(
        existsSync(join(BLOG_ROOT, BLOG_SLUG, "messages", `${locale}.json`)),
      ).toBe(false);
    }
  });

  test("blog index lists the post with title, description, and published date", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html).toContain('dateTime="2026-07-10"');
    expect(html).toContain("July 10, 2026");
    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain(`aria-label="Read blog post: ${BLOG_TITLE}"`);
  });

  test("blog index orders the post ahead of older factory posts by published date", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);
    const usefulPosition = html.indexOf(`href="${BLOG_ROUTE}"`);
    const bottlenecksPosition = html.indexOf('href="/blog/bottlenecks"');
    const comparingPosition = html.indexOf(
      'href="/blog/comparing-agent-factories"',
    );

    expect(usefulPosition).toBeGreaterThanOrEqual(0);
    expect(bottlenecksPosition).toBeGreaterThanOrEqual(0);
    expect(comparingPosition).toBeGreaterThanOrEqual(0);
    expect(usefulPosition).toBeLessThan(bottlenecksPosition);
    expect(usefulPosition).toBeLessThan(comparingPosition);
  });

  test("search indexes the production post with title, description, and curated prose", async () => {
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
      publishedAt: "2026-07-10",
      tags: [],
    });
    expect(document?.headings).toEqual(
      expect.arrayContaining([
        "CLI and repository",
        "Harnesses",
        "Workflow techniques",
        "MCP and dynamic workflows",
        "Relevant ecosystem reading",
      ]),
    );
    expect(document?.bodyText).toContain("you-agent-factory");
    expect(document?.bodyText).toContain("MCP");
    expect(document?.bodyText).toContain("Gas Town");
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

  test("published post still renders curated sections and related docs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("CLI and repository");
    expect(html).toContain("Harnesses");
    expect(html).toContain("Workflow techniques");
    expect(html).toContain("MCP and dynamic workflows");
    expect(html).toContain("Relevant ecosystem reading");
    expect(html).toContain('href="/docs/documentation/cli"');
    expect(html).toContain('href="/docs/documentation/mcp"');
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
  });

  test("post title is a relative self-link for Pages representative nav hrefs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(BLOG_TITLE);
  });
});
