import { describe, expect, test } from "bun:test";
import {
  baseRecordSchema,
  citationRecordSchema,
  classificationRecordSchema,
  conceptRecordSchema,
  documentationRecordSchema,
  guideRecordSchema,
  pageAssetConfigSchema,
  pageFrontmatterSchema,
  pageKindSchema,
  pageMessagesSchema,
  registryKindSchema,
  registryRecordSchema,
  tagRecordSchema,
  techniqueRecordSchema,
} from "./schemas";
import { validateSidebarGroupingForRecord } from "./sidebar-grouping";

const validBaseFields = {
  id: "concept.grouped-query-attention",
  slug: "grouped-query-attention",
  defaultTitleKey: "title",
  defaultSummaryKey: "description",
  aliases: ["GQA"],
  tags: ["attention"],
  relatedIds: [],
  citationIds: ["citation.gqa-paper"],
  status: "published" as const,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-02T00:00:00.000Z",
  sortOrder: 10,
};

describe("registry schemas", () => {
  test("accepts a valid tag record", () => {
    const result = tagRecordSchema.safeParse({
      ...validBaseFields,
      id: "tag.attention",
      slug: "attention",
      kind: "tag",
      category: "module-type",
      landingPage: "generated-tag-page",
    });
    expect(result.success).toBe(true);
  });

  test("accepts a valid citation record", () => {
    const result = citationRecordSchema.safeParse({
      ...validBaseFields,
      id: "citation.gqa-paper",
      slug: "gqa-paper",
      kind: "citation",
      citationType: "paper",
      authors: ["Ainslie et al."],
      title: "GQA: Training Generalized Multi-Query Transformer Models",
      url: "https://arxiv.org/abs/2305.13245",
      mla: 'Ainslie, Joshua, et al. "GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints." arXiv, 2023.',
      year: 2023,
    });
    expect(result.success).toBe(true);
  });

  test("accepts a valid concept record", () => {
    const result = conceptRecordSchema.safeParse({
      ...validBaseFields,
      id: "concept.token",
      slug: "token",
      kind: "concept",
      conceptType: "architecture",
      prerequisiteIds: [],
      explainsIds: [],
      sidebarGrouping: {
        glossary: "sequence-and-attention",
      },
    });
    expect(result.success).toBe(true);
  });

  test("accepts a valid classification record", () => {
    const result = classificationRecordSchema.safeParse({
      ...validBaseFields,
      id: "classification.concept.activation",
      slug: "activation-functions",
      kind: "classification",
      classificationType: "family",
      classifiesKinds: ["concept"],
      parentClassificationId: "classification.concept",
      legacyIds: ["classification.activation-functions"],
    });
    expect(result.success).toBe(true);
  });

  test("parses registry records through the kind discriminated union", () => {
    const result = registryRecordSchema.safeParse({
      ...validBaseFields,
      id: "tag.attention",
      slug: "attention",
      kind: "tag",
      category: "module-type",
      landingPage: "generated-tag-page",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("tag");
    }
  });

  test("rejects base records missing required fields", () => {
    const result = baseRecordSchema.safeParse({
      id: "concept.incomplete",
      kind: "concept",
    });
    expect(result.success).toBe(false);
  });

  test("rejects concept records missing conceptType or relationship arrays", () => {
    const result = conceptRecordSchema.safeParse({
      ...validBaseFields,
      id: "concept.token",
      slug: "token",
      kind: "concept",
    });
    expect(result.success).toBe(false);
  });

  test("accepts ontology metadata on participating records", () => {
    const result = conceptRecordSchema.safeParse({
      ...validBaseFields,
      kind: "concept",
      conceptType: "architecture",
      prerequisiteIds: [],
      explainsIds: [],
      primaryClassificationId: "classification.concept.activation",
      secondaryClassificationIds: ["classification.concept.architecture"],
      relationships: [
        {
          relationshipType: "uses",
          targetId: "concept.activation",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  test("rejects malformed ontology relationships", () => {
    const result = conceptRecordSchema.safeParse({
      ...validBaseFields,
      kind: "concept",
      conceptType: "architecture",
      prerequisiteIds: [],
      explainsIds: [],
      relationships: [
        {
          relationshipType: "uses",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  test("reports unsupported sidebar grouping values with record id and value", () => {
    const issues = validateSidebarGroupingForRecord(
      "concept",
      "concept.grouped-query-attention",
      {
        primaryClassificationId: "classification.concept.architecture",
        sidebarGrouping: {
          concepts: "wrong-group" as never,
        },
      },
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("concept.grouped-query-attention");
    expect(issues[0]?.message).toContain('"wrong-group"');
  });

  test("reports sidebar grouping sections that are not recognized at all", () => {
    const issues = validateSidebarGroupingForRecord(
      "concept",
      "concept.grouped-query-attention",
      {
        sidebarGrouping: {
          // @ts-expect-error unrecognized sidebar grouping section
          training: "alignment",
        },
      },
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("concept.grouped-query-attention");
    expect(issues[0]?.message).toContain(
      'unsupported sidebarGrouping section "training"',
    );
  });

  test("rejects redundant sidebar grouping overrides when ontology already resolves placement", () => {
    const issues = validateSidebarGroupingForRecord("concept", "concept.gelu", {
      primaryClassificationId: "classification.concept.inference",
      sidebarGrouping: {
        concepts: "inference",
      },
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("concept.gelu");
    expect(issues[0]?.message).toContain(
      'sidebarGrouping.concepts = "inference"',
    );
  });

  test("allows explicit sidebar overrides only when ontology is still too coarse", () => {
    const issues = validateSidebarGroupingForRecord(
      "concept",
      "concept.attention",
      {
        primaryClassificationId: "classification.concept.architecture",
        sidebarGrouping: {
          concepts: "long-context",
        },
      },
    );
    expect(issues).toHaveLength(0);
  });

  test("rejects tag records missing category and landingPage", () => {
    const result = tagRecordSchema.safeParse({
      ...validBaseFields,
      id: "tag.attention",
      slug: "attention",
      kind: "tag",
    });
    expect(result.success).toBe(false);
  });

  test("rejects citation records missing authors, title, url, or mla", () => {
    const result = citationRecordSchema.safeParse({
      ...validBaseFields,
      id: "citation.gqa-paper",
      slug: "gqa-paper",
      kind: "citation",
      citationType: "paper",
      authors: [],
      title: "",
      url: "not-a-url",
      mla: "",
    });
    expect(result.success).toBe(false);
  });

  test("accepts CLI guide, technique, and documentation registry kinds", () => {
    for (const [kind, schema] of [
      ["guide", guideRecordSchema],
      ["technique", techniqueRecordSchema],
      ["documentation", documentationRecordSchema],
    ] as const) {
      const result = schema.safeParse({
        ...validBaseFields,
        id: `${kind}.example`,
        slug: "example",
        kind,
      });
      expect(result.success).toBe(true);
      expect(registryKindSchema.safeParse(kind).success).toBe(true);
      expect(
        registryRecordSchema.safeParse({
          ...validBaseFields,
          id: `${kind}.example`,
          slug: "example",
          kind,
        }).success,
      ).toBe(true);
    }
  });

  test("rejects unknown registry kinds", () => {
    expect(registryKindSchema.safeParse("not-a-kind").success).toBe(false);
    expect(
      registryRecordSchema.safeParse({
        ...validBaseFields,
        id: "unknown.example",
        slug: "example",
        kind: "not-a-kind",
      }).success,
    ).toBe(false);
  });

  test("rejects retired Atlas product registry kinds", () => {
    for (const kind of [
      "model",
      "module",
      "paper",
      "training-regime",
      "system",
    ] as const) {
      expect(registryKindSchema.safeParse(kind).success).toBe(false);
    }
  });
});

const validConceptFrontmatter = {
  kind: "concept" as const,
  registryId: "concept.grouped-query-attention",
  messageNamespace: "local" as const,
  assetNamespace: "local" as const,
  tags: ["attention", "kv-cache"],
  status: "published" as const,
  updatedAt: "2026-06-02",
};

const validPageMessages = {
  title: "Grouped-Query Attention",
  description: "An attention variant that reduces KV cache memory.",
  problemStatement: "KV caches get expensive as context length grows.",
  coreIdea: "GQA lets several query heads share fewer key-value heads.",
  sections: {
    whatItIs: {
      title: "What It Is",
      body: "Grouped-query attention is an attention variant derived from multi-head attention.",
    },
  },
  callouts: {
    readerShortcut: {
      title: "Reader Shortcut",
      body: "Think of GQA as sharing KV heads across query groups.",
    },
  },
  assets: {
    computeFlow: {
      alt: "Compute flow diagram",
      caption: "How GQA routes queries to shared KV heads",
    },
  },
};

const validPageAssetConfig = {
  hero: {
    type: "image" as const,
    src: "./assets/gqa-hero.png",
    altKey: "assets.hero.alt",
  },
  computeFlow: {
    type: "graph" as const,
    graphId: "graph.grouped-query-attention-compute-flow",
    webRenderer: "react-flow" as const,
    printRenderer: "mermaid" as const,
    altKey: "assets.computeFlow.alt",
    captionKey: "assets.computeFlow.caption",
  },
  mhaComparison: {
    type: "chart" as const,
    chartId: "chart.gqa-mha-comparison",
    altKey: "assets.mhaComparison.alt",
  },
  variantTable: {
    type: "table" as const,
    tableId: "table.gqa-variants",
    captionKey: "assets.variantTable.caption",
  },
  computeSchema: {
    type: "code-schema" as const,
    schemaId: "schema.gqa-compute",
    language: "typescript",
    captionKey: "assets.computeSchema.caption",
  },
};

describe("page schemas", () => {
  test("accepts valid concept page frontmatter", () => {
    const result = pageFrontmatterSchema.safeParse(validConceptFrontmatter);
    expect(result.success).toBe(true);
  });

  test("accepts CLI collection page kinds and rejects unknown kinds", () => {
    for (const kind of [
      "guide",
      "concept",
      "technique",
      "documentation",
    ] as const) {
      expect(pageKindSchema.safeParse(kind).success).toBe(true);
      expect(
        pageFrontmatterSchema.safeParse({
          ...validConceptFrontmatter,
          kind,
          registryId: `${kind}.example`,
        }).success,
      ).toBe(true);
    }

    expect(pageKindSchema.safeParse("not-a-kind").success).toBe(false);
    expect(
      pageFrontmatterSchema.safeParse({
        ...validConceptFrontmatter,
        kind: "not-a-kind",
      }).success,
    ).toBe(false);

    for (const kind of [
      "model",
      "module",
      "paper",
      "training-regime",
      "system",
    ] as const) {
      expect(pageKindSchema.safeParse(kind).success).toBe(false);
    }
  });

  test("accepts valid page messages with nested sections and asset keys", () => {
    const result = pageMessagesSchema.safeParse(validPageMessages);
    expect(result.success).toBe(true);
  });

  test("accepts valid page asset config with discriminated asset types", () => {
    const result = pageAssetConfigSchema.safeParse(validPageAssetConfig);
    expect(result.success).toBe(true);
  });

  test("rejects concept frontmatter missing required fields", () => {
    const result = pageFrontmatterSchema.safeParse({
      kind: "concept",
      registryId: "concept.grouped-query-attention",
    });
    expect(result.success).toBe(false);
  });

  test("rejects page messages missing title or description", () => {
    const result = pageMessagesSchema.safeParse({
      title: "",
      description: "",
      sections: {
        whatItIs: {
          title: "What It Is",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  test("rejects page messages with sections missing title", () => {
    const result = pageMessagesSchema.safeParse({
      title: "Grouped-Query Attention",
      description: "An attention variant.",
      sections: {
        whatItIs: {
          body: "Missing section title",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  test("rejects asset config with missing required keys per type", () => {
    const imageResult = pageAssetConfigSchema.safeParse({
      hero: {
        type: "image",
        src: "./assets/gqa-hero.png",
      },
    });
    expect(imageResult.success).toBe(false);

    const graphResult = pageAssetConfigSchema.safeParse({
      computeFlow: {
        type: "graph",
        graphId: "graph.example",
        webRenderer: "react-flow",
      },
    });
    expect(graphResult.success).toBe(false);

    const chartResult = pageAssetConfigSchema.safeParse({
      chart: {
        type: "chart",
      },
    });
    expect(chartResult.success).toBe(false);
  });
});
