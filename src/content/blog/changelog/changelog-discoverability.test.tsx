/**
 * Discoverability proof for /blog/changelog (story 005).
 * Empty tags: discovery is blog index + prose/title search (no tag landings).
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { generateMetadata as generateBlogPostMetadata } from "@/app/(site)/blog/[slug]/page";
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
import enMessages from "./messages/en.json";

const BLOG_SLUG = "changelog";
const BLOG_ROUTE = `/blog/${BLOG_SLUG}`;
const BLOG_TITLE = "you-agent-factory releases and changelog";
const BLOG_DESCRIPTION =
  "A docs-site hub for recent you-agent-factory product releases, with version and date metadata and a link to the full GitHub Releases archive.";
const GITHUB_RELEASES_URL =
  "https://github.com/portpowered/you-agent-factory/releases";

const DISCOVERY_QUERIES = [
  "changelog",
  "releases",
  "you-agent-factory v0.0.5",
] as const;

describe("changelog blog discoverability (005)", () => {
  test("default-locale messages are complete and factory-focused", () => {
    expect(enMessages.title).toBe(BLOG_TITLE);
    expect(enMessages.description).toBe(BLOG_DESCRIPTION);
    expect(enMessages.contextSentence).toContain("you-agent-factory");
    expect(enMessages.takeaway).toContain("GitHub Releases");
    expect(enMessages.title).not.toMatch(/Model Atlas|benchmark/i);
    expect(enMessages.description).not.toMatch(/Model Atlas|benchmark/i);
  });

  test("blog index lists the hub with title, description, and published date", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain(BLOG_DESCRIPTION);
    expect(html).toContain('dateTime="2026-07-10"');
    expect(html).toContain("July 10, 2026");
    expect(html).toContain(`href="${BLOG_ROUTE}"`);
    expect(html).toContain(`aria-label="Read blog post: ${BLOG_TITLE}"`);
  });

  test("post metadata is factory-focused with canonical and open graph", async () => {
    const metadata = await generateBlogPostMetadata({
      params: Promise.resolve({ slug: BLOG_SLUG }),
    });

    expect(metadata.title).toBe(BLOG_TITLE);
    expect(metadata.description).toBe(BLOG_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe(BLOG_ROUTE);
    expect(metadata.openGraph).toMatchObject({
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
    });
    expect(String(metadata.title)).not.toMatch(/Model Atlas|benchmark/i);
    expect(String(metadata.description)).not.toMatch(/Model Atlas|benchmark/i);
  });

  test("search indexes the production hub with title, description, and release prose", async () => {
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
        "Quick reach",
        "Full release archive",
        "Recent releases",
        "Freshness ownership",
      ]),
    );
    expect(document?.bodyText).toContain("you-agent-factory v0.0.5");
    expect(document?.bodyText).toContain("GitHub Releases");
    expect(document?.bodyText).not.toContain("BlogRelatedDocs");
  });

  test.each(DISCOVERY_QUERIES.map((query) => [query] as const))(
    "search surfaces the hub for %s",
    async (query) => {
      const results = await docsSearchApi.search(query);
      expect(results.some((result) => result.url === BLOG_ROUTE)).toBe(true);
    },
    { timeout: 20_000 },
  );

  test("hub still renders release content, quick-reach, and ownership", async () => {
    const page = await renderBlogPostPage(BLOG_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BLOG_TITLE);
    expect(html).toContain("you-agent-factory v0.0.5");
    expect(html).toContain(`href="${GITHUB_RELEASES_URL}"`);
    expect(html).toContain('href="/docs/documentation/install"');
    expect(html).toContain('href="/docs/documentation/cli"');
    expect(html).toContain('href="/docs/references/cli"');
    expect(html).toContain("Freshness ownership");
    expect(html).toContain("Site docs maintainers");
  });
});
