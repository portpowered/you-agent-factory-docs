import { describe, expect, test } from "bun:test";
import type { RegistryIndexes } from "@/lib/content/registry";
import type {
  ClassificationRecord,
  ConceptRecord,
  OrganizationRecord,
} from "@/lib/content/schemas";
import { enrichSearchDocument } from "./enrich-search-document";
import { toOramaRecord } from "./orama-index";
import { toStructuredData } from "./to-structured-data";
import { topologySearchText } from "./topology-search-terms";
import type { BaseSearchDocument } from "./types";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";

function buildRegistryIndexes(
  records: Array<ConceptRecord | OrganizationRecord | ClassificationRecord>,
): RegistryIndexes {
  const classifications = records.filter(
    (record): record is ClassificationRecord =>
      record.kind === "classification",
  );

  return {
    byId: new Map(records.map((record) => [record.id, record])),
    bySlug: new Map(records.map((record) => [record.slug, record])),
    classificationsById: new Map(
      classifications.map((record) => [record.id, record]),
    ),
    tagsById: new Map(),
    tagsBySlug: new Map(),
  };
}

function buildSyntheticBase(
  overrides: Partial<BaseSearchDocument> = {},
): BaseSearchDocument {
  return {
    id: "/docs/concepts/synthetic-concept",
    registryId: "concept.synthetic-concept",
    url: "/docs/concepts/synthetic-concept",
    kind: "concept",
    title: "Synthetic Concept",
    description: "Synthetic concept description",
    bodyText: "Synthetic body text",
    headings: ["Overview"],
    directAliases: ["synthetic"],
    aliases: ["synthetic"],
    tags: ["attention"],
    relatedIds: [],
    facets: { kind: "concept", tags: ["attention"] },
    topology: { ...EMPTY_SEARCH_DOCUMENT_TOPOLOGY },
    ...overrides,
  };
}

function buildClassification(
  overrides: Partial<ClassificationRecord> = {},
): ClassificationRecord {
  return {
    id: "classification.concept.attention",
    slug: "attention-mechanisms",
    kind: "classification",
    defaultTitleKey: "title",
    defaultSummaryKey: "description",
    aliases: ["attention"],
    tags: ["attention"],
    relatedIds: [],
    citationIds: [],
    status: "published",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    classificationType: "family",
    classifiesKinds: ["concept"],
    parentClassificationId: "classification.concept",
    ...overrides,
  };
}

function buildConcept(overrides: Partial<ConceptRecord> = {}): ConceptRecord {
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
    conceptType: "architecture",
    prerequisiteIds: [],
    explainsIds: [],
    primaryClassificationId: "classification.concept.attention.grouped-query",
    relationships: [
      {
        relationshipType: "uses",
        targetId: "concept.activation",
      },
    ],
    ...overrides,
  };
}

function buildOrganization(
  overrides: Partial<OrganizationRecord> = {},
): OrganizationRecord {
  return {
    id: "organization.synthetic-org",
    slug: "synthetic-org",
    kind: "organization",
    defaultTitleKey: "title",
    defaultSummaryKey: "description",
    aliases: [],
    tags: [],
    relatedIds: [],
    citationIds: [],
    status: "published",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    modelIds: [],
    paperIds: [],
    systemIds: [],
    ...overrides,
  };
}

describe("enrichSearchDocument", () => {
  test("resolves published classification lineage, ancestors, roots, relationships, and related topology ids", () => {
    const conceptRoot = buildClassification({
      id: "classification.concept",
      slug: "concept",
      parentClassificationId: undefined,
    });
    const attentionFamily = buildClassification({
      id: "classification.concept.attention",
      slug: "attention-mechanisms",
      parentClassificationId: conceptRoot.id,
    });
    const groupedQuery = buildClassification({
      id: "classification.concept.attention.grouped-query",
      slug: "attention-grouped-query",
      parentClassificationId: attentionFamily.id,
      aliases: ["grouped-query attention", "GQA"],
    });
    const activationConcept = buildConcept({
      id: "concept.activation",
      slug: "activation",
      aliases: ["activation function"],
      primaryClassificationId: undefined,
      relationships: undefined,
    });
    const conceptRecord = buildConcept();
    const indexes = buildRegistryIndexes([
      conceptRoot,
      attentionFamily,
      groupedQuery,
      activationConcept,
      conceptRecord,
    ]);

    const enriched = enrichSearchDocument(buildSyntheticBase(), indexes);

    expect(enriched.topology.primaryClassificationId).toBe(groupedQuery.id);
    expect(enriched.topology.ancestorClassificationIds).toEqual([
      attentionFamily.id,
      conceptRoot.id,
    ]);
    expect(enriched.topology.rootClassificationIds).toEqual([conceptRoot.id]);
    expect(enriched.topology.relationships).toEqual([
      expect.objectContaining({
        relationshipType: "uses",
        targetId: activationConcept.id,
        targetKind: "concept",
        targetSlug: activationConcept.slug,
      }),
    ]);
    expect(enriched.topology.relatedTopologyIds).toEqual(
      expect.arrayContaining([
        groupedQuery.id,
        attentionFamily.id,
        conceptRoot.id,
        activationConcept.id,
      ]),
    );
    expect(enriched.topology.terms).toEqual(
      expect.arrayContaining([
        groupedQuery.id,
        "attention-grouped-query",
        attentionFamily.id,
        conceptRoot.id,
        "uses",
        activationConcept.id,
        activationConcept.slug,
      ]),
    );
  });

  test("adds classification and relationship facets plus legacy concept-type compatibility, without retired module fields", () => {
    const conceptRoot = buildClassification({
      id: "classification.concept",
      slug: "concept",
      parentClassificationId: undefined,
    });
    const attentionFamily = buildClassification({
      id: "classification.concept.attention",
      slug: "attention-mechanisms",
      parentClassificationId: conceptRoot.id,
    });
    const groupedQuery = buildClassification({
      id: "classification.concept.attention.grouped-query",
      slug: "attention-grouped-query",
      parentClassificationId: attentionFamily.id,
    });
    const conceptRecord = buildConcept({
      conceptType: "architecture",
    });
    const indexes = buildRegistryIndexes([
      conceptRoot,
      attentionFamily,
      groupedQuery,
      conceptRecord,
    ]);

    const enriched = enrichSearchDocument(buildSyntheticBase(), indexes);

    expect(enriched.facets.primaryClassificationId).toBe(groupedQuery.id);
    expect(enriched.facets.primaryClassificationSlug).toBe(groupedQuery.slug);
    expect(enriched.facets.classificationIds).toEqual(
      expect.arrayContaining([groupedQuery.id]),
    );
    expect(enriched.facets.ancestorClassificationIds).toEqual([
      attentionFamily.id,
      conceptRoot.id,
    ]);
    expect(enriched.facets.rootClassificationSlugs).toEqual([conceptRoot.slug]);
    expect(enriched.facets.relationshipTypes).toEqual(["uses"]);
    expect(enriched.facets.relatedTopologyIds).toEqual(
      expect.arrayContaining([groupedQuery.id, conceptRoot.id]),
    );
    expect(enriched.facets.legacyConceptType).toBe("architecture");
    expect(enriched.facets).not.toHaveProperty("legacyModuleFamily");
    expect(enriched.facets).not.toHaveProperty("legacyVariantGroup");
    expect(enriched.facets).not.toHaveProperty("moduleType");
    expect(enriched.facets).not.toHaveProperty("optimizes");
  });

  test("does not add retired Atlas-only facets for non-ontology-participating records", () => {
    const organizationRecord = buildOrganization();
    const indexes = buildRegistryIndexes([organizationRecord]);
    const base = buildSyntheticBase({
      registryId: organizationRecord.id,
      kind: "organization",
      facets: { kind: "organization", tags: [] },
    });

    const enriched = enrichSearchDocument(base, indexes);

    expect(enriched.facets).not.toHaveProperty("modelFamily");
    expect(enriched.facets).not.toHaveProperty("sourceType");
    expect(enriched.facets).not.toHaveProperty("modalities");
    expect(enriched.facets).not.toHaveProperty("trainingRegimeIds");
    expect(enriched.facets).not.toHaveProperty("legacyConceptType");
  });

  test("keeps topology terms searchable through structured data and Orama topology text", () => {
    const conceptRoot = buildClassification({
      id: "classification.concept",
      slug: "concept",
      parentClassificationId: undefined,
    });
    const attentionFamily = buildClassification({
      id: "classification.concept.attention",
      slug: "attention-mechanisms",
      parentClassificationId: conceptRoot.id,
    });
    const groupedQuery = buildClassification({
      id: "classification.concept.attention.grouped-query",
      slug: "attention-grouped-query",
      parentClassificationId: attentionFamily.id,
      aliases: ["grouped-query attention", "GQA"],
    });
    const conceptRecord = buildConcept();
    const indexes = buildRegistryIndexes([
      conceptRoot,
      attentionFamily,
      groupedQuery,
      conceptRecord,
    ]);
    const enriched = enrichSearchDocument(buildSyntheticBase(), indexes);

    const topologyText = topologySearchText(enriched);
    expect(topologyText).toContain("attention-grouped-query");
    expect(topologyText).toContain("attentionmechanisms");

    const structuredData = toStructuredData(enriched);
    const searchableBlocks = structuredData.contents.map(
      (block) => block.content,
    );
    expect(searchableBlocks.join("\n")).toContain("attention-grouped-query");

    const oramaRecord = toOramaRecord(enriched);
    expect(oramaRecord.topology).toContain("attention-grouped-query");
  });

  test("keeps draft classifications out of topology and missing relationship targets non-fatal", () => {
    const draftClassification = buildClassification({
      id: "classification.concept.attention.draft-variant",
      slug: "draft-variant",
      status: "draft",
      parentClassificationId: "classification.concept.attention",
    });
    const attentionFamily = buildClassification({
      id: "classification.concept.attention",
      slug: "attention-mechanisms",
      parentClassificationId: "classification.concept",
    });
    const conceptRoot = buildClassification({
      id: "classification.concept",
      slug: "concept",
      parentClassificationId: undefined,
    });
    const conceptRecord = buildConcept({
      primaryClassificationId: draftClassification.id,
      relationships: [
        {
          relationshipType: "related",
          targetId: "concept.missing-neighbor",
        },
      ],
    });
    const indexes = buildRegistryIndexes([
      conceptRoot,
      attentionFamily,
      draftClassification,
      conceptRecord,
    ]);

    const enriched = enrichSearchDocument(buildSyntheticBase(), indexes);

    expect(enriched.title).toBe("Synthetic Concept");
    expect(enriched.topology.primaryClassification).toBeUndefined();
    expect(enriched.topology.classificationIds).toEqual([]);
    expect(enriched.topology.relationships).toEqual([
      {
        relationshipType: "related",
        targetId: "concept.missing-neighbor",
        targetKind: undefined,
        targetSlug: undefined,
        targetAliases: [],
      },
    ]);
    expect(enriched.facets.primaryClassificationId).toBe(
      draftClassification.id,
    );
    expect(enriched.facets.classificationIds).toEqual([]);
  });
});
