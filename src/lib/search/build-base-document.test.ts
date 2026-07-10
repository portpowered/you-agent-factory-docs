import { describe, expect, test } from "bun:test";
import type { DocsPageSource } from "@/lib/content/pages";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry, type RegistryIndexes } from "@/lib/content/registry";
import type { ConceptRecord } from "@/lib/content/schemas";
import {
  buildBaseSearchDocument,
  buildBaseSearchDocuments,
} from "./build-base-document";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";

const SAMPLE_URL = "/docs/concepts/harness";

function buildRegistryIndexes(records: Array<ConceptRecord>): RegistryIndexes {
  return {
    byId: new Map(records.map((record) => [record.id, record])),
    bySlug: new Map(records.map((record) => [record.slug, record])),
    classificationsById: new Map(),
    tagsById: new Map(),
    tagsBySlug: new Map(),
  };
}

function buildSyntheticPage(registryId: string): DocsPageSource {
  return {
    pageDir: "/tmp/synthetic-concept",
    docsSlug: "concepts/synthetic-concept",
    url: "/docs/concepts/synthetic-concept",
    frontmatter: {
      kind: "concept",
      registryId,
      messageNamespace: "local",
      assetNamespace: "local",
      tags: [],
      status: "published",
      updatedAt: "2026-06-20T00:00:00.000Z",
    },
    messages: {
      title: "Synthetic Concept",
      description: "Synthetic concept description",
    },
  };
}

function buildSyntheticConcept(
  overrides: Partial<ConceptRecord> = {},
): ConceptRecord {
  return {
    id: "concept.synthetic-concept",
    slug: "synthetic-concept",
    kind: "concept",
    defaultTitleKey: "title",
    defaultSummaryKey: "description",
    aliases: [],
    tags: [],
    relatedIds: [],
    citationIds: [],
    status: "published",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    conceptType: "systems",
    prerequisiteIds: [],
    explainsIds: [],
    primaryClassificationId: "classification.concept.architecture",
    relationships: [
      {
        relationshipType: "related",
        targetId: "concept.missing-neighbor",
      },
    ],
    ...overrides,
  };
}

describe("buildBaseSearchDocument", () => {
  test("produces stable page fields from docs pages and registry records", async () => {
    const registry = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const page = pages.find((entry) => entry.url === SAMPLE_URL);
    expect(page).toBeDefined();
    if (!page) {
      throw new Error(`Missing sample page at ${SAMPLE_URL}`);
    }

    const document = buildBaseSearchDocument(page, registry);

    expect(document.id).toBe(page.url);
    expect(document.registryId).toBe("concept.harness");
    expect(document.url).toBe(SAMPLE_URL);
    expect(document.kind).toBe("concept");
    expect(document.title).toBe("Harness");
    expect(document.description).toContain("agent runtime");
    expect(document.bodyText).toContain("harness");
    expect(document.headings.length).toBeGreaterThan(0);
    expect(document.directAliases).toEqual(
      expect.arrayContaining(["harness", "agent runtime"]),
    );
  });

  test("does not compute ontology, model, or module optimization facets", () => {
    const conceptRecord = buildSyntheticConcept();
    const indexes = buildRegistryIndexes([conceptRecord]);

    const conceptDocument = buildBaseSearchDocument(
      buildSyntheticPage(conceptRecord.id),
      indexes,
    );

    expect(conceptDocument.facets).toEqual({
      kind: "concept",
      tags: [],
    });
    expect(conceptDocument.topology).toEqual(EMPTY_SEARCH_DOCUMENT_TOPOLOGY);
    expect(conceptDocument.facets).not.toHaveProperty("moduleType");
    expect(conceptDocument.facets).not.toHaveProperty("optimizes");
    expect(conceptDocument.facets).not.toHaveProperty(
      "primaryClassificationId",
    );
    expect(conceptDocument.facets).not.toHaveProperty("legacyModuleFamily");
  });

  test("keeps pages without ontology fields searchable with empty topology and generic facets", () => {
    const record = buildSyntheticConcept({
      primaryClassificationId: undefined,
      secondaryClassificationIds: undefined,
      relationships: undefined,
    });
    const document = buildBaseSearchDocuments(
      [buildSyntheticPage(record.id)],
      buildRegistryIndexes([record]),
    )[0];

    expect(document?.topology).toEqual(EMPTY_SEARCH_DOCUMENT_TOPOLOGY);
    expect(document?.facets).toEqual({
      kind: "concept",
      tags: [],
    });
    expect(document?.title).toBe("Synthetic Concept");
    expect(document?.aliases).toEqual([]);
    expect(document?.relatedIds).toEqual([]);
  });
});
