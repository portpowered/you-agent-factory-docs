import { describe, expect, test } from "bun:test";
import {
  McpInputSchemaProjectionError,
  projectMcpInputSchemaToDefinition,
  requiredInputsFromDefinition,
  typeSummaryFromJsonSchemaProperty,
} from "./mcp-input-schema-projection";

const ADDRESS = {
  publicArtifactId: "@you-agent-factory/api/mcp",
  pointer: "/tools/0/inputSchema",
};

describe("typeSummaryFromJsonSchemaProperty", () => {
  test("summarizes published primitive and array types", () => {
    expect(typeSummaryFromJsonSchemaProperty({ type: "string" })).toBe(
      "string",
    );
    expect(
      typeSummaryFromJsonSchemaProperty({
        type: "array",
        items: { type: "string" },
      }),
    ).toBe("string[]");
    expect(
      typeSummaryFromJsonSchemaProperty({ type: ["string", "null"] }),
    ).toBe("string | null");
  });

  test("leaves type absent when unpublished", () => {
    expect(typeSummaryFromJsonSchemaProperty({})).toBeUndefined();
  });

  test("surfaces published $ref when type is absent", () => {
    expect(
      typeSummaryFromJsonSchemaProperty({
        $ref: "#/sharedSchemas/javascript.schema.json_compatible/schema",
      }),
    ).toBe("#/sharedSchemas/javascript.schema.json_compatible/schema");
  });
});

describe("projectMcpInputSchemaToDefinition", () => {
  test("projects published MCP inputSchema into SchemaDefinitionModel", () => {
    const definition = projectMcpInputSchemaToDefinition(
      {
        type: "object",
        additionalProperties: false,
        required: ["sessionId", "operation"],
        properties: {
          sessionId: {
            type: "string",
            description: "Stable durable Factory Session identifier.",
          },
          operation: {
            type: "string",
            enum: ["APPROVE", "PAUSE"],
            description: "Lifecycle control operation.",
          },
          reason: {
            type: "string",
            description: "Optional operator-provided reason.",
          },
        },
      },
      {
        address: ADDRESS,
        title: "you.factory_session.control input",
      },
    );

    expect(definition).toBeDefined();
    expect(definition?.type).toBe("object");
    expect(definition?.additionalProperties).toBe(false);
    expect(definition?.required).toEqual(["sessionId", "operation"]);
    expect(definition?.properties?.sessionId).toMatchObject({
      path: "sessionId",
      typeSummary: "string",
      required: true,
      description: "Stable durable Factory Session identifier.",
    });
    expect(definition?.properties?.operation?.enum).toEqual([
      "APPROVE",
      "PAUSE",
    ]);
    expect(definition?.properties?.reason?.required).toBe(false);
    expect(requiredInputsFromDefinition(definition)).toEqual([
      "sessionId",
      "operation",
    ]);
  });

  test("returns undefined when inputSchema is absent", () => {
    expect(
      projectMcpInputSchemaToDefinition(undefined, { address: ADDRESS }),
    ).toBeUndefined();
  });

  test("rejects non-object inputSchema", () => {
    expect(() =>
      projectMcpInputSchemaToDefinition("not-an-object", {
        address: ADDRESS,
      }),
    ).toThrow(McpInputSchemaProjectionError);
  });

  test("does not invent required lists when unpublished", () => {
    const definition = projectMcpInputSchemaToDefinition(
      {
        type: "object",
        properties: {
          scope: { type: "string" },
        },
      },
      { address: ADDRESS },
    );
    expect(definition?.required).toBeUndefined();
    expect(requiredInputsFromDefinition(definition)).toBeUndefined();
    expect(definition?.properties?.scope?.required).toBe(false);
  });

  test("projects authored examples and property const when published", () => {
    const authored = { sessionId: "sess_1" };
    const definition = projectMcpInputSchemaToDefinition(
      {
        type: "object",
        additionalProperties: false,
        required: ["sessionId"],
        properties: {
          sessionId: { type: "string", const: "fixed-session" },
        },
        examples: [authored],
      },
      { address: ADDRESS },
    );

    expect(definition?.examples).toEqual([authored]);
    expect(definition?.properties?.sessionId?.const).toBe("fixed-session");
  });
});
