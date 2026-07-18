import { describe, expect, test } from "bun:test";
import type { DocsPageSource } from "@/lib/content/pages";
import type { RegistryIndexes } from "@/lib/content/registry";
import type {
  ClassificationRecord,
  ConceptRecord,
  OrganizationRecord,
} from "@/lib/content/schemas";
import {
  buildSearchDocument,
  buildSearchDocuments,
  buildSearchDocumentsForLocale,
} from "./build-documents";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";

const RETIRED_ATLAS_ONLY_FACET_KEYS = [
  "modelFamily",
  "sourceType",
  "modalities",
  "trainingRegimeIds",
  "optimizes",
] as const;

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

function buildSyntheticPage(
  overrides: Partial<DocsPageSource> & {
    frontmatter: DocsPageSource["frontmatter"];
  },
): DocsPageSource {
  return {
    pageDir: "/tmp/synthetic-page",
    docsSlug: "guides/synthetic-page",
    url: "/docs/guides/synthetic-page",
    messages: {
      title: "Synthetic Page",
      description: "Synthetic page description",
    },
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
    aliases: ["synthetic concept"],
    tags: ["attention"],
    relatedIds: [],
    citationIds: [],
    status: "published",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    conceptType: "architecture",
    prerequisiteIds: [],
    explainsIds: [],
    primaryClassificationId: "classification.concept.attention",
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
    parentClassificationId: undefined,
    ...overrides,
  };
}

describe("buildSearchDocument", () => {
  test("builds generic enriched documents without retired Atlas AI facet keys", () => {
    const conceptRecord = buildConcept();
    const classification = buildClassification();
    const indexes = buildRegistryIndexes([conceptRecord, classification]);
    const page = buildSyntheticPage({
      pageDir: "/tmp/synthetic-concept",
      docsSlug: "concepts/synthetic-concept",
      url: "/docs/concepts/synthetic-concept",
      frontmatter: {
        kind: "concept",
        registryId: conceptRecord.id,
        messageNamespace: "local",
        assetNamespace: "local",
        tags: ["attention"],
        status: "published",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
      messages: {
        title: "Synthetic Concept",
        description: "Synthetic concept description",
      },
    });

    const document = buildSearchDocument(page, indexes);

    expect(document.registryId).toBe(conceptRecord.id);
    expect(document.title).toBe("Synthetic Concept");
    expect(document.facets.kind).toBe("concept");
    expect(document.facets.tags).toEqual(["attention"]);
    expect(document.facets.primaryClassificationId).toBe(classification.id);
    for (const facetKey of RETIRED_ATLAS_ONLY_FACET_KEYS) {
      expect(document.facets).not.toHaveProperty(facetKey);
    }
  });

  test("keeps organization documents free of retired Atlas AI-only facets", () => {
    const organizationRecord = buildOrganization();
    const indexes = buildRegistryIndexes([organizationRecord]);
    const page = buildSyntheticPage({
      pageDir: "/tmp/synthetic-org",
      docsSlug: "organizations/synthetic-org",
      url: "/docs/organizations/synthetic-org",
      frontmatter: {
        kind: "documentation",
        registryId: organizationRecord.id,
        messageNamespace: "local",
        assetNamespace: "local",
        tags: [],
        status: "published",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
      messages: {
        title: "Synthetic Organization",
        description: "Synthetic organization description",
      },
    });

    const document = buildSearchDocument(page, indexes);

    expect(document.facets.kind).toBe("documentation");
    for (const facetKey of RETIRED_ATLAS_ONLY_FACET_KEYS) {
      expect(document.facets).not.toHaveProperty(facetKey);
    }
  });

  test("preserves empty topology for pages without registry records", () => {
    const indexes = buildRegistryIndexes([]);
    const page = buildSyntheticPage({
      frontmatter: {
        kind: "concept",
        registryId: "concept.missing",
        messageNamespace: "local",
        assetNamespace: "local",
        tags: ["getting-started"],
        status: "published",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
    });

    const document = buildSearchDocument(page, indexes);

    expect(document.topology).toEqual(EMPTY_SEARCH_DOCUMENT_TOPOLOGY);
    expect(document.facets).toEqual({
      kind: "concept",
      tags: ["getting-started"],
      primaryClassificationId: undefined,
      primaryClassificationSlug: undefined,
      classificationIds: [],
      classificationSlugs: [],
      ancestorClassificationIds: [],
      ancestorClassificationSlugs: [],
      rootClassificationIds: [],
      rootClassificationSlugs: [],
      relatedTopologyIds: [],
      relationshipTypes: [],
    });
    for (const facetKey of RETIRED_ATLAS_ONLY_FACET_KEYS) {
      expect(document.facets).not.toHaveProperty(facetKey);
    }
  });
});

describe("buildSearchDocumentsForLocale", () => {
  test("rejects empty locale strings", () => {
    expect(() =>
      buildSearchDocumentsForLocale("", buildRegistryIndexes([]), []),
    ).toThrow("Search document locale must be non-empty.");
  });

  test("maps pages through the generic enrichment path only", () => {
    const conceptRecord = buildConcept({
      primaryClassificationId: undefined,
    });
    const indexes = buildRegistryIndexes([conceptRecord]);
    const page = buildSyntheticPage({
      pageDir: "/tmp/synthetic-concept",
      docsSlug: "concepts/synthetic-concept",
      url: "/docs/concepts/synthetic-concept",
      frontmatter: {
        kind: "concept",
        registryId: conceptRecord.id,
        messageNamespace: "local",
        assetNamespace: "local",
        tags: ["attention"],
        status: "published",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
      messages: {
        title: "Synthetic Concept",
        description: "Synthetic concept description",
      },
    });

    const documents = buildSearchDocumentsForLocale("en", indexes, [page], [], {
      referenceItemDocuments: [],
    });

    expect(documents).toHaveLength(1);
    expect(documents[0]?.facets).not.toHaveProperty("optimizes");
    expect(buildSearchDocuments([page], indexes)).toEqual(documents);
  });
});
