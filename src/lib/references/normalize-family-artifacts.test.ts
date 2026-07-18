import { describe, expect, test } from "bun:test";
import { resolveApiPackageArtifact } from "./api-package-artifact-resolver";
import {
  FamilyArtifactNormalizeError,
  normalizeCliCommandsFromArtifact,
  normalizeEventTypesFromOpenApiArtifact,
  normalizeJavascriptSymbolsFromArtifact,
  normalizeMcpToolsFromArtifact,
  normalizeOpenApiOperationsFromArtifact,
} from "./normalize-family-artifacts";

describe("normalizeOpenApiOperationsFromArtifact", () => {
  test("normalizes fixture-shaped OpenAPI paths into operation summaries", () => {
    const fixture = {
      openapi: "3.0.3",
      paths: {
        "/factory-sessions/{session_id}/work": {
          post: {
            operationId: "submitWorkBySessionId",
            summary: "Submit work for one session",
            description: "Submits one work item.",
            tags: ["Work"],
          },
          parameters: [{ name: "session_id", in: "path" }],
        },
        "/events": {
          get: {
            summary: "Stream process-global factory events",
          },
        },
      },
    };

    const operations = normalizeOpenApiOperationsFromArtifact(fixture);

    expect(operations).toHaveLength(2);

    const submit = operations.find(
      (op) => op.operationId === "submitWorkBySessionId",
    );
    expect(submit).toMatchObject({
      id: "submitWorkBySessionId",
      method: "post",
      path: "/factory-sessions/{session_id}/work",
      summary: "Submit work for one session",
      description: "Submits one work item.",
      tags: ["Work"],
      anchor: "submitWorkBySessionId",
      source: {
        publicArtifactId: "@you-agent-factory/api/openapi",
        pointer: "/paths/~1factory-sessions~1{session_id}~1work/post",
      },
    });

    const events = operations.find((op) => op.path === "/events");
    expect(events?.operationId).toBeUndefined();
    expect(events?.description).toBeUndefined();
    expect(events?.tags).toBeUndefined();
    expect(events?.id).toBe("openapi.operation.get:/events");
    expect(events?.anchor).toBe("get-events");
  });

  test("consumes W03-resolved OpenAPI public-subpath data", () => {
    const artifact = resolveApiPackageArtifact("openapi");
    const operations = normalizeOpenApiOperationsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });

    expect(operations.length).toBeGreaterThan(10);
    const submit = operations.find(
      (op) => op.operationId === "submitWorkBySessionId",
    );
    expect(submit?.method).toBe("post");
    expect(submit?.path).toBe("/factory-sessions/{session_id}/work");
    expect(submit?.source.publicArtifactId).toBe(
      "@you-agent-factory/api/openapi",
    );
    expect(submit?.tags).toContain("Work");
  });
});

describe("normalizeCliCommandsFromArtifact", () => {
  test("normalizes fixture-shaped CLI commands and omits empty descriptions", () => {
    const fixture = {
      formatVersion: "cli-command-identity/v1",
      rootPath: "you",
      commands: [
        {
          idCandidate: "you",
          name: "you",
          path: "you",
          aliases: [],
          short: "Run and manage factories",
          long: "",
          lifecycle: "active",
        },
        {
          idCandidate: "you.config.init",
          name: "init",
          path: "you config init",
          aliases: ["bootstrap"],
          short: "",
          long: "",
          lifecycle: "active",
        },
      ],
    };

    const commands = normalizeCliCommandsFromArtifact(fixture);
    expect(commands).toHaveLength(2);
    expect(commands[0]).toMatchObject({
      id: "you",
      commandPath: "you",
      description: "Run and manage factories",
      shortDescription: "Run and manage factories",
      lifecycle: { state: "active" },
      anchor: "you",
    });
    expect(commands[1].description).toBeUndefined();
    expect(commands[1].aliases).toEqual(["bootstrap"]);
    expect(commands[1].anchor).toBe("you-config-init");
  });

  test("preserves example, visibility, runnable, and handler metadata when published", () => {
    const fixture = {
      formatVersion: "cli-command-identity/v1",
      rootPath: "you",
      commands: [
        {
          idCandidate: "you",
          name: "you",
          path: "you",
          aliases: [],
          short: "Run factories",
          long: "Run factories with a longer help block.",
          example: "  you docs agents",
          visibility: "visible",
          lifecycle: "active",
          runnable: true,
          handlerPresent: true,
        },
        {
          idCandidate: "you.mcp",
          name: "mcp",
          path: "you mcp",
          aliases: [],
          short: "MCP servers",
          long: "",
          example: "",
          visibility: "visible",
          lifecycle: "active",
          runnable: false,
          handlerPresent: false,
        },
      ],
    };

    const commands = normalizeCliCommandsFromArtifact(fixture);
    expect(commands[0]).toMatchObject({
      shortDescription: "Run factories",
      longDescription: "Run factories with a longer help block.",
      example: "you docs agents",
      visibility: "visible",
      runnable: true,
      handlerPresent: true,
    });
    expect(commands[1].example).toBeUndefined();
    expect(commands[1].runnable).toBe(false);
    expect(commands[1].handlerPresent).toBe(false);
  });

  test("consumes W03-resolved CLI public-subpath data", () => {
    const artifact = resolveApiPackageArtifact("cli");
    const commands = normalizeCliCommandsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });

    expect(commands.length).toBeGreaterThan(5);
    const init = commands.find((command) => command.id === "you.config.init");
    expect(init?.commandPath).toBe("you config init");
    expect(init?.description).toBeTruthy();
    expect(init?.source.publicArtifactId).toBe("@you-agent-factory/api/cli");
    expect(init?.visibility).toBe("visible");
    expect(typeof init?.runnable).toBe("boolean");
    expect(typeof init?.handlerPresent).toBe("boolean");
  });
});

describe("normalizeMcpToolsFromArtifact", () => {
  test("normalizes fixture-shaped MCP tools and leaves missing description absent", () => {
    const fixture = {
      formatVersion: "1",
      tools: [
        {
          idCandidate: "factory-session.get",
          name: "you.factory_session.get",
          description: "Get one durable Factory Session.",
        },
        {
          idCandidate: "factory-session.control",
          name: "you.factory_session.control",
          description: "",
        },
      ],
    };

    const tools = normalizeMcpToolsFromArtifact(fixture);
    expect(tools).toHaveLength(2);
    expect(tools[0].description).toBe("Get one durable Factory Session.");
    expect(tools[1].description).toBeUndefined();
    expect(tools[0].lifecycle).toBeUndefined();
  });

  test("consumes W03-resolved MCP public-subpath data", () => {
    const artifact = resolveApiPackageArtifact("mcp");
    const tools = normalizeMcpToolsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });

    expect(tools.length).toBeGreaterThan(3);
    const get = tools.find((tool) => tool.id === "factory-session.get");
    expect(get?.name).toBe("you.factory_session.get");
    expect(get?.source.publicArtifactId).toBe("@you-agent-factory/api/mcp");
  });
});

describe("normalizeJavascriptSymbolsFromArtifact", () => {
  test("normalizes fixture-shaped JavaScript symbols with nested documentation", () => {
    const fixture = {
      formatVersion: "1.0.0",
      symbols: {
        "javascript.log": {
          id: "javascript.log",
          name: "log",
          path: "log",
          kind: "function",
          documentation: {
            documentation: {
              description: {
                canonicalEnglish: "Emits one workflow-scoped log record.",
              },
            },
          },
          lifecycle: { state: "active", since: "1.0.0" },
        },
        "javascript.args": {
          id: "javascript.args",
          name: "args",
          path: "args",
          kind: "value",
          lifecycle: { state: "active" },
        },
      },
    };

    const symbols = normalizeJavascriptSymbolsFromArtifact(fixture);
    expect(symbols).toHaveLength(2);
    const log = symbols.find((symbol) => symbol.id === "javascript.log");
    expect(log).toMatchObject({
      name: "log",
      symbolPath: "log",
      kind: "function",
      description: "Emits one workflow-scoped log record.",
      lifecycle: { state: "active", since: "1.0.0" },
    });
    const args = symbols.find((symbol) => symbol.id === "javascript.args");
    expect(args?.description).toBeUndefined();
  });

  test("consumes W03-resolved JavaScript runtime public-subpath data", () => {
    const artifact = resolveApiPackageArtifact("javascript/runtime");
    const symbols = normalizeJavascriptSymbolsFromArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });

    expect(symbols.length).toBeGreaterThan(5);
    const log = symbols.find((symbol) => symbol.id === "javascript.log");
    expect(log?.kind).toBe("function");
    expect(log?.description).toBeTruthy();
    expect(log?.source.publicArtifactId).toBe(
      "@you-agent-factory/api/javascript/runtime",
    );
  });
});

describe("normalizeEventTypesFromOpenApiArtifact", () => {
  test("normalizes FactoryEvent discriminator mappings without inventing descriptions", () => {
    const fixture = {
      components: {
        schemas: {
          FactoryEvent: {
            type: "object",
            discriminator: {
              propertyName: "type",
              mapping: {
                RUN_REQUEST: "#/components/schemas/RunRequestEventPayload",
                SESSION_STARTED:
                  "#/components/schemas/SessionStartedEventPayload",
              },
            },
          },
        },
      },
    };

    const events = normalizeEventTypesFromOpenApiArtifact(fixture);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      id: "events.RUN_REQUEST",
      eventType: "RUN_REQUEST",
      payloadSchemaRef: "#/components/schemas/RunRequestEventPayload",
      anchor: "RUN_REQUEST",
    });
    expect(events[0].description).toBeUndefined();
  });

  test("consumes W03-resolved OpenAPI data for event discriminator mappings", () => {
    const artifact = resolveApiPackageArtifact("openapi");
    const events = normalizeEventTypesFromOpenApiArtifact(artifact.data, {
      publicArtifactId: artifact.specifier,
    });

    expect(events.length).toBeGreaterThan(10);
    const runRequest = events.find(
      (event) => event.eventType === "RUN_REQUEST",
    );
    expect(runRequest?.payloadSchemaRef).toContain("RunRequestEventPayload");
    expect(runRequest?.source.pointer).toContain("FactoryEvent");
  });

  test("fails closed on malformed CLI commands array", () => {
    expect(() =>
      normalizeCliCommandsFromArtifact({ commands: "not-an-array" }),
    ).toThrow(FamilyArtifactNormalizeError);
  });
});
