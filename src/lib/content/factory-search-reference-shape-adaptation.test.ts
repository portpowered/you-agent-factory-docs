/**
 * Story refs-w16-search-anchor-projection-002 proof: W04/W09 reference search
 * shapes adapt into live Orama SearchDocuments and join the locale
 * load/build path used by live search and static-export bootstrap.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import type { DocsPageSource } from "@/lib/content/pages";
import type { RegistryIndexes } from "@/lib/content/registry";
import { REFERENCE_FAMILY_PAGE_PATHS } from "@/lib/references/reference-search-projection";
import {
  adaptReferenceSearchShapeToSearchDocument,
  buildReferenceItemSearchDocuments,
  buildSearchDocumentsForLocale,
  loadEventCorpusReferenceSearchShapes,
  REFERENCE_SEARCH_DOCUMENT_KIND,
  resetReferenceItemSearchDocumentsCacheForTests,
  toAdvancedSearchIndexes,
} from "@/lib/search";
import { querySearchDocuments } from "@/lib/search/orama-index";

function emptyIndexes(): RegistryIndexes {
  return {
    byId: new Map(),
    bySlug: new Map(),
    classificationsById: new Map(),
    tagsById: new Map(),
    tagsBySlug: new Map(),
  };
}

function syntheticGuidePage(): DocsPageSource {
  return {
    pageDir: "/tmp/guides/getting-started",
    docsSlug: "guides/getting-started",
    url: "/docs/guides/getting-started",
    frontmatter: {
      kind: "guide",
      registryId: "guide.getting-started",
      messageNamespace: "local",
      assetNamespace: "local",
      tags: ["guides"],
      status: "published",
      updatedAt: "2026-06-20T00:00:00.000Z",
    },
    messages: {
      title: "Getting started",
      description: "Install and run",
    },
  };
}

describe("factory search reference shape adaptation (W16-002)", () => {
  test("adapts settled event corpus shapes into Orama documents with registry anchors", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const { shapes, corpus } = loadEventCorpusReferenceSearchShapes();
    expect(shapes.length).toBeGreaterThan(0);
    expect(shapes.length).toBe(corpus.documents.length);
    expect(corpus.registered.length).toBe(shapes.length);

    const documents = buildReferenceItemSearchDocuments({ shapes });
    expect(documents.length).toBe(shapes.length);

    for (const document of documents) {
      expect(document.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(
        document.url.startsWith(`${REFERENCE_FAMILY_PAGE_PATHS.events}#`),
      ).toBe(true);
      expect(document.url.includes("#")).toBe(true);
      expect(document.facets.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(document.tags).toContain("events");
    }

    const registeredAnchors = new Set(
      corpus.registered.map((entry) => entry.anchor),
    );
    for (const shape of shapes) {
      expect(registeredAnchors.has(shape.anchor)).toBe(true);
      const adapted = adaptReferenceSearchShapeToSearchDocument(shape);
      expect(adapted.url).toBe(
        `${REFERENCE_FAMILY_PAGE_PATHS.events}#${shape.anchor}`,
      );
    }
  });

  test("locale search document build includes adapted reference items for each shipped locale path", () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const referenceItemDocuments = buildReferenceItemSearchDocuments({
      fresh: true,
    });
    expect(referenceItemDocuments.length).toBeGreaterThan(0);

    const representative = referenceItemDocuments[0];
    if (representative === undefined) {
      throw new Error("expected at least one adapted reference item document");
    }

    for (const locale of ["en", "ja", "zh-CN", "vi"] as const) {
      const documents = buildSearchDocumentsForLocale(
        locale,
        emptyIndexes(),
        [syntheticGuidePage()],
        [],
        { referenceItemDocuments },
      );

      expect(
        documents.some((doc) => doc.url === "/docs/guides/getting-started"),
      ).toBe(true);

      const itemHit = documents.find((doc) => doc.id === representative.id);
      expect(itemHit).toBeDefined();
      expect(itemHit?.kind).toBe(REFERENCE_SEARCH_DOCUMENT_KIND);
      expect(itemHit?.url).toBe(representative.url);
      expect(itemHit?.url.includes("#")).toBe(true);
    }

    const advanced = toAdvancedSearchIndexes(referenceItemDocuments);
    expect(advanced.some((entry) => entry.url === representative.url)).toBe(
      true,
    );
  });

  test("representative event identity is findable in the adapted Orama document set", async () => {
    resetReferenceItemSearchDocumentsCacheForTests();
    const documents = buildReferenceItemSearchDocuments({ fresh: true });
    const withAlias = documents.find((document) => document.aliases.length > 0);
    if (withAlias === undefined) {
      throw new Error("expected an event item with aliases");
    }

    const hits = await querySearchDocuments(documents, withAlias.title);
    expect(hits.some((hit) => hit.url === withAlias.url)).toBe(true);
    expect(hits.some((hit) => hit.url.includes("#"))).toBe(true);
  });
});
