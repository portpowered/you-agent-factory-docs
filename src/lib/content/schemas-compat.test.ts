import { describe, expect, test } from "bun:test";
import * as core from "./registry-core";
import {
  baseRecordSchema,
  citationRecordSchema,
  citationTypeSchema,
  classificationRecordSchema,
  classificationTypeSchema,
  datasetRecordSchema,
  generatedPageBundleRegistryRecordSchema,
  graphRecordSchema,
  ontologyParticipantKindSchema,
  ontologyRelationshipSchema,
  ontologyRelationshipTypeSchema,
  organizationRecordSchema,
  registryKindSchema,
  registryRecordSchema,
  registryStatusSchema,
  tagCategorySchema,
  tagLandingPageSchema,
  tagRecordSchema,
} from "./schemas";

const validBaseFields = {
  id: "concept.harness",
  slug: "harness",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: ["Harness"],
  tags: ["systems"],
  relatedIds: [],
  citationIds: [],
  status: "published" as const,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
};

describe("schemas export compatibility", () => {
  test("re-exports core registry schemas from registry-core without duplication", () => {
    expect(baseRecordSchema).toBe(core.baseRecordSchema);
    expect(registryStatusSchema).toBe(core.registryStatusSchema);
    expect(registryKindSchema).toBe(core.registryKindSchema);
    expect(tagRecordSchema).toBe(core.tagRecordSchema);
    expect(tagCategorySchema).toBe(core.tagCategorySchema);
    expect(tagLandingPageSchema).toBe(core.tagLandingPageSchema);
    expect(citationRecordSchema).toBe(core.citationRecordSchema);
    expect(citationTypeSchema).toBe(core.citationTypeSchema);
    expect(classificationRecordSchema).toBe(core.classificationRecordSchema);
    expect(classificationTypeSchema).toBe(core.classificationTypeSchema);
    expect(ontologyParticipantKindSchema).toBe(
      core.ontologyParticipantKindSchema,
    );
    expect(ontologyRelationshipSchema).toBe(core.ontologyRelationshipSchema);
    expect(ontologyRelationshipTypeSchema).toBe(
      core.ontologyRelationshipTypeSchema,
    );
  });

  test("parses factory-kind records through the existing schema module exports", () => {
    expect(
      datasetRecordSchema.safeParse({
        ...validBaseFields,
        id: "dataset.demo",
        slug: "demo-dataset",
        kind: "dataset",
        usedByModelIds: [],
        paperIds: [],
      }).success,
    ).toBe(true);

    expect(
      organizationRecordSchema.safeParse({
        ...validBaseFields,
        id: "organization.demo",
        slug: "demo-org",
        kind: "organization",
        modelIds: [],
        paperIds: [],
        systemIds: [],
      }).success,
    ).toBe(true);

    expect(
      graphRecordSchema.safeParse({
        ...validBaseFields,
        id: "graph.demo",
        slug: "demo-graph",
        kind: "graph",
        subjectId: "concept.harness",
        graphType: "concept-map",
        rootNodeId: "node.root",
        layout: "vertical-expandable",
        defaultExpandedDepth: 1,
        supportedRenderers: ["react-flow"],
        nodes: [
          {
            id: "node.root",
            labelKey: "graph.nodes.root.label",
            moduleKind: "operation",
            childNodeIds: [],
          },
        ],
        edges: [],
      }).success,
    ).toBe(true);
  });

  test("keeps registry union and generated bundle schemas available from schemas.ts", () => {
    const conceptResult = registryRecordSchema.safeParse({
      ...validBaseFields,
      kind: "concept",
      conceptType: "systems",
      prerequisiteIds: [],
      explainsIds: [],
    });
    expect(conceptResult.success).toBe(true);

    const bundleResult = generatedPageBundleRegistryRecordSchema.safeParse({
      ...validBaseFields,
      id: "concept.demo",
      slug: "demo-concept",
      kind: "concept",
      conceptType: "architecture",
      prerequisiteIds: [],
      explainsIds: [],
    });
    expect(bundleResult.success).toBe(true);
    if (bundleResult.success) {
      expect(bundleResult.data.kind).toBe("concept");
    }
  });
});
