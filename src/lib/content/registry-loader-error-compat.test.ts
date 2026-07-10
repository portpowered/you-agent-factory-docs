import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  loadRegistry,
  RegistryLoadError,
  resetRegistryLoadCacheForTests,
} from "./registry";

const fixtureRoot = join(
  import.meta.dir,
  "__fixtures__",
  "loader-error-compat",
);

const validConceptRecord = {
  id: "concept.grouped-query-attention",
  slug: "grouped-query-attention",
  kind: "concept",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: ["GQA"],
  tags: ["attention"],
  relatedIds: [],
  citationIds: ["citation.gqa-paper"],
  status: "published",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  primaryClassificationId: "classification.concept.attention",
  prerequisiteIds: [],
  explainsIds: [],
};

const validTagRecord = {
  id: "tag.attention",
  slug: "attention",
  kind: "tag",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: ["self-attention"],
  tags: [],
  relatedIds: [],
  citationIds: [],
  status: "published",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  category: "module-type",
  landingPage: "generated-tag-page",
};

const validCitationRecord = {
  id: "citation.gqa-paper",
  slug: "gqa-paper",
  kind: "citation",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: [],
  tags: ["attention"],
  relatedIds: [],
  citationIds: [],
  status: "published",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  citationType: "paper",
  authors: ["Ainslie et al."],
  title: "GQA: Training Generalized Multi-Query Transformer Models",
  url: "https://arxiv.org/abs/2305.13245",
  mla: 'Ainslie, Joshua, et al. "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints." arXiv, 2023.',
  year: 2023,
};

const validClassificationRecord = {
  id: "classification.concept.attention",
  slug: "attention-mechanisms",
  kind: "classification",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: ["attention family"],
  tags: [],
  relatedIds: [],
  citationIds: [],
  status: "published",
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  classificationType: "family",
  classifiesKinds: ["concept"],
  parentClassificationId: "classification.concept",
  legacyIds: ["classification.attention-mechanisms"],
};

async function writeMinimalRegistry(
  subdirectory: string,
  files: Record<string, unknown>,
): Promise<void> {
  const root = join(fixtureRoot, subdirectory);
  await rm(root, { recursive: true, force: true });
  for (const [collection, records] of Object.entries(files)) {
    await mkdir(join(root, collection), { recursive: true });
    for (const [fileName, record] of Object.entries(
      records as Record<string, unknown>,
    )) {
      await writeFile(join(root, collection, fileName), JSON.stringify(record));
    }
  }
}

afterEach(async () => {
  resetRegistryLoadCacheForTests();
  await rm(fixtureRoot, { recursive: true, force: true });
});

describe("registry loader error compatibility unchanged after core type split", () => {
  test("rejects ontology participants that reference missing classifications", async () => {
    await writeMinimalRegistry("missing-classification", {
      concepts: {
        "grouped-query-attention.json": {
          ...validConceptRecord,
          primaryClassificationId: "classification.missing",
        },
      },
      tags: { "attention.json": validTagRecord },
      citations: { "gqa-paper.json": validCitationRecord },
    });

    await expect(
      loadRegistry({
        registryRoot: join(fixtureRoot, "missing-classification"),
      }),
    ).rejects.toMatchObject({
      name: "RegistryLoadError",
      details: expect.arrayContaining([
        expect.objectContaining({
          type: "parse-error",
          message: expect.stringContaining(
            "primaryClassificationId must reference a classification record",
          ),
        }),
      ]),
    });
  });

  test("rejects ontology relationships that point at missing records", async () => {
    await writeMinimalRegistry("missing-relationship-target", {
      concepts: {
        "grouped-query-attention.json": {
          ...validConceptRecord,
          primaryClassificationId: "classification.concept.attention",
          relationships: [
            {
              relationshipType: "uses",
              targetId: "concept.missing-target",
            },
          ],
        },
      },
      classifications: {
        "attention.json": {
          ...validClassificationRecord,
          parentClassificationId: undefined,
          legacyIds: undefined,
        },
      },
      tags: { "attention.json": validTagRecord },
      citations: { "gqa-paper.json": validCitationRecord },
    });

    await expect(
      loadRegistry({
        registryRoot: join(fixtureRoot, "missing-relationship-target"),
      }),
    ).rejects.toMatchObject({
      name: "RegistryLoadError",
      details: expect.arrayContaining([
        expect.objectContaining({
          type: "parse-error",
          message: expect.stringContaining(
            'relationships targetId references missing record "concept.missing-target"',
          ),
        }),
      ]),
    });
  });

  test("rejects classifications with non-canonical dotted namespace ids", async () => {
    await writeMinimalRegistry("invalid-classification-id", {
      classifications: {
        "attention.json": {
          ...validClassificationRecord,
          id: "classification.attention-mechanisms",
          slug: "attention-mechanisms",
          parentClassificationId: undefined,
          legacyIds: undefined,
        },
      },
    });

    await expect(
      loadRegistry({
        registryRoot: join(fixtureRoot, "invalid-classification-id"),
      }),
    ).rejects.toMatchObject({
      name: "RegistryLoadError",
      details: expect.arrayContaining([
        expect.objectContaining({
          type: "parse-error",
          message: expect.stringContaining(
            "classification id must use the canonical dotted namespace format",
          ),
        }),
      ]),
    });
  });

  test("rejects classifications whose parentClassificationId skips the direct namespace parent", async () => {
    await writeMinimalRegistry("invalid-classification-parent", {
      classifications: {
        "concept.json": {
          ...validClassificationRecord,
          id: "classification.concept",
          slug: "concept",
          aliases: [],
          classificationType: "domain",
          classifiesKinds: ["concept"],
          parentClassificationId: undefined,
          legacyIds: undefined,
        },
        "attention.json": {
          ...validClassificationRecord,
          id: "classification.concept.attention",
          slug: "attention-mechanisms",
          parentClassificationId: "classification.concept",
          legacyIds: ["classification.attention-mechanisms"],
        },
        "grouped-query.json": {
          ...validClassificationRecord,
          id: "classification.concept.attention.grouped-query",
          slug: "attention-grouped-query",
          parentClassificationId: "classification.concept",
          legacyIds: undefined,
        },
      },
    });

    await expect(
      loadRegistry({
        registryRoot: join(fixtureRoot, "invalid-classification-parent"),
      }),
    ).rejects.toMatchObject({
      name: "RegistryLoadError",
      details: expect.arrayContaining([
        expect.objectContaining({
          type: "parse-error",
          message: expect.stringContaining(
            'must reference its direct namespace parent "classification.concept.attention"',
          ),
        }),
      ]),
    });
  });

  test("throws structured duplicate-id errors", async () => {
    const duplicateConcept = {
      ...validConceptRecord,
      slug: "grouped-query-attention-alt",
    };
    await writeMinimalRegistry("duplicate-id", {
      concepts: {
        "concept-a.json": validConceptRecord,
        "concept-b.json": duplicateConcept,
      },
      classifications: {
        "attention.json": {
          ...validClassificationRecord,
          parentClassificationId: undefined,
          legacyIds: undefined,
        },
      },
      tags: { "attention.json": validTagRecord },
      citations: { "gqa-paper.json": validCitationRecord },
    });

    await expect(
      loadRegistry({ registryRoot: join(fixtureRoot, "duplicate-id") }),
    ).rejects.toMatchObject({
      name: "RegistryLoadError",
      details: [
        {
          type: "duplicate-id",
          id: "concept.grouped-query-attention",
        },
      ],
    });
  });

  test("throws structured duplicate-slug errors", async () => {
    const duplicateSlugConcept = {
      ...validConceptRecord,
      id: "concept.grouped-query-attention-copy",
    };
    await writeMinimalRegistry("duplicate-slug", {
      concepts: {
        "concept-a.json": validConceptRecord,
        "concept-b.json": duplicateSlugConcept,
      },
      classifications: {
        "attention.json": {
          ...validClassificationRecord,
          parentClassificationId: undefined,
          legacyIds: undefined,
        },
      },
      tags: { "attention.json": validTagRecord },
      citations: { "gqa-paper.json": validCitationRecord },
    });

    try {
      await loadRegistry({ registryRoot: join(fixtureRoot, "duplicate-slug") });
      expect.unreachable("expected duplicate slug error");
    } catch (error) {
      expect(error).toBeInstanceOf(RegistryLoadError);
      const loadError = error as RegistryLoadError;
      expect(loadError.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "duplicate-slug",
            slug: "grouped-query-attention",
          }),
        ]),
      );
    }
  });
});
