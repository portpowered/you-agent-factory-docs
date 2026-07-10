import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry } from "@/lib/content/registry";
import {
  BLOG_SEARCH_DOCUMENT_KIND,
  buildBlogSearchDocuments,
  extractBlogMdxSearchText,
  loadBlogSearchPostSources,
} from "@/lib/search/build-blog-search-document";
import { buildSearchDocumentsForLocale } from "@/lib/search/build-documents";
import { docsSearchApi } from "@/lib/search/search-server";

function publishedFrontmatterBlock(
  overrides: Record<string, unknown> = {},
): string {
  const frontmatter = {
    messageNamespace: "local",
    assetNamespace: "local",
    publishedAt: "2026-06-02",
    updatedAt: "2026-06-02",
    authors: ["site-team"],
    tags: ["kv-cache"],
    relatedDocIds: ["concept.prefill"],
    status: "published",
    ...overrides,
  };

  const lines = ["---"];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${JSON.stringify(item)}`);
      }
      continue;
    }

    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  lines.push("---", "", "# Example Post", "");

  return lines.join("\n");
}

const validMessages = {
  title: "KV Cache Serving Notes",
  description: "How KV cache reuse shapes decode throughput.",
  contextSentence: "Decode steps reuse cached key-value tensors from prefill.",
  takeaway: "Serving throughput depends on how much KV state you retain.",
};

describe("buildBlogSearchDocuments", () => {
  let tempRoot: string | undefined;

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  async function writeFixturePost(input: {
    slug: string;
    frontmatter?: string;
    messages?: unknown;
    mdxBody?: string;
  }) {
    tempRoot = await mkdtemp(join(tmpdir(), "blog-search-documents-"));
    const pageDir = join(tempRoot, input.slug);
    await mkdir(join(pageDir, "messages"), { recursive: true });
    const frontmatter = input.frontmatter ?? publishedFrontmatterBlock();
    const mdxBody =
      input.mdxBody ??
      "\n## Memory bandwidth limits\n\nThroughput can plateau when weight reads dominate.\n";
    await writeFile(join(pageDir, "page.mdx"), `${frontmatter}${mdxBody}`);
    await writeFile(
      join(pageDir, "messages", "en.json"),
      JSON.stringify(input.messages ?? validMessages),
    );

    return { blogRoot: tempRoot, slug: input.slug };
  }

  test("indexes published blog posts with blog kind, route, metadata, tags, and published date", async () => {
    const { blogRoot } = await writeFixturePost({ slug: "kv-cache-notes" });
    const indexes = await loadRegistry();
    const posts = await loadBlogSearchPostSources({ blogRoot });

    const [document] = buildBlogSearchDocuments(posts, indexes);

    expect(document).toMatchObject({
      id: "/blog/kv-cache-notes",
      url: "/blog/kv-cache-notes",
      kind: BLOG_SEARCH_DOCUMENT_KIND,
      title: validMessages.title,
      description: validMessages.description,
      publishedAt: "2026-06-02",
      tags: ["kv-cache"],
      relatedIds: ["concept.prefill"],
    });
    expect(document.bodyText).toContain(validMessages.contextSentence);
    expect(document.bodyText).toContain("Memory bandwidth limits");
    expect(document.headings).toContain("Memory bandwidth limits");
    expect(document.aliases).toContain("kv-cache");
  });

  test("excludes draft posts from search post sources", async () => {
    const { blogRoot } = await writeFixturePost({
      slug: "draft-only",
      frontmatter: publishedFrontmatterBlock({ status: "draft" }),
    });

    const posts = await loadBlogSearchPostSources({ blogRoot });

    expect(posts).toEqual([]);
  });

  test("extractBlogMdxSearchText keeps markdown prose and headings while stripping components", () => {
    const mdxBody = `
import { T } from "@/features/docs/components/T";

# <T k="title" />

## Why throughput plateaus

Serving repeatedly reads weights from memory.

<RooflineThroughputExplorerFromRegistry />
`;

    const extracted = extractBlogMdxSearchText(mdxBody);

    expect(extracted.headings).toEqual(["Why throughput plateaus"]);
    expect(extracted.bodyText).toContain(
      "Serving repeatedly reads weights from memory.",
    );
    expect(extracted.bodyText).not.toContain("RooflineThroughputExplorer");
  });

  test("buildSearchDocumentsForLocale keeps canonical docs documents unchanged when blogs are added", async () => {
    const indexes = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const withoutBlogs = buildSearchDocumentsForLocale("en", indexes, pages);
    const { blogRoot } = await writeFixturePost({ slug: "fixture-post" });
    const blogPosts = await loadBlogSearchPostSources({ blogRoot });
    const withBlogs = buildSearchDocumentsForLocale(
      "en",
      indexes,
      pages,
      blogPosts,
    );

    expect(withBlogs.length).toBe(withoutBlogs.length + 1);
    expect(
      withBlogs.filter(
        (document) => document.kind !== BLOG_SEARCH_DOCUMENT_KIND,
      ),
    ).toEqual(withoutBlogs);
  });

  test(
    "search returns published blog posts for title, body phrase, and tag queries",
    async () => {
      const titleResults = await docsSearchApi.search("factory bottlenecks");
      expect(
        titleResults.some((result) => result.url === "/blog/bottlenecks"),
      ).toBe(true);

      const bodyResults = await docsSearchApi.search("saturated task queue");
      expect(
        bodyResults.some((result) => result.url === "/blog/bottlenecks"),
      ).toBe(true);

      const tagResults = await docsSearchApi.search("factory bottlenecks", {
        tag: ["foundations"],
      });
      expect(
        tagResults.some((result) => result.url === "/blog/bottlenecks"),
      ).toBe(true);

      const docsResults = await docsSearchApi.search("task queue");
      expect(
        docsResults.some((result) =>
          result.url.includes("/docs/concepts/task-queue"),
        ),
      ).toBe(true);
    },
    { timeout: 20_000 },
  );
});

const BOTTLENECKS_BLOG_URL = "/blog/bottlenecks";

const BOTTLENECKS_SEARCH_QUERIES = [
  "factory bottlenecks",
  "harness latency",
  "token pressure",
  "saturated task queue",
] as const;

describe("bottlenecks blog search discovery", () => {
  test("indexes the production post with title, description, headings, tags, and prose without MDX component names", async () => {
    const indexes = await loadRegistry();
    const posts = await loadBlogSearchPostSources();
    const document = buildBlogSearchDocuments(posts, indexes).find(
      (entry) => entry.url === BOTTLENECKS_BLOG_URL,
    );

    expect(document).toMatchObject({
      id: BOTTLENECKS_BLOG_URL,
      url: BOTTLENECKS_BLOG_URL,
      kind: BLOG_SEARCH_DOCUMENT_KIND,
      title:
        "Factory bottlenecks: where long-running agent work actually stalls",
      description:
        "A listicle comparison of common you-agent-factory limiting stages—queues, workers, harness latency, shared resources, and token pressure—and how to read them against the bottlenecks concept.",
      publishedAt: "2026-07-09",
      tags: ["foundations"],
    });
    expect(document?.headings).toEqual(
      expect.arrayContaining([
        "Saturated task queue",
        "Where one stage caps the run",
        "How to choose the next reading path",
      ]),
    );
    expect(document?.bodyText).toContain("Saturated task queue");
    expect(document?.bodyText).toContain("token or context pressure");
    expect(document?.bodyText).not.toContain("BottlenecksStageThroughputChart");
    expect(document?.bodyText).not.toContain("BlogRelatedDocs");
    expect(document?.aliases).toEqual(expect.arrayContaining(["foundations"]));
  });

  test(
    "search returns the post for representative bottlenecks queries",
    async () => {
      for (const query of BOTTLENECKS_SEARCH_QUERIES) {
        const results = await docsSearchApi.search(query);
        expect(
          results.some((result) => result.url === BOTTLENECKS_BLOG_URL),
          `expected ${BOTTLENECKS_BLOG_URL} for query "${query}"`,
        ).toBe(true);
      }
    },
    { timeout: 20_000 },
  );

  test(
    "tag-filtered search returns the post on the foundations tag page",
    async () => {
      const results = await docsSearchApi.search("bottlenecks", {
        tag: ["foundations"],
      });
      expect(
        results.some((result) => result.url === BOTTLENECKS_BLOG_URL),
      ).toBe(true);
    },
    { timeout: 20_000 },
  );

  test("search sources omit unpublished legacy Atlas blog URLs", async () => {
    const posts = await loadBlogSearchPostSources();
    const urls = posts.map((post) => `/blog/${post.slug}`);

    expect(urls).not.toContain("/blog/evolution-of-diffusion");
    expect(urls).not.toContain(
      "/blog/llms-no-longer-wholly-reliant-on-the-internet",
    );
    expect(urls).not.toContain("/blog/roofline-throughput-explorer");
  });
});
