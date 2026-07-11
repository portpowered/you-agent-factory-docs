/**
 * Discoverability proof for /blog/lies-damned-lies-evals (story 004).
 * Empty tags: discovery is index + prose/title search (no tag landings).
 * Locale: complete en only; fail-closed absence of incomplete non-en stubs.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
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

const BLOG_SLUG = "lies-damned-lies-evals";
const BLOG_ROUTE = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "Lies, damned lies, and evals";
const BLOG_DESCRIPTION =
  "Why you-agent-factory operators should judge workflow health from operational evidence—throughput, failures, queue and harness pressure—rather than model benchmark leaderboards alone.";

const DISCOVERY_QUERIES = [
  "lies damned lies evals",
  "operational evidence",
  "model benchmark leaderboards",
  "queue or harness saturation",
] as const;

describe("lies-damned-lies-evals blog discoverability (004)", () => {
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

  test("blog index orders the post ahead of older 2026-07-09 posts", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);
    const evalsPosition = html.indexOf(`href="${BLOG_ROUTE}"`);
    const bottlenecksPosition = html.indexOf('href="/blog/bottlenecks"');
    const comparingPosition = html.indexOf(
      'href="/blog/comparing-agent-factories"',
    );

    expect(evalsPosition).toBeGreaterThanOrEqual(0);
    expect(bottlenecksPosition).toBeGreaterThanOrEqual(0);
    expect(comparingPosition).toBeGreaterThanOrEqual(0);
    expect(evalsPosition).toBeLessThan(bottlenecksPosition);
    expect(evalsPosition).toBeLessThan(comparingPosition);
  });

  test("search indexes the production post with title, description, and ops prose", async () => {
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
        "The wrong scoreboard",
        "Completions and failures over time",
        "Queue or harness saturation",
        "Token or context pressure",
        "What to do instead",
      ]),
    );
    expect(document?.bodyText).toContain("you-agent-factory");
    expect(document?.bodyText).toContain("operational evidence");
    expect(document?.bodyText).toContain("Model benchmark leaderboards");
    expect(document?.bodyText).not.toContain("BlogRelatedDocs");
    expect(document?.bodyText).not.toContain("T k=");
  });

  test.each(DISCOVERY_QUERIES.map((query) => [query] as const))(
    "search surfaces the post for %s",
    async (query) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === BLOG_ROUTE)).toBe(true);
    },
    { timeout: 20_000 },
  );

  test("ships complete en messages only; non-en locales stay fail-closed", () => {
    const messagesDir = join(BLOG_ROOT, BLOG_SLUG, "messages");
    const messageFiles = readdirSync(messagesDir).sort();

    expect(messageFiles).toEqual(["en.json"]);
    expect(hasBlogPostMessagesForLocale(BLOG_SLUG, "en")).toBe(true);

    for (const locale of supportedLocales) {
      if (locale === "en") {
        continue;
      }
      expect(hasBlogPostMessagesForLocale(BLOG_SLUG, locale)).toBe(false);
    }
  });

  test("published post still renders narrative and related-docs links", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("The wrong scoreboard");
    expect(html).toContain("Useful evaluation of agent-factory workflows");
    expect(html).toContain('href="/docs/documentation/metrics"');
    expect(html).toContain('data-testid="blog-related-docs"');
    expect(html).toContain(
      'href="/docs/concepts/statistical-process-control-graphs"',
    );
    expect(html).toContain('href="/docs/concepts/bottlenecks"');
  });

  test("post title is a relative self-link for Pages representative nav hrefs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(BLOG_TITLE);
  });
});
