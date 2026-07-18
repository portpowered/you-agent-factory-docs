import { describe, expect, test } from "bun:test";
import { loadApiOpenApiArtifact } from "./load-openapi-artifact";
import { buildApiOperationDetailsFromArtifact } from "./load-operation-details";
import { buildApiOperationNavigationFromArtifact } from "./load-operation-navigation";
import {
  apiMediaTypeKindLabel,
  classifyApiMediaType,
  countApiOperationsWithAuthoredExamples,
  countApiOperationsWithEventStream,
  projectApiOperationDetail,
  projectApiOperationDetailsFromDocument,
  resolveOpenApiParameter,
} from "./operation-detail";

describe("classifyApiMediaType", () => {
  test("distinguishes JSON, event-stream, and other media types", () => {
    expect(classifyApiMediaType("application/json")).toBe("json");
    expect(classifyApiMediaType("application/problem+json")).toBe("json");
    expect(classifyApiMediaType("text/event-stream")).toBe("event-stream");
    expect(classifyApiMediaType("text/plain")).toBe("other");
    expect(apiMediaTypeKindLabel("event-stream")).toBe("Server-Sent Events");
    expect(apiMediaTypeKindLabel("json")).toBe("JSON");
  });
});

describe("resolveOpenApiParameter", () => {
  test("shallow-resolves component parameter refs", () => {
    const document = {
      components: {
        parameters: {
          SessionID: {
            name: "session_id",
            in: "path",
            required: true,
            description: "Session id",
            schema: { type: "string" },
          },
        },
      },
    };

    expect(
      resolveOpenApiParameter(document, {
        $ref: "#/components/parameters/SessionID",
      }),
    ).toEqual({
      name: "session_id",
      location: "path",
      required: true,
      description: "Session id",
      typeSummary: "string",
    });
  });
});

describe("projectApiOperationDetail", () => {
  test("projects parameters, body, responses, and authored examples only", () => {
    const document = {
      paths: {
        "/items/{id}": {
          get: {
            operationId: "getItem",
            summary: "Get item",
            description: "Fetch one item",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Item" },
                    examples: {
                      sample: {
                        summary: "Sample item",
                        value: { id: "1", name: "alpha" },
                      },
                    },
                  },
                },
              },
              "204": {
                description: "No content",
              },
            },
          },
          post: {
            operationId: "createItem",
            summary: "Create item",
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: { type: "object" },
                  example: { name: "beta" },
                },
              },
            },
            responses: {
              "201": {
                description: "Created",
                content: {
                  "application/json": {
                    schema: { type: "object" },
                  },
                },
              },
            },
          },
        },
        "/events": {
          get: {
            operationId: "getEvents",
            summary: "Compatibility stream",
            responses: {
              "200": {
                description: "SSE",
                content: {
                  "text/event-stream": {
                    schema: { type: "string" },
                  },
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Recovery",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const getItem = projectApiOperationDetail(document, "/items/{id}", "get");
    expect(getItem).toMatchObject({
      method: "get",
      path: "/items/{id}",
      operationId: "getItem",
      anchor: "getItem",
      summary: "Get item",
      description: "Fetch one item",
    });
    expect(getItem?.parameters).toEqual([
      {
        name: "id",
        location: "path",
        required: true,
        typeSummary: "string",
      },
    ]);
    expect(getItem?.requestBody).toBeUndefined();
    expect(getItem?.responses[0]?.mediaTypes[0]).toMatchObject({
      mediaType: "application/json",
      kind: "json",
      typeSummary: "Item",
      schemaRef: "#/components/schemas/Item",
    });
    expect(getItem?.responses[0]?.mediaTypes[0]?.examples).toEqual([
      {
        id: "sample",
        label: "Sample item",
        language: "json",
        code: JSON.stringify({ id: "1", name: "alpha" }, null, 2),
      },
    ]);
    expect(getItem?.responses[1]?.mediaTypes).toEqual([]);

    const createItem = projectApiOperationDetail(
      document,
      "/items/{id}",
      "post",
    );
    expect(createItem?.requestBody?.required).toBe(true);
    expect(createItem?.requestBody?.mediaTypes[0]?.examples).toEqual([
      {
        id: "example",
        label: "Example",
        language: "json",
        code: JSON.stringify({ name: "beta" }, null, 2),
      },
    ]);
    // No fabricated response example when the document omits one.
    expect(createItem?.responses[0]?.mediaTypes[0]?.examples).toEqual([]);

    const events = projectApiOperationDetail(document, "/events", "get");
    expect(events?.responses[0]?.mediaTypes.map((m) => m.kind)).toEqual([
      "event-stream",
      "json",
    ]);

    const all = projectApiOperationDetailsFromDocument(document);
    expect(all).toHaveLength(3);
    expect(countApiOperationsWithAuthoredExamples(all)).toBe(2);
    expect(countApiOperationsWithEventStream(all)).toBe(1);
  });

  test("does not invent examples when media objects omit them", () => {
    const detail = projectApiOperationDetail(
      {
        paths: {
          "/plain": {
            get: {
              operationId: "plain",
              responses: {
                "200": {
                  content: {
                    "application/json": {
                      schema: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/plain",
      "get",
    );
    expect(detail?.responses[0]?.mediaTypes[0]?.examples).toEqual([]);
  });
});

describe("buildApiOperationDetailsFromArtifact", () => {
  test("projects live package inventory with SSE and authored examples", () => {
    const projection = buildApiOperationDetailsFromArtifact();
    const nav = buildApiOperationNavigationFromArtifact();
    const loaded = loadApiOpenApiArtifact();

    expect(projection.operationCount).toBe(nav.model.operationCount);
    expect(projection.operationsWithEventStream).toBe(3);
    expect(projection.operationsWithAuthoredExamples).toBeGreaterThanOrEqual(1);

    const submit = projection.byAnchor.get("submitWorkBySessionId");
    expect(submit).toBeDefined();
    expect(submit?.method).toBe("post");
    expect(submit?.parameters.some((p) => p.name === "session_id")).toBe(true);
    expect(submit?.requestBody?.mediaTypes[0]?.mediaType).toBe(
      "application/json",
    );

    const sse = projection.byAnchor.get("getEventsBySessionId");
    expect(sse?.responses[0]?.mediaTypes.map((m) => m.kind).sort()).toEqual([
      "event-stream",
      "json",
    ]);

    const close = projection.byAnchor.get("closeFactorySession");
    expect(close?.requestBody).toBeUndefined();
    expect(
      close?.responses.some(
        (r) => r.statusCode === "204" && r.mediaTypes.length === 0,
      ),
    ).toBe(true);

    // Every nav anchor has a detail section.
    for (const group of nav.model.groups) {
      for (const item of group.items) {
        expect(projection.byAnchor.has(item.anchor)).toBe(true);
      }
    }

    // Authored examples stay present when published in the package document.
    const withExamples = projection.details.filter((detail) =>
      [
        ...(detail.requestBody?.mediaTypes ?? []),
        ...detail.responses.flatMap((r) => r.mediaTypes),
      ].some((m) => m.examples.length > 0),
    );
    expect(withExamples.length).toBe(projection.operationsWithAuthoredExamples);
    expect(loaded.document).toBeDefined();
  });
});
