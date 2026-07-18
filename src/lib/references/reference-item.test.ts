import { describe, expect, test } from "bun:test";
import {
  createReferenceItem,
  deserializeReferenceItem,
  isReferenceFamily,
  isReferenceLifecycleState,
  parseReferenceItem,
  REFERENCE_FAMILIES,
  REFERENCE_LIFECYCLE_STATES,
  type ReferenceItem,
  ReferenceItemParseError,
  serializeReferenceItem,
} from "./reference-item";

function sampleItem(overrides: Partial<ReferenceItem> = {}): ReferenceItem {
  return {
    id: "openapi.operation.submitWorkBySessionId",
    family: "api",
    title: "Submit work by session id",
    description: "Enqueue work for an existing session.",
    lifecycle: {
      state: "active",
      since: "0.0.0",
    },
    source: {
      publicArtifactId: "@you-agent-factory/api/openapi",
      pointer: "/paths/~1sessions~1{sessionId}~1work/post",
      path: "generated/openapi/openapi.yaml",
    },
    aliases: ["submitWorkBySessionId", "submit-work"],
    anchor: "submitWorkBySessionId",
    ...overrides,
  };
}

describe("REFERENCE_FAMILIES", () => {
  test("covers API/OpenAPI, schema, CLI, MCP, JavaScript, and events", () => {
    expect([...REFERENCE_FAMILIES]).toEqual([
      "api",
      "schema",
      "cli",
      "mcp",
      "javascript",
      "events",
    ]);

    for (const family of REFERENCE_FAMILIES) {
      expect(isReferenceFamily(family)).toBe(true);
    }
    expect(isReferenceFamily("config")).toBe(false);
    expect(isReferenceFamily("shared")).toBe(false);
    expect(isReferenceFamily("openapi")).toBe(false);
  });
});

describe("REFERENCE_LIFECYCLE_STATES", () => {
  test("exposes active, deprecated, and removed states", () => {
    expect([...REFERENCE_LIFECYCLE_STATES]).toEqual([
      "active",
      "deprecated",
      "removed",
    ]);
    expect(isReferenceLifecycleState("active")).toBe(true);
    expect(isReferenceLifecycleState("unknown")).toBe(false);
  });
});

describe("createReferenceItem / parseReferenceItem", () => {
  test("builds a plain object with shared identity fields", () => {
    const item = createReferenceItem(sampleItem());

    expect(item.id).toBe("openapi.operation.submitWorkBySessionId");
    expect(item.family).toBe("api");
    expect(item.title).toBe("Submit work by session id");
    expect(item.description).toBe("Enqueue work for an existing session.");
    expect(item.lifecycle).toEqual({ state: "active", since: "0.0.0" });
    expect(item.source).toEqual({
      publicArtifactId: "@you-agent-factory/api/openapi",
      pointer: "/paths/~1sessions~1{sessionId}~1work/post",
      path: "generated/openapi/openapi.yaml",
    });
    expect(item.aliases).toEqual(["submitWorkBySessionId", "submit-work"]);
    expect(item.anchor).toBe("submitWorkBySessionId");
    expect(Object.getPrototypeOf(item)).toBe(Object.prototype);
  });

  test("allows missing description without inventing contract text", () => {
    const { description: _omitted, ...withoutDescription } = sampleItem();
    const item = createReferenceItem(withoutDescription);

    expect(item.description).toBeUndefined();
    expect("description" in item).toBe(false);
  });

  test("accepts every reference family for later page surfaces", () => {
    for (const family of REFERENCE_FAMILIES) {
      const item = createReferenceItem(
        sampleItem({
          id: `${family}.sample`,
          family,
          title: `${family} sample`,
          anchor: `${family}-sample`,
        }),
      );
      expect(item.family).toBe(family);
    }
  });

  test("source pointer names public artifact identity and location", () => {
    const item = createReferenceItem(
      sampleItem({
        family: "cli",
        id: "cli.command.run",
        title: "you run",
        source: {
          publicArtifactId: "cli",
          pointer: "/commands/0",
          path: "generated/cli/commands.json",
        },
        anchor: "you-run",
        aliases: [],
      }),
    );

    expect(item.source.publicArtifactId).toBe("cli");
    expect(item.source.pointer).toBe("/commands/0");
    expect(item.source.path).toBe("generated/cli/commands.json");
  });

  test("rejects unsupported families and malformed required fields", () => {
    expect(() =>
      parseReferenceItem({
        ...sampleItem(),
        family: "openapi",
      }),
    ).toThrow(ReferenceItemParseError);

    try {
      parseReferenceItem({
        ...sampleItem(),
        family: "openapi",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ReferenceItemParseError);
      const parseError = error as ReferenceItemParseError;
      expect(parseError.code).toBe("unsupported-family");
      expect(parseError.field).toBe("family");
    }

    expect(() => parseReferenceItem({ ...sampleItem(), id: "" })).toThrow(
      /field "id"/,
    );
    expect(() =>
      parseReferenceItem({
        ...sampleItem(),
        source: { publicArtifactId: "openapi", pointer: "" },
      }),
    ).toThrow(/source\.pointer/);
  });
});

describe("serializeReferenceItem / deserializeReferenceItem", () => {
  test("JSON round-trips without functions or class instances", () => {
    const original = createReferenceItem(sampleItem());
    const json = serializeReferenceItem(original);
    const restored = deserializeReferenceItem(json);

    expect(JSON.parse(json)).toEqual(original);
    expect(restored).toEqual(original);
    expect(Object.getPrototypeOf(restored)).toBe(Object.prototype);
    expect(restored instanceof Object).toBe(true);
    expect(typeof restored).toBe("object");
  });

  test("round-trips optional-absent description and empty aliases", () => {
    const { description: _omitted, ...withoutDescription } = sampleItem({
      aliases: [],
      lifecycle: { state: "deprecated", deprecated: "0.0.0" },
    });
    const original = createReferenceItem(withoutDescription);
    const restored = deserializeReferenceItem(serializeReferenceItem(original));

    expect(restored).toEqual(original);
    expect(restored.description).toBeUndefined();
    expect(restored.aliases).toEqual([]);
    expect(restored.lifecycle.state).toBe("deprecated");
  });

  test("rejects non-JSON text with an actionable parse error", () => {
    expect(() => deserializeReferenceItem("{not-json")).toThrow(
      ReferenceItemParseError,
    );
  });
});
