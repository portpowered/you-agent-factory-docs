/**
 * Story 006: public search inputs, tag indexes, and blog/search surfaces must
 * contain zero deleted Atlas blog or Atlas-only tag records.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderTagsIndexPage,
} from "@/app/(site)/site-renderers";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import { listTagRecords } from "@/lib/content/tag-registry-runtime";
import {
  loadPublishedTagIndexEntries,
  loadPublishedTagIndexGroups,
} from "@/lib/content/tags";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { loadBlogSearchPostSources } from "@/lib/search/build-blog-search-document";
import { buildSearchDocumentsForLocale } from "@/lib/search/build-documents";
import { loadSearchResultMetaMap } from "@/lib/search/search-result-meta";
import { docsSearchApi } from "@/lib/search/search-server";
import { toAdvancedSearchIndexes } from "@/lib/search/to-advanced-index";

const DELETED_BLOG_SLUGS = [
  "evolution-of-diffusion",
  "llms-no-longer-wholly-reliant-on-the-internet",
  "roofline-throughput-explorer",
] as const;

const DELETED_BLOG_URLS = DELETED_BLOG_SLUGS.map((slug) => `/blog/${slug}`);

const DELETED_ATLAS_TAG_SLUGS = [
  "model-family",
  "inference",
  "alignment",
] as const;

const DELETED_ATLAS_TAG_IDS = DELETED_ATLAS_TAG_SLUGS.map(
  (slug) => `tag.${slug}`,
);

const KEPT_BLOG_URLS = [
  "/blog/bottlenecks",
  "/blog/comparing-agent-factories",
] as const;

const KEPT_TAG_SLUGS = ["taxonomy", "foundations", "local-models"] as const;

function assertNoDeletedBlogUrls(urls: Iterable<string>) {
  const urlSet = new Set(urls);
  for (const url of DELETED_BLOG_URLS) {
    expect(urlSet.has(url)).toBe(false);
  }
}

function assertNoDeletedTagSlugs(slugs: Iterable<string>) {
  const slugSet = new Set(slugs);
  for (const slug of DELETED_ATLAS_TAG_SLUGS) {
    expect(slugSet.has(slug)).toBe(false);
  }
}

function assertNoDeletedBlogOrTagHrefs(html: string) {
  for (const slug of DELETED_BLOG_SLUGS) {
    expect(html).not.toContain(`/blog/${slug}`);
  }
  for (const slug of DELETED_ATLAS_TAG_SLUGS) {
    expect(html).not.toContain(`/tags/${slug}`);
  }
}

describe("purge legacy public indexes (006)", () => {
  test("search-source documents omit deleted blog URLs and Atlas-only tags", async () => {
    const indexes = await loadRegistry();
    const [pages, blogPosts] = await Promise.all([
      loadPublishedDocsPages("en"),
      loadBlogSearchPostSources({ locale: "en" }),
    ]);
    const documents = buildSearchDocumentsForLocale(
      "en",
      indexes,
      pages,
      blogPosts,
    );
    const urls = documents.map((document) => document.url);
    const advancedUrls = toAdvancedSearchIndexes(documents).map(
      (entry) => entry.url,
    );

    assertNoDeletedBlogUrls(urls);
    assertNoDeletedBlogUrls(advancedUrls);

    for (const kept of KEPT_BLOG_URLS) {
      expect(urls).toContain(kept);
    }

    for (const document of documents) {
      assertNoDeletedTagSlugs(document.tags);
      assertNoDeletedTagSlugs(document.facets.tags);
      for (const deletedSlug of DELETED_ATLAS_TAG_SLUGS) {
        expect(document.url).not.toBe(`/tags/${deletedSlug}`);
      }
    }
  });

  test("search result meta map and API catalog omit deleted blog and Atlas-only tag records", async () => {
    const metaMap = await loadSearchResultMetaMap("en");
    assertNoDeletedBlogUrls(metaMap.keys());

    for (const meta of metaMap.values()) {
      assertNoDeletedTagSlugs(meta.tags);
    }

    for (const kept of KEPT_BLOG_URLS) {
      expect(metaMap.has(kept)).toBe(true);
    }

    for (const query of [
      "evolution of diffusion",
      "roofline throughput explorer",
      "wholly reliant on the internet",
      "model-family",
    ] as const) {
      const results = await docsSearchApi.search(query);
      assertNoDeletedBlogUrls(results.map((result) => result.url));
      for (const result of results) {
        for (const slug of DELETED_ATLAS_TAG_SLUGS) {
          expect(result.url).not.toBe(`/tags/${slug}`);
        }
      }
    }
  });

  test("published tag registry and tag index omit Atlas-only tags while keeping factory tags", async () => {
    const messages = await loadUiMessages();
    const records = listTagRecords();
    const entries = await loadPublishedTagIndexEntries(messages, "en");
    const groups = await loadPublishedTagIndexGroups(messages, "en");

    assertNoDeletedTagSlugs(records.map((record) => record.slug));
    assertNoDeletedTagSlugs(entries.map((entry) => entry.slug));
    for (const id of DELETED_ATLAS_TAG_IDS) {
      expect(records.some((record) => record.id === id)).toBe(false);
    }

    for (const slug of KEPT_TAG_SLUGS) {
      expect(entries.some((entry) => entry.slug === slug)).toBe(true);
    }

    const groupedSlugs = groups.flatMap((group) =>
      group.tags.map((tag) => tag.slug),
    );
    assertNoDeletedTagSlugs(groupedSlugs);
  });

  test("blog index and tags index HTML omit deleted destinations", async () => {
    const blogHtml = renderToStaticMarkup(await renderBlogIndexPage());
    const tagsHtml = renderToStaticMarkup(await renderTagsIndexPage());

    assertNoDeletedBlogOrTagHrefs(blogHtml);
    assertNoDeletedBlogOrTagHrefs(tagsHtml);

    expect(blogHtml).toContain('href="/blog/bottlenecks"');
    expect(blogHtml).toContain('href="/blog/comparing-agent-factories"');
    expect(tagsHtml).toContain('href="/tags/foundations"');
    expect(tagsHtml).toContain('href="/tags/local-models"');
    expect(tagsHtml).toContain('href="/tags/taxonomy"');
  });
});
