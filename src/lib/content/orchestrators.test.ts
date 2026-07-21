import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getRegistryRoot } from "./content-paths";
import {
  type AttributeDef,
  attributeDefSchema,
  attributeDefsFileSchema,
  type OrchestratorAttributeValue,
  orchestratorRecordSchema,
} from "./orchestrators";

const orchestratorsRegistryDir = join(getRegistryRoot(), "orchestrators");

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function valueMatchesAttributeDef(
  def: AttributeDef,
  value: OrchestratorAttributeValue,
): boolean {
  switch (def.type) {
    case "boolean":
      return typeof value === "boolean";
    case "string":
      return typeof value === "string";
    case "single-tag":
      return (
        typeof value === "string" && (def.tagEnum?.includes(value) ?? false)
      );
    case "multi-tag":
      return (
        Array.isArray(value) &&
        value.every(
          (tag) =>
            typeof tag === "string" && (def.tagEnum?.includes(tag) ?? false),
        )
      );
    default: {
      const _exhaustive: never = def.type;
      return _exhaustive;
    }
  }
}

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

describe("committed orchestrator registry seed JSON", () => {
  test("attribute-defs.json covers all four locked types with attr.* ids", () => {
    const parsed = attributeDefsFileSchema.safeParse(
      readJsonFile(join(orchestratorsRegistryDir, "attribute-defs.json")),
    );
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    const types = new Set(parsed.data.attributes.map((def) => def.type));
    expect(types).toEqual(
      new Set(["boolean", "string", "single-tag", "multi-tag"]),
    );
    for (const def of parsed.data.attributes) {
      expect(def.id.startsWith("attr.")).toBe(true);
      expect(typeof def.labelKey).toBe("string");
      expect(typeof def.filterable).toBe("boolean");
      expect(typeof def.sortable).toBe("boolean");
      expect(typeof def.order).toBe("number");
      if (def.type === "single-tag" || def.type === "multi-tag") {
        expect(def.tagEnum?.length).toBeGreaterThan(0);
      }
    }
  });

  test("orchestrator.*.json seeds parse and agree with attribute defs", () => {
    const defsParsed = attributeDefsFileSchema.safeParse(
      readJsonFile(join(orchestratorsRegistryDir, "attribute-defs.json")),
    );
    expect(defsParsed.success).toBe(true);
    if (!defsParsed.success) {
      return;
    }

    const defsById = new Map(
      defsParsed.data.attributes.map((def) => [def.id, def]),
    );
    const recordFiles = readdirSync(orchestratorsRegistryDir).filter(
      (name) => name.startsWith("orchestrator.") && name.endsWith(".json"),
    );
    expect(recordFiles.length).toBeGreaterThanOrEqual(2);

    for (const fileName of recordFiles) {
      const recordParsed = orchestratorRecordSchema.safeParse(
        readJsonFile(join(orchestratorsRegistryDir, fileName)),
      );
      expect(recordParsed.success).toBe(true);
      if (!recordParsed.success) {
        continue;
      }

      const record = recordParsed.data;
      expect(record.id.startsWith("orchestrator.")).toBe(true);
      expect(record.kind).toBe("orchestrator");

      for (const [attributeId, value] of Object.entries(record.attributes)) {
        const def = defsById.get(attributeId);
        expect(def).toBeDefined();
        if (!def) {
          continue;
        }
        expect(valueMatchesAttributeDef(def, value)).toBe(true);
      }
    }
  });
});
