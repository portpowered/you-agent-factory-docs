/**
 * Discoverability + locale proof for /blog/cursor-composer-six-billion-tokens
 * (story 004). Covers blog index listing, search queries, foundations tag
 * landing, and fail-closed English-only message shipping.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { generateStaticParams as generateLocalizedBlogPostStaticParams } from "@/app/[locale]/blog/[slug]/page";
import { hasBlogPostMessagesForLocale } from "@/lib/content/blog-post-list";
import { BLOG_ROOT } from "@/lib/content/content-paths";
import { loadRegistry } from "@/lib/content/registry";
import { loadTagResourceGroups } from "@/lib/content/tag-resources";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  BLOG_SEARCH_DOCUMENT_KIND,
  buildBlogSearchDocuments,
  loadBlogSearchPostSources,
} from "@/lib/search/build-blog-search-document";
import { docsSearchApi } from "@/lib/search/search-server";

const BLOG_SLUG = "cursor-composer-six-billion-tokens";
const BLOG_ROUTE = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE =
  "Cursor Composer after six billion tokens: factory-ops lessons";
const BLOG_DESCRIPTION =
  "An examination of Cursor Composer after large token spend through long-running you-agent-factory workflows—harnesses, bottlenecks, compaction, and operational lessons for sustained agent work.";

const DISCOVERY_QUERIES = [
  "Cursor Composer after six billion tokens",
  "factory-ops lessons",
  "Composer-scale token use",
  "long-running agent-factory workflows",
] as const;

describe("cursor-composer-six-billion-tokens blog discoverability (004)", () => {
  test("blog index lists the post with title, description, published date, and tags", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html).toContain('dateTime="2026-07-11"');
    expect(html).toContain("July 11, 2026");
    expect(html).toContain("Foundations");
    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain(`aria-label="Read blog post: ${BLOG_TITLE}"`);
  });

  test("blog index orders the post ahead of older published factory posts", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    const composerPos = html.indexOf(`href="${BLOG_ROUTE}"`);
    const bottlenecksPos = html.indexOf('href="/blog/bottlenecks"');
    const comparingPos = html.indexOf('href="/blog/comparing-agent-factories"');

    expect(composerPos).toBeGreaterThanOrEqual(0);
    expect(bottlenecksPos).toBeGreaterThanOrEqual(0);
    expect(comparingPos).toBeGreaterThanOrEqual(0);
    expect(composerPos).toBeLessThan(bottlenecksPos);
    expect(composerPos).toBeLessThan(comparingPos);
  });

  test("search indexes the production post with title, description, and examination prose", async () => {
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
      publishedAt: "2026-07-11",
      tags: ["foundations"],
    });
    expect(document?.headings).toEqual(
      expect.arrayContaining([
        "Why this examination exists",
        "Harness behavior under sustained turns",
        "Bottlenecks and scarce stages",
        "Compaction and token pressure",
        "Operational lessons for many agents over time",
      ]),
    );
    expect(document?.bodyText).toContain("you-agent-factory");
    expect(document?.bodyText).toContain("Composer-scale");
    expect(document?.bodyText).toContain("compaction");
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

  test("default-locale post still renders narrative and related docs", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html.match(/<h1\b/g)?.length).toBe(1);
    expect(html).toContain("Why this examination exists");
    expect(html).toContain("Foundations");
    expect(html).toContain('aria-label="Tags"');
    expect(html).not.toContain('data-testid="tag-pill-list"');
    expect(html).not.toContain(">Tags</h2>");
    expect(html).not.toContain('data-testid="blog-related-docs"');
    expect(html).not.toContain("Related reference pages");
    expect(html).toContain("/docs/concepts/harness");
    expect(html).toContain("/docs/concepts/bottlenecks");
    expect(html).toContain("/docs/concepts/compaction");
    // In-prose harness-support link remains in the article body.
    expect(html).toContain("/docs/documentation/harness-support");
  });
});
