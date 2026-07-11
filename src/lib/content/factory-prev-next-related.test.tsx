/**
 * Story converge-factory-search-navigation-006 proof: previous/next and
 * related links stay on published factory destinations (or clear empty /
 * unavailable fallbacks).
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { BlogRelatedDocs } from "@/features/blog/components/BlogRelatedDocs";
import { RelatedDocs } from "@/features/docs/components/RelatedDocs";
import {
  DEFAULT_RELATED_REGISTRY_DOCS_ALL_UNAVAILABLE_FALLBACK,
  DEFAULT_RELATED_REGISTRY_DOCS_EMPTY_FALLBACK,
  RelatedRegistryDocs,
} from "@/features/docs/components/RelatedRegistryDocs";
import {
  assertFactoryFooterNeighbors,
  assertFactoryNavDestinationUrl,
  assertFactoryNavDestinationUrls,
  assertFactoryRelatedLinkItems,
  collectDocsFooterPageItems,
  DELETED_ATLAS_RECORD_URLS,
  resolveFactoryDocsFooterNeighbors,
} from "@/lib/content/factory-prev-next-related";
import { resolveRelatedRegistryDocs } from "@/lib/content/related-registry-docs";
import {
  RELATED_REGISTRY_DOCS_MISSING_ID,
  relatedRegistryDocsBottlenecks,
  relatedRegistryDocsDraftConcept,
  relatedRegistryDocsHarness,
  relatedRegistryDocsResolveOptions,
} from "@/lib/content/related-registry-docs.test-fixtures";
import { source } from "@/lib/source";

const REPRESENTATIVE_FACTORY_PAGES = [
  {
    href: "/docs/guides/getting-started",
    previous: "/docs/guides/cursor-dynamic-workflows",
    next: "/docs/guides/using-you-agent-factory-for-loops",
  },
  {
    href: "/docs/concepts/harness",
    previous: "/docs/concepts/compaction",
    next: "/docs/concepts/loop",
  },
  {
    href: "/docs/techniques/ralph",
    previous: "/docs/techniques/planner-executor",
    next: "/docs/techniques/worker-adviser",
  },
  {
    href: "/docs/documentation/what-is-you-agent-factory",
    previous: "/docs/techniques/writer-reviewer",
    next: "/docs/documentation/harness-support",
  },
] as const;

const FUSION_RELATED_HREFS = [
  "/docs/concepts/harness",
  "/docs/guides/getting-started",
  "/docs/concepts/loop",
  "/docs/guides/write-review-loops",
] as const;

const DELETED_ATLAS_RELATED_IDS = [
  "module.grouped-query-attention",
  "tag.model-family",
  "blog.evolution-of-diffusion",
] as const;

describe("factory previous/next and related links", () => {
  test("factory nav destination asserts reject deleted Atlas URLs", () => {
    for (const url of DELETED_ATLAS_RECORD_URLS) {
      expect(() => assertFactoryNavDestinationUrl(url)).toThrow(
        /deleted Atlas inventory/,
      );
    }

    expect(() =>
      assertFactoryNavDestinationUrls(["/docs/concepts/harness"]),
    ).not.toThrow();
    expect(() =>
      assertFactoryRelatedLinkItems([
        { href: "/docs/concepts/harness" },
        { href: undefined },
      ]),
    ).not.toThrow();
    expect(() =>
      assertFactoryRelatedLinkItems([
        { href: "/docs/modules/grouped-query-attention" },
      ]),
    ).toThrow(/deleted Atlas inventory/);
    expect(() =>
      assertFactoryFooterNeighbors({
        previous: {
          name: "GQA",
          url: "/docs/modules/grouped-query-attention",
        },
      }),
    ).toThrow(/deleted Atlas inventory/);
  });

  test("previous/next footer neighbors stay on published factory docs pages", () => {
    const footerItems = collectDocsFooterPageItems(source.pageTree);
    expect(footerItems.length).toBeGreaterThan(0);
    assertFactoryNavDestinationUrls(footerItems.map((item) => item.url));

    for (const url of DELETED_ATLAS_RECORD_URLS) {
      expect(footerItems.some((item) => item.url === url)).toBe(false);
    }

    for (const page of REPRESENTATIVE_FACTORY_PAGES) {
      const neighbors = resolveFactoryDocsFooterNeighbors(
        source.pageTree,
        page.href,
      );

      expect(neighbors.previous?.url).toBe(page.previous);
      expect(neighbors.next?.url).toBe(page.next);
      assertFactoryFooterNeighbors(neighbors);

      for (const url of [neighbors.previous?.url, neighbors.next?.url]) {
        expect(url).toBeDefined();
        expect(url?.startsWith("/docs/")).toBe(true);
        expect(
          DELETED_ATLAS_RECORD_URLS.includes(
            url as (typeof DELETED_ATLAS_RECORD_URLS)[number],
          ),
        ).toBe(false);
      }
    }

    const first = footerItems[0];
    const last = footerItems[footerItems.length - 1];
    if (!first || !last) {
      throw new Error("Expected non-empty docs footer page list");
    }

    const firstNeighbors = resolveFactoryDocsFooterNeighbors(
      source.pageTree,
      first.url,
    );
    expect(firstNeighbors.previous).toBeUndefined();
    expect(firstNeighbors.next?.url).toBe(footerItems[1]?.url);

    const lastNeighbors = resolveFactoryDocsFooterNeighbors(
      source.pageTree,
      last.url,
    );
    expect(lastNeighbors.next).toBeUndefined();
    expect(lastNeighbors.previous?.url).toBe(
      footerItems[footerItems.length - 2]?.url,
    );
  });

  test("related-registry docs render only published factory destinations", () => {
    const resolved = resolveRelatedRegistryDocs([
      "concept.bottlenecks",
      "concept.harness",
      ...DELETED_ATLAS_RELATED_IDS,
    ]);

    expect(resolved.available.map((item) => item.href)).toEqual([
      "/docs/concepts/bottlenecks",
      "/docs/concepts/harness",
    ]);
    assertFactoryRelatedLinkItems(resolved.available);
    expect(resolved.unavailable.map((item) => item.registryId)).toEqual([
      ...DELETED_ATLAS_RELATED_IDS,
    ]);
    expect(
      resolved.unavailable.every((item) => item.reason === "missing"),
    ).toBe(true);

    const html = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[
          relatedRegistryDocsHarness.id,
          relatedRegistryDocsBottlenecks.id,
        ]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );
    expect(html).toContain('href="/docs/concepts/harness"');
    expect(html).toContain('href="/docs/concepts/bottlenecks"');
    for (const url of DELETED_ATLAS_RECORD_URLS) {
      expect(html).not.toContain(`href="${url}"`);
    }

    assertFactoryNavDestinationUrls([...FUSION_RELATED_HREFS]);
  });

  test("empty and unavailable related targets use clear factory fallbacks", () => {
    const emptyHtml = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );
    expect(emptyHtml).toContain('data-testid="related-registry-docs-empty"');
    expect(emptyHtml).toContain(DEFAULT_RELATED_REGISTRY_DOCS_EMPTY_FALLBACK);
    expect(emptyHtml).not.toContain("<a");

    const unavailableHtml = renderToStaticMarkup(
      <RelatedRegistryDocs
        registryIds={[
          RELATED_REGISTRY_DOCS_MISSING_ID,
          relatedRegistryDocsDraftConcept.id,
          ...DELETED_ATLAS_RELATED_IDS,
        ]}
        resolveOptions={relatedRegistryDocsResolveOptions}
      />,
    );
    expect(unavailableHtml).toContain(
      'data-testid="related-registry-docs-unavailable"',
    );
    expect(unavailableHtml).toContain(
      DEFAULT_RELATED_REGISTRY_DOCS_ALL_UNAVAILABLE_FALLBACK,
    );
    expect(unavailableHtml).not.toContain("<a");
    for (const url of DELETED_ATLAS_RECORD_URLS) {
      expect(unavailableHtml).not.toContain(`href="${url}"`);
    }

    const relatedDocsHtml = renderToStaticMarkup(
      <RelatedDocs registryId="concept.harness" />,
    );
    expect(relatedDocsHtml).toBe("");

    const blogHtml = renderToStaticMarkup(
      <BlogRelatedDocs relatedDocIds={["concept.bottlenecks"]} />,
    );
    expect(blogHtml).toContain('data-testid="blog-related-docs"');
    expect(blogHtml).toContain('href="/docs/concepts/bottlenecks"');
    for (const url of DELETED_ATLAS_RECORD_URLS) {
      expect(blogHtml).not.toContain(`href="${url}"`);
    }
  });
});
