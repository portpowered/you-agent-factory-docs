/**
 * Story 005: remaining blog lists, related links, and registries must not
 * advertise deleted Atlas blog slugs or Atlas-only tags as live destinations.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBlogPostPage,
} from "@/app/(site)/site-renderers";
import { loadRegistry } from "@/lib/content/registry";
import { resolveRelatedRegistryDocs } from "@/lib/content/related-registry-docs";

const DELETED_BLOG_SLUGS = [
  "evolution-of-diffusion",
  "llms-no-longer-wholly-reliant-on-the-internet",
  "roofline-throughput-explorer",
] as const;

const DELETED_ATLAS_TAG_SLUGS = [
  "model-family",
  "inference",
  "alignment",
] as const;

const DELETED_ATLAS_TAG_IDS = DELETED_ATLAS_TAG_SLUGS.map(
  (slug) => `tag.${slug}`,
);

function assertNoDeletedBlogOrTagHrefs(html: string) {
  for (const slug of DELETED_BLOG_SLUGS) {
    expect(html).not.toContain(`href="/blog/${slug}"`);
  }
  for (const slug of DELETED_ATLAS_TAG_SLUGS) {
    expect(html).not.toContain(`href="/tags/${slug}"`);
  }
}

describe("purge legacy related links and registries (005)", () => {
  test("blog index lists only remaining factory posts without deleted destinations", async () => {
    const html = renderToStaticMarkup(await renderBlogIndexPage());

    expect(html).toContain('href="/blog/bottlenecks"');
    expect(html).toContain('href="/blog/comparing-agent-factories"');
    expect(html).toContain('href="/blog/lies-damned-lies-evals"');
    assertNoDeletedBlogOrTagHrefs(html);
  });

  test("remaining blog posts do not advertise deleted blog or Atlas-only tag destinations", async () => {
    for (const slug of [
      "bottlenecks",
      "comparing-agent-factories",
      "lies-damned-lies-evals",
    ] as const) {
      const html = renderToStaticMarkup(await renderBlogPostPage(slug));
      assertNoDeletedBlogOrTagHrefs(html);
      expect(html).toContain('data-testid="blog-related-docs"');
    }
  });

  test("resolveRelatedRegistryDocs marks deleted Atlas tag ids as missing, not available", () => {
    const result = resolveRelatedRegistryDocs([
      "concept.bottlenecks",
      ...DELETED_ATLAS_TAG_IDS,
      "concept.harness",
    ]);

    expect(result.available.map((item) => item.registryId)).toEqual([
      "concept.bottlenecks",
      "concept.harness",
    ]);
    expect(result.available.map((item) => item.href)).toEqual([
      "/docs/concepts/bottlenecks",
      "/docs/concepts/harness",
    ]);
    expect(result.unavailable).toEqual(
      DELETED_ATLAS_TAG_IDS.map((registryId) => ({
        registryId,
        reason: "missing" as const,
      })),
    );
  });

  test("published registry relatedIds do not point at deleted Atlas tags or blogs", async () => {
    const indexes = await loadRegistry();
    const deletedIdSet = new Set<string>([
      ...DELETED_ATLAS_TAG_IDS,
      ...DELETED_BLOG_SLUGS.map((slug) => `blog.${slug}`),
    ]);

    for (const record of indexes.byId.values()) {
      for (const relatedId of record.relatedIds) {
        expect(deletedIdSet.has(relatedId)).toBe(false);
      }
      for (const tag of record.tags) {
        expect(
          DELETED_ATLAS_TAG_SLUGS.includes(
            tag as (typeof DELETED_ATLAS_TAG_SLUGS)[number],
          ),
        ).toBe(false);
      }
    }
  });
});
