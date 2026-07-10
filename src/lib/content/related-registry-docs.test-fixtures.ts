import type { ResolveRelatedRegistryDocsOptions } from "@/lib/content/related-registry-docs";
import type { ConceptRecord } from "@/lib/content/schemas";

// These ids mirror real published concept records (see
// src/content/registry/concepts/harness.json and loop.json) so that
// registryRecordHref resolves a real href from the generated published-docs
// registry instead of a fabricated one.
export const RELATED_REGISTRY_DOCS_PUBLISHED_IDS = new Set([
  "concept.harness",
  "concept.loop",
  "concept.unindexed-concept",
]);

export const relatedRegistryDocsHarness: ConceptRecord = {
  id: "concept.harness",
  slug: "harness",
  kind: "concept",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: ["Harness"],
  tags: [],
  relatedIds: [],
  citationIds: [],
  status: "published",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  prerequisiteIds: [],
  explainsIds: [],
};

export const relatedRegistryDocsLoop: ConceptRecord = {
  ...relatedRegistryDocsHarness,
  id: "concept.loop",
  slug: "loop",
  aliases: ["Loop"],
};

export const relatedRegistryDocsDraftConcept: ConceptRecord = {
  ...relatedRegistryDocsHarness,
  id: "concept.draft-concept",
  slug: "draft-concept",
  aliases: ["Draft concept"],
  status: "draft",
};

/** Published registry record that is not yet in the generated published-docs index. */
export const relatedRegistryDocsUnindexedConcept: ConceptRecord = {
  ...relatedRegistryDocsHarness,
  id: "concept.unindexed-concept",
  slug: "unindexed-concept",
  aliases: ["Unindexed concept"],
  status: "published",
};

export const relatedRegistryDocsRecordsById = new Map<string, ConceptRecord>([
  [relatedRegistryDocsHarness.id, relatedRegistryDocsHarness],
  [relatedRegistryDocsLoop.id, relatedRegistryDocsLoop],
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
