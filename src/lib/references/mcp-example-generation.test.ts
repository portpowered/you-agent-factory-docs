import { describe, expect, test } from "bun:test";
import {
  generateSchemaValidMcpExample,
  mcpExampleConformsToInputSchema,
  resolveMcpToolExample,
  valueForSchemaField,
} from "./mcp-example-generation";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "./schema-model";

function controlSchema() {
  return createSchemaDefinitionModel({
    address: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/0/inputSchema",
    },
    type: "object",
    required: ["sessionId", "operation"],
    additionalProperties: false,
    properties: {
      sessionId: createSchemaFieldModel({
        path: "sessionId",
        typeSummary: "string",
        required: true,
        address: {
          publicArtifactId: "@you-agent-factory/api/mcp",
          pointer: "/tools/0/inputSchema/properties/sessionId",
        },
      }),
      operation: createSchemaFieldModel({
        path: "operation",
        typeSummary: "string",
        required: true,
        enum: ["APPROVE", "PAUSE", "RESUME"],
        address: {
          publicArtifactId: "@you-agent-factory/api/mcp",
          pointer: "/tools/0/inputSchema/properties/operation",
        },
      }),
      reason: createSchemaFieldModel({
        path: "reason",
        typeSummary: "string",
        required: false,
        address: {
          publicArtifactId: "@you-agent-factory/api/mcp",
          pointer: "/tools/0/inputSchema/properties/reason",
        },
      }),
    },
  });
}

describe("valueForSchemaField", () => {
  test("prefers const, then default, then first enum, then type placeholders", () => {
    expect(
      valueForSchemaField(
        createSchemaFieldModel({
          path: "mode",
          required: true,
          const: "final",
          typeSummary: "string",
        }),
      ),
    ).toBe("final");
    expect(
      valueForSchemaField(
        createSchemaFieldModel({
          path: "includeArtifacts",
          required: false,
          default: true,
          typeSummary: "boolean",
        }),
      ),
    ).toBe(true);
    expect(
      valueForSchemaField(
        createSchemaFieldModel({
          path: "operation",
          required: true,
          enum: ["APPROVE", "PAUSE"],
          typeSummary: "string",
        }),
      ),
    ).toBe("APPROVE");
    expect(
      valueForSchemaField(
        createSchemaFieldModel({
          path: "sessionId",
          required: true,
          typeSummary: "string",
        }),
      ),
    ).toBe("example-sessionId");
    expect(
      valueForSchemaField(
        createSchemaFieldModel({
          path: "count",
          required: true,
          typeSummary: "integer",
        }),
      ),
    ).toBe(0);
  });
});

describe("generateSchemaValidMcpExample", () => {
  test("includes required fields, first enum values, and omits optional keys", () => {
    const example = generateSchemaValidMcpExample(controlSchema());
    expect(example).toEqual({
      sessionId: "example-sessionId",
      operation: "APPROVE",
    });
    expect(example).not.toHaveProperty("reason");
  });

  test("returns empty object when only optional properties exist", () => {
    const definition = createSchemaDefinitionModel({
      address: {
        publicArtifactId: "@you-agent-factory/api/mcp",
        pointer: "/tools/3/inputSchema",
      },
      type: "object",
      additionalProperties: false,
      properties: {
        scope: createSchemaFieldModel({
          path: "scope",
          typeSummary: "string",
          required: false,
          enum: ["live", "persisted", "all"],
          address: {
            publicArtifactId: "@you-agent-factory/api/mcp",
            pointer: "/tools/3/inputSchema/properties/scope",
          },
        }),
      },
    });

    expect(generateSchemaValidMcpExample(definition)).toEqual({});
  });

  test("never invents unpublished keys on closed objects", () => {
    const example = generateSchemaValidMcpExample(controlSchema());
    const conform = mcpExampleConformsToInputSchema(example, controlSchema());
    expect(conform).toEqual({ ok: true });
  });
});

describe("mcpExampleConformsToInputSchema", () => {
  test("rejects missing required fields and out-of-enum values", () => {
    expect(
      mcpExampleConformsToInputSchema({ sessionId: "x" }, controlSchema()).ok,
    ).toBe(false);
    expect(
      mcpExampleConformsToInputSchema(
        { sessionId: "x", operation: "NOPE" },
        controlSchema(),
      ).ok,
    ).toBe(false);
    expect(
      mcpExampleConformsToInputSchema(
        { sessionId: "x", operation: "APPROVE", extra: true },
        controlSchema(),
      ).ok,
    ).toBe(false);
  });
});

describe("resolveMcpToolExample", () => {
  test("prefers authored tool.example and does not mark it generated", () => {
    const authored = { sessionId: "sess_authored", operation: "PAUSE" };
    const resolved = resolveMcpToolExample({
      example: authored,
      inputSchema: controlSchema(),
    });
    expect(resolved).toEqual({ origin: "authored", value: authored });
  });

  test("prefers authored inputSchema.examples over generation", () => {
    const authored = { sessionId: "sess_schema", operation: "RESUME" };
    const base = controlSchema();
    const resolved = resolveMcpToolExample({
      inputSchema: createSchemaDefinitionModel({
        address: base.address,
        type: base.type,
        required: base.required,
        additionalProperties: base.additionalProperties,
        properties: base.properties,
        examples: [authored],
      }),
    });
    expect(resolved).toEqual({ origin: "authored", value: authored });
  });

  test("generates a labeled illustration when no authored example exists", () => {
    const resolved = resolveMcpToolExample({ inputSchema: controlSchema() });
    expect(resolved.origin).toBe("generated");
    if (resolved.origin !== "generated") {
      throw new Error("expected generated origin");
    }
    expect(
      mcpExampleConformsToInputSchema(resolved.value, controlSchema()),
    ).toEqual({ ok: true });
  });

  test("returns none when neither authored example nor object schema exist", () => {
    expect(resolveMcpToolExample({})).toEqual({ origin: "none" });
  });
});
