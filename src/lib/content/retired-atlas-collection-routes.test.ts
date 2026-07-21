import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { generateStaticParams as generateLocalizedDocsStaticParams } from "@/app/[locale]/(with-docs-chrome)/docs/[[...slug]]/page";
import { generateStaticParams as generateDefaultDocsStaticParams } from "@/app/docs/[[...slug]]/page";
import { renderDocsSlugPage } from "@/app/docs/docs-slug-renderer";
import DocsNotFound from "@/app/docs/not-found";
import { resolveDocsCollectionInput } from "@/lib/docs/section-collection-index";
import { source } from "@/lib/source";

const RETIRED_ATLAS_COLLECTION_IDS = [
  "models",
  "modules",
  "papers",
  "training",
  "systems",
] as const;

function expectNotFound(error: unknown): void {
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toMatch(
    /notFound\(\)|NEXT_HTTP_ERROR_FALLBACK;404/,
  );
}

function slugPathBelongsToRetiredAtlas(slugPath: string): boolean {
  return RETIRED_ATLAS_COLLECTION_IDS.some(
    (id) => slugPath === id || slugPath.startsWith(`${id}/`),
  );
}

describe("retired Atlas collection index routes", () => {
  test("default docs static params omit retired Atlas collection indexes and pages", () => {
    const slugPaths = generateDefaultDocsStaticParams().map((entry) =>
      (entry.slug ?? []).join("/"),
    );

    for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
      expect(slugPaths).not.toContain(id);
    }
    expect(slugPaths.some(slugPathBelongsToRetiredAtlas)).toBe(false);
  });

  test("localized docs static params omit retired Atlas collection indexes and pages", async () => {
    const params = await generateLocalizedDocsStaticParams();
    const slugPaths = params.map((entry) => (entry.slug ?? []).join("/"));

    for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
      expect(slugPaths).not.toContain(id);
    }
    expect(slugPaths.some(slugPathBelongsToRetiredAtlas)).toBe(false);
  });

  test("Fumadocs source route inventory omits retired Atlas collection prefixes", () => {
    const slugPaths = source
      .generateParams()
      .map((entry) => entry.slug.join("/"));

    for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
      expect(source.getPage([id])).toBeUndefined();
      expect(slugPaths).not.toContain(id);
    }
    expect(slugPaths.some(slugPathBelongsToRetiredAtlas)).toBe(false);
  });

  test("retired Atlas collection index slugs resolve to not-found instead of indexes", async () => {
    for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
      try {
        await renderDocsSlugPage([id]);
        throw new Error(`Expected /docs/${id} to not-found`);
      } catch (error) {
        expectNotFound(error);
      }

      try {
        await renderDocsSlugPage([id], "ja");
        throw new Error(`Expected /ja/docs/${id} to not-found`);
      } catch (error) {
        expectNotFound(error);
      }

      try {
        resolveDocsCollectionInput(id);
        throw new Error(`Expected section index for ${id} to not-found`);
      } catch (error) {
        expectNotFound(error);
      }
    }
  });

  test("docs not-found page renders the normal not-found experience", () => {
    const html = renderToStaticMarkup(DocsNotFound());

    expect(html).toContain("Page not found");
    expect(html).toContain(
      "No documentation page matches this path. Continue from Getting Started, browse the factory collections, search the docs, or read the blog.",
    );
    expect(html).toContain("Getting Started");
    expect(html).toContain("Browse");
    expect(html).toContain("Search");
    expect(html).toContain("Blog");
    expect(html).toContain('href="/docs/guides/getting-started"');
    expect(html).toContain('href="/browse"');
    expect(html).toContain('href="/search"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain("focus-visible:ring-2");
    expect(html).not.toMatch(/Models|Modules|Papers|Training|Systems/i);
    expect(html).not.toMatch(/Model Atlas|coming soon|Browse the Atlas/i);
  });
});
