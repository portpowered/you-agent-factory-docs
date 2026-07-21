import { describe, expect, test } from "bun:test";
import {
  attributeDefSchema,
  attributeDefsFileSchema,
  orchestratorRecordSchema,
} from "./orchestrators";

const minimalAttributeDefsFile = {
  attributes: [
    {
      id: "attr.open-source",
      labelKey: "attr.openSource",
      type: "boolean" as const,
      filterable: true,
      sortable: true,
      order: 10,
    },
    {
      id: "attr.license",
      labelKey: "attr.license",
      type: "string" as const,
      filterable: true,
      sortable: true,
      order: 20,
    },
    {
      id: "attr.hosting",
      labelKey: "attr.hosting",
      type: "single-tag" as const,
      tagEnum: ["local", "cloud", "hybrid"],
      filterable: true,
      sortable: true,
      order: 30,
    },
    {
      id: "attr.capabilities",
      labelKey: "attr.capabilities",
      type: "multi-tag" as const,
      tagEnum: ["loops", "worktrees", "mcp"],
      filterable: true,
      sortable: false,
      order: 40,
    },
  ],
};

const minimalOrchestrator = {
  id: "orchestrator.you-agent-factory",
  kind: "orchestrator" as const,
  name: "you-agent-factory",
  attributes: {
    "attr.open-source": true,
    "attr.license": "MIT",
    "attr.hosting": "local",
    "attr.capabilities": ["loops", "worktrees"],
  },
};

describe("orchestrator registry schemas", () => {
  test("accepts a minimal valid attribute-defs object", () => {
    const result = attributeDefsFileSchema.safeParse(minimalAttributeDefsFile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attributes).toHaveLength(4);
      expect(result.data.attributes[0]?.type).toBe("boolean");
      expect(result.data.attributes[2]?.tagEnum).toEqual([
        "local",
        "cloud",
        "hybrid",
      ]);
    }
  });

  test("accepts a minimal valid orchestrator object", () => {
    const result = orchestratorRecordSchema.safeParse(minimalOrchestrator);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("orchestrator");
      expect(result.data.name).toBe("you-agent-factory");
      expect(result.data.attributes["attr.open-source"]).toBe(true);
    }
  });

  test("accepts optional tags and defaultSummaryKey on orchestrator records", () => {
    const result = orchestratorRecordSchema.safeParse({
      ...minimalOrchestrator,
      tags: ["agent-factory"],
      defaultSummaryKey: "summary",
    });
    expect(result.success).toBe(true);
  });

  test("rejects an orchestrator with the wrong kind", () => {
    const result = orchestratorRecordSchema.safeParse({
      ...minimalOrchestrator,
      kind: "technique",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an orchestrator missing name", () => {
    const { name: _name, ...withoutName } = minimalOrchestrator;
    const result = orchestratorRecordSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  test("rejects tag-typed attribute defs without tagEnum", () => {
    const result = attributeDefSchema.safeParse({
      id: "attr.hosting",
      labelKey: "attr.hosting",
      type: "single-tag",
      filterable: true,
      sortable: true,
      order: 1,
    });
    expect(result.success).toBe(false);
  });

  test("rejects tag-typed attribute defs with an empty tagEnum", () => {
    const result = attributeDefSchema.safeParse({
      id: "attr.capabilities",
      labelKey: "attr.capabilities",
      type: "multi-tag",
      tagEnum: [],
      filterable: true,
      sortable: false,
      order: 2,
    });
    expect(result.success).toBe(false);
  });

  test("rejects an unknown attribute type", () => {
    const result = attributeDefSchema.safeParse({
      id: "attr.score",
      labelKey: "attr.score",
      type: "number",
      filterable: true,
      sortable: true,
      order: 1,
    });
    expect(result.success).toBe(false);
  });
});
