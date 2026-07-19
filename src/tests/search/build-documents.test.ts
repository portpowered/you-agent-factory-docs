import { describe, expect, test } from "bun:test";
import type { DocsPageSource } from "@/lib/content/pages";
import { loadPublishedDocsPages } from "@/lib/content/pages";
import { loadRegistry, type RegistryIndexes } from "@/lib/content/registry";
import type {
  ClassificationRecord,
  ConceptRecord,
} from "@/lib/content/schemas";
import { buildSearchDocuments } from "@/lib/search/build-documents";
import {
  isDocumentationRouteMigrationOldBrowsePath,
  listDocumentationRouteMigrationOldRoutes,
} from "@/lib/seo/documentation-route-migration";

function buildRegistryIndexes(records: ConceptRecord[]): RegistryIndexes {
  return {
    byId: new Map(records.map((record) => [record.id, record])),
    bySlug: new Map(records.map((record) => [record.slug, record])),
    classificationsById: new Map(),
    tagsById: new Map(),
    tagsBySlug: new Map(),
  };
}

function buildClassificationRecord(
  overrides: Partial<ClassificationRecord> = {},
): ClassificationRecord {
  return {
    id: "classification.concept.attention",
    slug: "attention-mechanisms",
    kind: "classification",
    defaultTitleKey: "title",
    defaultSummaryKey: "description",
    aliases: ["attention mechanism"],
    tags: [],
    relatedIds: [],
    citationIds: [],
    status: "published",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    classificationType: "mechanism",
    classifiesKinds: ["concept"],
    ...overrides,
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
    conceptType: "general",
    prerequisiteIds: [],
    explainsIds: [],
    ...overrides,
  };
}

describe("buildSearchDocuments", () => {
  test("indexes published docs pages for the default locale except W18 move stubs", async () => {
    const registry = await loadRegistry();
    const pages = await loadPublishedDocsPages("en");
    const documents = buildSearchDocuments(pages, registry);
    const searchablePages = pages.filter(
      (page) =>
        !isDocumentationRouteMigrationOldBrowsePath(page.url) &&
        !isDocumentationRouteMigrationOldBrowsePath(page.docsSlug),
    );
    const documentUrls = new Set(documents.map((document) => document.url));

    expect(documents.length).toBe(searchablePages.length);
    expect(documents.map((document) => document.url).sort()).toEqual(
      searchablePages.map((page) => page.url).sort(),
    );

    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(pages.some((page) => page.url === oldRoute)).toBe(true);
      expect(documentUrls.has(oldRoute)).toBe(false);
    }
  });

  test("builds stable empty topology metadata for records without ontology fields", () => {
    const record = buildSyntheticConcept();
    const document = buildSearchDocuments(
      [buildSyntheticPage(record.id)],
      buildRegistryIndexes([record]),
    )[0];

    expect(document?.topology).toEqual({
      primaryClassificationId: undefined,
      secondaryClassificationIds: [],
      primaryClassification: undefined,
      secondaryClassifications: [],
      classificationIds: [],
      ancestorClassificationIds: [],
      ancestorClassifications: [],
      rootClassificationIds: [],
      rootClassifications: [],
      relationships: [],
      relatedTopologyIds: [],
      terms: [],
    });
    expect(document?.title).toBe("Synthetic Concept");
    expect(document?.facets).not.toHaveProperty("moduleType");
  });

  test("resolves primary classification metadata from ontology membership", () => {
    const record = buildSyntheticConcept({
      primaryClassificationId: "classification.concept.attention",
    });
    const classification = buildClassificationRecord();
    const indexes = buildRegistryIndexes([record]);
    indexes.byId.set(classification.id, classification);
    indexes.bySlug.set(classification.slug, classification);
    indexes.classificationsById.set(classification.id, classification);

    const document = buildSearchDocuments(
      [buildSyntheticPage(record.id)],
      indexes,
    )[0];

    expect(document?.topology.primaryClassificationId).toBe(
      "classification.concept.attention",
    );
    expect(document?.facets.primaryClassificationId).toBe(
      "classification.concept.attention",
    );
  });

  test("keeps documents searchable when classification targets are missing or draft", () => {
    const draftClassification: ClassificationRecord = {
      id: "classification.draft-family",
      slug: "draft-family",
      kind: "classification",
      defaultTitleKey: "title",
      defaultSummaryKey: "description",
      aliases: ["draft family"],
      tags: [],
      relatedIds: [],
      citationIds: [],
      status: "draft",
      createdAt: "2026-06-20T00:00:00.000Z",
      updatedAt: "2026-06-20T00:00:00.000Z",
      classificationType: "family",
      classifiesKinds: ["concept"],
    };
    const record = buildSyntheticConcept({
      primaryClassificationId: "classification.missing-family",
      secondaryClassificationIds: [draftClassification.id],
      relationships: [
        {
          relationshipType: "related",
          targetId: "concept.missing-neighbor",
        },
      ],
    });
    const indexes = buildRegistryIndexes([record]);
    indexes.byId.set(draftClassification.id, draftClassification);
    indexes.bySlug.set(draftClassification.slug, draftClassification);
    indexes.classificationsById.set(
      draftClassification.id,
      draftClassification,
    );

    const document = buildSearchDocuments(
      [buildSyntheticPage(record.id)],
      indexes,
    )[0];

    expect(document?.topology.primaryClassificationId).toBeUndefined();
    expect(document?.topology.primaryClassification).toBeUndefined();
    expect(document?.topology.secondaryClassificationIds).toEqual([
      "classification.draft-family",
    ]);
    expect(document?.topology.secondaryClassifications).toEqual([]);
    expect(document?.topology.relationships).toEqual([
      {
        relationshipType: "related",
        targetId: "concept.missing-neighbor",
        targetKind: undefined,
        targetSlug: undefined,
        targetAliases: [],
      },
    ]);
    expect(document?.title).toBe("Synthetic Concept");
  });
});
