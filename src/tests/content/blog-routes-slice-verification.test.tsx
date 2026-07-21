/**
 * Consolidated review-facing slice proof for default English blog routes.
 * Loader-only invariants stay in `blog-post-list.test.ts` and
 * `blog-content-loader-scope.test.ts`; this file proves observable `/blog` and
 * `/blog/<slug>` route metadata, rendering, ordering, and missing-post behavior.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import {
  generateMetadata as generateBlogPostMetadata,
  generateStaticParams as generateBlogPostStaticParams,
} from "@/app/(site)/(with-docs-chrome)/blog/[slug]/page";
import { generateMetadata as generateBlogIndexMetadata } from "@/app/(site)/(with-docs-chrome)/blog/page";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { generateMetadata as generateLocalizedBlogIndexMetadata } from "@/app/[locale]/blog/page";
import { blogIndexHref, blogPostHref } from "@/lib/content/blog-page-load";

const BOTTLENECKS_SLUG = "bottlenecks";
const BOTTLENECKS_TITLE =
  "Factory bottlenecks: where long-running agent work actually stalls";
const BOTTLENECKS_DESCRIPTION =
  "A listicle comparison of common you-agent-factory limiting stages—queues, workers, harness latency, shared resources, and token pressure—and how to read them against the bottlenecks concept.";

function frontmatterBlock(input: {
  status: "published" | "draft";
  publishedAt: string;
}): string {
  return `---
messageNamespace: "local"
assetNamespace: "local"
publishedAt: "${input.publishedAt}"
updatedAt: "${input.publishedAt}"
authors:
  - "site-team"
tags:
  - inference
relatedDocIds:
  - concept.example-concept
status: "${input.status}"
---

## Fixture body

Fixture paragraph for blog route slice verification.
`;
}

function blogPostHrefPosition(html: string, slug: string): number {
  const position = html.indexOf(`href="/blog/${slug}"`);
  expect(position).toBeGreaterThanOrEqual(0);
  return position;
}

describe("blog routes slice verification (blog-routes-layout-index-004)", () => {
  let tempRoot: string | undefined;

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
      tempRoot = undefined;
    }
  });

  async function writeFixturePost(input: {
    slug: string;
    status: "published" | "draft";
    publishedAt: string;
    title: string;
  }) {
    if (!tempRoot) {
      tempRoot = await mkdtemp(join(tmpdir(), "blog-routes-slice-"));
    }

    const pageDir = join(tempRoot, input.slug);
    await mkdir(join(pageDir, "messages"), { recursive: true });
    await writeFile(
      join(pageDir, "page.mdx"),
      frontmatterBlock({
        status: input.status,
        publishedAt: input.publishedAt,
      }),
    );
    await writeFile(
      join(pageDir, "messages", "en.json"),
      JSON.stringify({
        title: input.title,
        description: `Description for ${input.title}.`,
        contextSentence: "Fixture context.",
        takeaway: "Fixture takeaway.",
      }),
    );
  }

  it("publishes canonical metadata for the English blog index route", async () => {
    const metadata = await generateBlogIndexMetadata();

    expect(metadata.title).toBe("Blog");
    expect(metadata.alternates?.canonical).toBe(blogIndexHref());
    // English-only policy: no false ja / zh-CN / vi language alternates.
    expect(metadata.alternates?.languages).toBeUndefined();
    expect(metadata.description?.length).toBeGreaterThan(0);
  });

  it("keeps locale-prefixed blog index on English-only alternates", async () => {
    const metadata = await generateLocalizedBlogIndexMetadata({
      params: Promise.resolve({ locale: "ja" }),
    });

    expect(metadata.alternates?.canonical).toBe(blogIndexHref());
    expect(metadata.alternates?.languages).toBeUndefined();
  });

  it("publishes canonical metadata for a published blog post route", async () => {
    const metadata = await generateBlogPostMetadata({
      params: Promise.resolve({ slug: BOTTLENECKS_SLUG }),
    });

    expect(metadata.title).toBe(BOTTLENECKS_TITLE);
    expect(metadata.description).toBe(BOTTLENECKS_DESCRIPTION);
    expect(metadata.alternates?.canonical).toBe(blogPostHref(BOTTLENECKS_SLUG));
    // English-only policy: posts stay canonical-only until blog locales ship.
    expect(metadata.alternates?.languages).toBeUndefined();
  });

  it("returns empty metadata for an unknown blog post slug", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "blog-routes-slice-unknown-"));

    const metadata = await generateBlogPostMetadata({
      params: Promise.resolve({ slug: "missing-post" }),
    });

    expect(metadata).toEqual({});
  });

  it("includes published blog slugs in static params and omits unpublished legacy Atlas slugs", () => {
    const params = generateBlogPostStaticParams();

    expect(params).toEqual(
      expect.arrayContaining([
        { slug: BOTTLENECKS_SLUG },
        { slug: "changelog" },
        { slug: "comparing-agent-factories" },
        { slug: "cursor-composer-six-billion-tokens" },
        { slug: "factories-building-factory-docs" },
        { slug: "lies-damned-lies-evals" },
        { slug: "useful-factory-links" },
      ]),
    );
    expect(params).not.toEqual(
      expect.arrayContaining([
        { slug: "evolution-of-diffusion" },
        { slug: "llms-no-longer-wholly-reliant-on-the-internet" },
        { slug: "roofline-throughput-explorer" },
      ]),
    );
  });

  it("renders /blog index content from post metadata", async () => {
    const page = await renderBlogIndexPage();
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BOTTLENECKS_TITLE);
    expect(html).toContain(BOTTLENECKS_DESCRIPTION);
    expect(html).toContain('dateTime="2026-07-09"');
    expect(html).toContain(`href="/blog/${BOTTLENECKS_SLUG}"`);
    expect(html).toContain(`aria-label="Read blog post: ${BOTTLENECKS_TITLE}"`);
    expect(html).not.toContain('href="/blog/roofline-throughput-explorer"');
  });

  it("renders /blog/<slug> body content for a published post", async () => {
    const page = await renderBlogPostPage(BOTTLENECKS_SLUG);
    const html = renderToStaticMarkup(page);

    expect(html).toContain(BOTTLENECKS_TITLE);
    expect(html).toContain(BOTTLENECKS_DESCRIPTION);
    expect(html).toContain(`data-blog-slug="${BOTTLENECKS_SLUG}"`);
    expect(html).toContain("Saturated task queue");
    expect(html).toContain("Where one stage caps the run");
    expect(html).toContain("bottlenecks-stage-throughput-chart");
  });

  it("renders fixture post body content through /blog/<slug>", async () => {
    await writeFixturePost({
      slug: "slice-fixture-post",
      status: "published",
      publishedAt: "2026-06-10",
      title: "Slice Fixture Post",
    });

    const page = await renderBlogPostPage("slice-fixture-post", "en", {
      blogRoot: tempRoot,
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Slice Fixture Post");
    expect(html).toContain(
      "Fixture paragraph for blog route slice verification.",
    );
  });

  it("orders /blog index cards newest-first with deterministic tie-breakers", async () => {
    await writeFixturePost({
      slug: "older-slice-post",
      status: "published",
      publishedAt: "2026-05-01",
      title: "Older Slice Post",
    });
    await writeFixturePost({
      slug: "newer-slice-post",
      status: "published",
      publishedAt: "2026-06-15",
      title: "Newer Slice Post",
    });

    const page = await renderBlogIndexPage("en", { blogRoot: tempRoot });
    const html = renderToStaticMarkup(page);

    expect(blogPostHrefPosition(html, "newer-slice-post")).toBeLessThan(
      blogPostHrefPosition(html, "older-slice-post"),
    );
  });

  it("returns missing-page behavior for an unknown /blog/<slug>", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "blog-routes-slice-missing-"));

    try {
      await renderBlogPostPage("missing-post", "en", { blogRoot: tempRoot });
      throw new Error("Expected unknown blog slug to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(
        /notFound\(\)|NEXT_HTTP_ERROR_FALLBACK;404/,
      );
    }
  });
});
