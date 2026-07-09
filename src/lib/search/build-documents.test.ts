import { describe, expect, test } from "bun:test";
import type { DocsPageSource } from "@/lib/content/pages";
import type { RegistryIndexes } from "@/lib/content/registry";
import type {
  ClassificationRecord,
  ModelRecord,
  ModuleRecord,
} from "@/lib/content/schemas";
import {
  buildSearchDocument,
  buildSearchDocuments,
  buildSearchDocumentsForLocale,
} from "./build-documents";
import { EMPTY_SEARCH_DOCUMENT_TOPOLOGY } from "./types";

const MODEL_ATLAS_AI_ONLY_FACET_KEYS = [
  "modelFamily",
  "sourceType",
  "modalities",
  "trainingRegimeIds",
  "optimizes",
] as const;

function buildRegistryIndexes(
  records: Array<ModuleRecord | ModelRecord | ClassificationRecord>,
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

function buildModule(overrides: Partial<ModuleRecord> = {}): ModuleRecord {
  return {
    id: "module.synthetic-module",
    slug: "synthetic-module",
    kind: "module",
    defaultTitleKey: "title",
    defaultSummaryKey: "description",
    aliases: ["synthetic module"],
    tags: ["attention"],
    relatedIds: [],
    citationIds: [],
    status: "published",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    moduleType: "other",
    optimizes: ["kv-cache", "memory-bandwidth"],
    exampleModelIds: [],
    improvesOnIds: [],
    tradeoffIds: [],
    usedByModelIds: [],
    introducedByPaperIds: [],
    mathLevel: "none",
    primaryClassificationId: "classification.module.attention",
    ...overrides,
  };
}

function buildModel(overrides: Partial<ModelRecord> = {}): ModelRecord {
  return {
    id: "model.synthetic-model",
    slug: "synthetic-model",
    kind: "model",
    defaultTitleKey: "title",
    defaultSummaryKey: "description",
    aliases: [],
    tags: [],
    relatedIds: [],
    citationIds: [],
    status: "published",
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    family: "gpt",
    sourceType: "closed",
    modalities: ["text"],
    trainingRegimeIds: ["training-regime.pretraining"],
    architectureIds: [],
    moduleIds: [],
    datasetIds: [],
    paperIds: [],
    ...overrides,
  };
}

function buildClassification(
  overrides: Partial<ClassificationRecord> = {},
): ClassificationRecord {
  return {
    id: "classification.module.attention",
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
    classifiesKinds: ["module"],
    parentClassificationId: undefined,
    ...overrides,
  };
}

describe("buildSearchDocument", () => {
  test("builds generic enriched documents without Model Atlas AI facet keys", () => {
    const moduleRecord = buildModule();
    const classification = buildClassification();
    const indexes = buildRegistryIndexes([moduleRecord, classification]);
    const page = buildSyntheticPage({
      pageDir: "/tmp/synthetic-module",
      docsSlug: "modules/synthetic-module",
      url: "/docs/modules/synthetic-module",
      frontmatter: {
        kind: "module",
        registryId: moduleRecord.id,
        messageNamespace: "local",
        assetNamespace: "local",
        tags: ["attention"],
        status: "published",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
      messages: {
        title: "Synthetic Module",
        description: "Synthetic module description",
      },
    });

    const document = buildSearchDocument(page, indexes);

    expect(document.registryId).toBe(moduleRecord.id);
    expect(document.title).toBe("Synthetic Module");
    expect(document.facets.kind).toBe("module");
    expect(document.facets.tags).toEqual(["attention"]);
    expect(document.facets.primaryClassificationId).toBe(classification.id);
    expect(document.facets.moduleType).toBe("attention");
    for (const facetKey of MODEL_ATLAS_AI_ONLY_FACET_KEYS) {
      expect(document.facets).not.toHaveProperty(facetKey);
    }
  });

  test("keeps model documents free of Atlas AI-only facets", () => {
    const modelRecord = buildModel();
    const indexes = buildRegistryIndexes([modelRecord]);
    const page = buildSyntheticPage({
      pageDir: "/tmp/synthetic-model",
      docsSlug: "models/synthetic-model",
      url: "/docs/models/synthetic-model",
      frontmatter: {
        kind: "model",
        registryId: modelRecord.id,
        messageNamespace: "local",
        assetNamespace: "local",
        tags: [],
        status: "published",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
      messages: {
        title: "Synthetic Model",
        description: "Synthetic model description",
      },
    });

    const document = buildSearchDocument(page, indexes);

    expect(document.facets.kind).toBe("model");
    for (const facetKey of MODEL_ATLAS_AI_ONLY_FACET_KEYS) {
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
    for (const facetKey of MODEL_ATLAS_AI_ONLY_FACET_KEYS) {
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
    const moduleRecord = buildModule({
      primaryClassificationId: undefined,
      optimizes: ["kv-cache"],
    });
    const indexes = buildRegistryIndexes([moduleRecord]);
    const page = buildSyntheticPage({
      pageDir: "/tmp/synthetic-module",
      docsSlug: "modules/synthetic-module",
      url: "/docs/modules/synthetic-module",
      frontmatter: {
        kind: "module",
        registryId: moduleRecord.id,
        messageNamespace: "local",
        assetNamespace: "local",
        tags: ["attention"],
        status: "published",
        updatedAt: "2026-06-20T00:00:00.000Z",
      },
      messages: {
        title: "Synthetic Module",
        description: "Synthetic module description",
      },
    });

    const documents = buildSearchDocumentsForLocale("en", indexes, [page]);

    expect(documents).toHaveLength(1);
    expect(documents[0]?.facets).not.toHaveProperty("optimizes");
    expect(buildSearchDocuments([page], indexes)).toEqual(documents);
  });
});
