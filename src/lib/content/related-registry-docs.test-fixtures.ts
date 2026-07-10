import type { ResolveRelatedRegistryDocsOptions } from "@/lib/content/related-registry-docs";
import type { ConceptRecord } from "@/lib/content/schemas";

export const RELATED_REGISTRY_DOCS_PUBLISHED_IDS = new Set([
  "concept.bottlenecks",
  "concept.harness",
]);

export const relatedRegistryDocsBottlenecks: ConceptRecord = {
  id: "concept.bottlenecks",
  slug: "bottlenecks",
  kind: "concept",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: ["Bottlenecks"],
  tags: ["foundations"],
  relatedIds: [],
  citationIds: [],
  status: "published",
  createdAt: "2026-07-10T00:00:00.000Z",
  updatedAt: "2026-07-10T00:00:00.000Z",
  conceptType: "systems",
  prerequisiteIds: [],
  explainsIds: [],
};

export const relatedRegistryDocsHarness: ConceptRecord = {
  ...relatedRegistryDocsBottlenecks,
  id: "concept.harness",
  slug: "harness",
  aliases: ["Harness"],
  tags: [],
};

export const relatedRegistryDocsDraftConcept: ConceptRecord = {
  ...relatedRegistryDocsBottlenecks,
  id: "concept.draft-related",
  slug: "draft-related",
  aliases: ["Draft related"],
  status: "draft",
};

/** Published registry record that is not yet in the published-docs index. */
export const relatedRegistryDocsUnindexedConcept: ConceptRecord = {
  ...relatedRegistryDocsBottlenecks,
  id: "concept.unindexed-related",
  slug: "unindexed-related",
  aliases: ["Unindexed related"],
  status: "published",
};

export const relatedRegistryDocsRecordsById = new Map<string, ConceptRecord>([
  [relatedRegistryDocsBottlenecks.id, relatedRegistryDocsBottlenecks],
  [relatedRegistryDocsHarness.id, relatedRegistryDocsHarness],
  [relatedRegistryDocsDraftConcept.id, relatedRegistryDocsDraftConcept],
  [relatedRegistryDocsUnindexedConcept.id, relatedRegistryDocsUnindexedConcept],
]);

export const relatedRegistryDocsResolveOptions: ResolveRelatedRegistryDocsOptions =
  {
    publishedRegistryIds: RELATED_REGISTRY_DOCS_PUBLISHED_IDS,
    getRecordById: (registryId) =>
      relatedRegistryDocsRecordsById.get(registryId),
  };

export const RELATED_REGISTRY_DOCS_MISSING_ID =
  "concept.missing-runtime-record";
