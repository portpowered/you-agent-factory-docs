import { describe, expect, test } from "bun:test";
import {
  type CliCommandNormalized,
  createCliCommandNormalized,
  createEventTypeNormalized,
  createJavascriptSharedSchemaNormalized,
  createJavascriptSymbolNormalized,
  createMcpToolNormalized,
  createOpenApiOperationSummary,
  deserializeCliCommandNormalized,
  deserializeEventTypeNormalized,
  deserializeJavascriptSymbolNormalized,
  deserializeMcpToolNormalized,
  deserializeOpenApiOperationSummary,
  type EventTypeNormalized,
  encodeJsonPointerSegment,
  FamilyNormalizedModelParseError,
  isOpenApiHttpMethod,
  type JavascriptSymbolNormalized,
  type McpToolNormalized,
  OPENAPI_HTTP_METHODS,
  type OpenApiOperationSummary,
  parseOpenApiOperationSummary,
  provisionalAnchorFromIdentity,
  serializeCliCommandNormalized,
  serializeEventTypeNormalized,
  serializeJavascriptSymbolNormalized,
  serializeMcpToolNormalized,
  serializeOpenApiOperationSummary,
} from "./family-normalized-models";
import { createSchemaDefinitionModel } from "./schema-model";

const OPENAPI_ARTIFACT = "@you-agent-factory/api/openapi";

function sampleOperation(
  overrides: Partial<OpenApiOperationSummary> = {},
): OpenApiOperationSummary {
  return {
    id: "submitWorkBySessionId",
    operationId: "submitWorkBySessionId",
    method: "post",
    path: "/factory-sessions/{session_id}/work",
    summary: "Submit work for one session",
    description: "Submits one work item to the selected live factory session.",
    tags: ["Work"],
    source: {
      publicArtifactId: OPENAPI_ARTIFACT,
      pointer: "/paths/~1factory-sessions~1{session_id}~1work/post",
    },
    anchor: "submitWorkBySessionId",
    ...overrides,
  };
}

function sampleCli(
  overrides: Partial<CliCommandNormalized> = {},
): CliCommandNormalized {
  return {
    id: "you.config.init",
    name: "init",
    commandPath: "you config init",
    aliases: [],
    description: "Create operator/system config on a fresh home",
    lifecycle: { state: "active" },
    source: {
      publicArtifactId: "@you-agent-factory/api/cli",
      pointer: "/commands/2",
    },
    anchor: "you-config-init",
    ...overrides,
  };
}

function sampleMcp(
  overrides: Partial<McpToolNormalized> = {},
): McpToolNormalized {
  return {
    id: "factory-session.get",
    name: "you.factory_session.get",
    description: "Get one durable Factory Session inspection read model.",
    source: {
      publicArtifactId: "@you-agent-factory/api/mcp",
      pointer: "/tools/1",
    },
    anchor: "you.factory_session.get",
    ...overrides,
  };
}

function sampleJs(
  overrides: Partial<JavascriptSymbolNormalized> = {},
): JavascriptSymbolNormalized {
  return {
    id: "javascript.log",
    name: "log",
    symbolPath: "log",
    kind: "function",
    description: "Synchronously emits one workflow-scoped log record.",
    visibility: "public",
    examples: ['log("checkpoint", { step: 1 })'],
    sharedSchemaLinks: [
      {
        schemaId: "javascript.schema.json_compatible",
        ref: "#/sharedSchemas/javascript.schema.json_compatible/schema",
        anchor: "javascript.schema.json_compatible",
      },
    ],
    lifecycle: { state: "active", since: "1.0.0" },
    source: {
      publicArtifactId: "@you-agent-factory/api/javascript/runtime",
      pointer: "/symbols/javascript.log",
    },
    anchor: "javascript.log",
    ...overrides,
  };
}

function sampleEvent(
  overrides: Partial<EventTypeNormalized> = {},
): EventTypeNormalized {
  return {
    id: "events.RUN_REQUEST",
    eventType: "RUN_REQUEST",
    payloadSchemaRef: "#/components/schemas/RunRequestEventPayload",
    source: {
      publicArtifactId: OPENAPI_ARTIFACT,
      pointer:
        "/components/schemas/FactoryEvent/discriminator/mapping/RUN_REQUEST",
    },
    anchor: "RUN_REQUEST",
    ...overrides,
  };
}

describe("OPENAPI_HTTP_METHODS", () => {
  test("covers standard OpenAPI path-item methods", () => {
    expect([...OPENAPI_HTTP_METHODS]).toEqual([
      "get",
      "put",
      "post",
      "delete",
      "options",
      "head",
      "patch",
      "trace",
    ]);
    expect(isOpenApiHttpMethod("post")).toBe(true);
    expect(isOpenApiHttpMethod("POST")).toBe(false);
    expect(isOpenApiHttpMethod("connect")).toBe(false);
  });
});

describe("OpenApiOperationSummary", () => {
  test("builds a plain object with identity, method, path, tags, and source/anchor slots", () => {
    const model = createOpenApiOperationSummary(sampleOperation());

    expect(model.id).toBe("submitWorkBySessionId");
    expect(model.operationId).toBe("submitWorkBySessionId");
    expect(model.method).toBe("post");
    expect(model.path).toBe("/factory-sessions/{session_id}/work");
    expect(model.summary).toBe("Submit work for one session");
    expect(model.tags).toEqual(["Work"]);
    expect(model.source.publicArtifactId).toBe(OPENAPI_ARTIFACT);
    expect(model.anchor).toBe("submitWorkBySessionId");
    expect(Object.getPrototypeOf(model)).toBe(Object.prototype);
  });

  test("leaves missing optional contract fields absent rather than inventing them", () => {
    const {
      operationId: _oid,
      summary: _summary,
      description: _description,
      tags: _tags,
      ...minimal
    } = sampleOperation();
    const model = createOpenApiOperationSummary(minimal);

    expect(model.operationId).toBeUndefined();
    expect(model.summary).toBeUndefined();
    expect(model.description).toBeUndefined();
    expect(model.tags).toBeUndefined();
    expect("description" in model).toBe(false);
  });

  test("rejects unsupported HTTP methods", () => {
    expect(() =>
      parseOpenApiOperationSummary({
        ...sampleOperation(),
        method: "connect",
      }),
    ).toThrow(FamilyNormalizedModelParseError);
  });

  test("JSON round-trips without class instances", () => {
    const original = createOpenApiOperationSummary(sampleOperation());
    const restored = deserializeOpenApiOperationSummary(
      serializeOpenApiOperationSummary(original),
    );
    expect(restored).toEqual(original);
  });
});

describe("CliCommandNormalized / McpToolNormalized / JavascriptSymbolNormalized / EventTypeNormalized", () => {
  test("CLI model exposes command path, description, lifecycle, and source/anchor slots", () => {
    const model = createCliCommandNormalized(sampleCli());
    expect(model.commandPath).toBe("you config init");
    expect(model.description).toBe(
      "Create operator/system config on a fresh home",
    );
    expect(model.lifecycle).toEqual({ state: "active" });
    expect(model.anchor).toBe("you-config-init");
  });

  test("CLI model preserves optional published metadata fields", () => {
    const model = createCliCommandNormalized(
      sampleCli({
        shortDescription: "Short help",
        longDescription: "Long help",
        example: "  you config init",
        visibility: "visible",
        runnable: true,
        handlerPresent: false,
      }),
    );
    expect(model.shortDescription).toBe("Short help");
    expect(model.longDescription).toBe("Long help");
    expect(model.example).toBe("  you config init");
    expect(model.visibility).toBe("visible");
    expect(model.runnable).toBe(true);
    expect(model.handlerPresent).toBe(false);
  });

  test("MCP model exposes tool name and leaves lifecycle absent when unpublished", () => {
    const model = createMcpToolNormalized(sampleMcp());
    expect(model.name).toBe("you.factory_session.get");
    expect(model.lifecycle).toBeUndefined();
    expect("lifecycle" in model).toBe(false);
  });

  test("MCP model preserves optional published handler and input schema fields", () => {
    const model = createMcpToolNormalized(
      sampleMcp({
        handlerRegistered: true,
        requiredInputs: ["sessionId"],
        inputSchema: {
          address: {
            publicArtifactId: "@you-agent-factory/api/mcp",
            pointer: "/tools/1/inputSchema",
          },
          type: "object",
          required: ["sessionId"],
          properties: {
            sessionId: {
              path: "sessionId",
              typeSummary: "string",
              required: true,
            },
          },
        },
      }),
    );
    expect(model.handlerRegistered).toBe(true);
    expect(model.requiredInputs).toEqual(["sessionId"]);
    expect(model.inputSchema?.type).toBe("object");
    expect(model.inputSchema?.properties?.sessionId?.typeSummary).toBe(
      "string",
    );
  });

  test("JavaScript model exposes symbol path and kind", () => {
    const model = createJavascriptSymbolNormalized(sampleJs());
    expect(model.symbolPath).toBe("log");
    expect(model.kind).toBe("function");
    expect(model.visibility).toBe("public");
    expect(model.examples).toEqual(['log("checkpoint", { step: 1 })']);
    expect(model.sharedSchemaLinks?.[0]?.schemaId).toBe(
      "javascript.schema.json_compatible",
    );
  });

  test("JavaScript shared schema model exposes schema projection", () => {
    const model = createJavascriptSharedSchemaNormalized({
      id: "javascript.schema.checkpoint_spec",
      name: "checkpoint_spec",
      title: "Checkpoint specification object",
      schema: createSchemaDefinitionModel({
        address: {
          publicArtifactId: "@you-agent-factory/api/javascript/runtime",
          pointer: "/sharedSchemas/javascript.schema.checkpoint_spec/schema",
        },
        type: "object",
        required: ["label"],
      }),
      source: {
        publicArtifactId: "@you-agent-factory/api/javascript/runtime",
        pointer: "/sharedSchemas/javascript.schema.checkpoint_spec",
      },
      anchor: "javascript.schema.checkpoint_spec",
    });
    expect(model.schema?.type).toBe("object");
    expect(model.schema?.required).toEqual(["label"]);
  });

  test("event model exposes event type and payload schema ref", () => {
    const model = createEventTypeNormalized(sampleEvent());
    expect(model.eventType).toBe("RUN_REQUEST");
    expect(model.payloadSchemaRef).toBe(
      "#/components/schemas/RunRequestEventPayload",
    );
  });

  test("each family model JSON round-trips", () => {
    const cli = createCliCommandNormalized(sampleCli());
    expect(
      deserializeCliCommandNormalized(serializeCliCommandNormalized(cli)),
    ).toEqual(cli);

    const mcp = createMcpToolNormalized(sampleMcp());
    expect(
      deserializeMcpToolNormalized(serializeMcpToolNormalized(mcp)),
    ).toEqual(mcp);

    const js = createJavascriptSymbolNormalized(sampleJs());
    expect(
      deserializeJavascriptSymbolNormalized(
        serializeJavascriptSymbolNormalized(js),
      ),
    ).toEqual(js);

    const event = createEventTypeNormalized(sampleEvent());
    expect(
      deserializeEventTypeNormalized(serializeEventTypeNormalized(event)),
    ).toEqual(event);
  });
});

describe("provisionalAnchorFromIdentity / encodeJsonPointerSegment", () => {
  test("builds URL-safe provisional anchors", () => {
    expect(provisionalAnchorFromIdentity("submitWorkBySessionId")).toBe(
      "submitWorkBySessionId",
    );
    expect(provisionalAnchorFromIdentity("you config init")).toBe(
      "you-config-init",
    );
    expect(provisionalAnchorFromIdentity("you.factory_session.get")).toBe(
      "you.factory_session.get",
    );
  });

  test("encodes JSON Pointer segments", () => {
    expect(
      encodeJsonPointerSegment("/factory-sessions/{session_id}/work"),
    ).toBe("~1factory-sessions~1{session_id}~1work");
  });
});
