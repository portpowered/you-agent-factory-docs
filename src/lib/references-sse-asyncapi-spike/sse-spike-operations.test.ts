import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import {
  type OpenApiLike,
  observeSseOperationsFromOpenApi,
  packagedOpenApiRetainsSseOperations,
} from "./observe-sse-operations";
import { SseSpikeSurfaceChrome } from "./SseSpikeSurfaceChrome";
import {
  SSE_SPIKE_API_PAGE_OPERATIONS,
  SSE_SPIKE_DOCUMENT_ID,
  SSE_SPIKE_OPENAPI_EXPORT,
  SSE_SPIKE_OPERATIONS,
  SSE_SPIKE_ROUTE,
  SSE_SPIKE_SAFETY,
  SSE_SPIKE_STATUS,
} from "./sse-operations";

function parsePackagedOpenApi(): OpenApiLike {
  const artifact = loadPackagedOpenApiArtifact();
  return Bun.YAML.parse(artifact.rawText) as OpenApiLike;
}

describe("W02 SSE spike — three operations from unmodified OpenAPI", () => {
  test("marks the spike as temporary non-production", () => {
    expect(SSE_SPIKE_STATUS).toBe("non-production-temporary");
  });

  test("loads OpenAPI from the installed @you-agent-factory/api public export", () => {
    const artifact = loadPackagedOpenApiArtifact();

    expect(artifact.specifier).toBe(SSE_SPIKE_OPENAPI_EXPORT);
    expect(artifact.absolutePath).toContain("@you-agent-factory/api");
    expect(artifact.absolutePath.endsWith("openapi.yaml")).toBe(true);
    expect(artifact.rawText).toContain("openapi:");
    expect(artifact.rawText).toContain("text/event-stream");
    expect(artifact.rawText).toContain("x-event-schema");
  });

  test("packaged OpenAPI retains all three SSE operations without rewrite", () => {
    const doc = parsePackagedOpenApi();

    expect(packagedOpenApiRetainsSseOperations(doc)).toBe(true);

    const observed = observeSseOperationsFromOpenApi(doc);
    expect(observed).toHaveLength(3);

    expect(observed.map((entry) => entry.role)).toEqual([
      "canonical",
      "ephemeral",
      "compatibility-only",
    ]);
    expect(observed.map((entry) => entry.path)).toEqual([
      "/factory-sessions/{session_id}/events",
      "/factory-sessions/{session_id}/response-events",
      "/events",
    ]);
    expect(observed.map((entry) => entry.operationId)).toEqual([
      "getEventsBySessionId",
      "getFactoryResponseEventsBySessionId",
      "getEvents",
    ]);

    for (const entry of observed) {
      expect(entry.hasTextEventStream).toBe(true);
      expect(typeof entry.xEventSchema).toBe("string");
    }
  });

  test("API page operations list matches the three inventory paths", () => {
    expect(SSE_SPIKE_DOCUMENT_ID).toBe("factory");
    expect(SSE_SPIKE_API_PAGE_OPERATIONS).toEqual([
      { path: "/factory-sessions/{session_id}/events", method: "get" },
      {
        path: "/factory-sessions/{session_id}/response-events",
        method: "get",
      },
      { path: "/events", method: "get" },
    ]);
    expect(SSE_SPIKE_OPERATIONS).toHaveLength(3);
  });

  test("spike safety contract forbids live connection, proxy, and playground", () => {
    expect(SSE_SPIKE_SAFETY.opensLiveFactoryConnection).toBe(false);
    expect(SSE_SPIKE_SAFETY.addsProxyRoute).toBe(false);
    expect(SSE_SPIKE_SAFETY.enablesLiveRequestPlayground).toBe(false);
    expect(SSE_SPIKE_SAFETY.playgroundEnabled).toBe(false);
    expect(SSE_SPIKE_SAFETY.proxyUrl).toBeUndefined();
  });

  test("spike surface chrome renders three distinct role-labeled operations", () => {
    const html = renderToStaticMarkup(
      createElement(
        SseSpikeSurfaceChrome,
        null,
        createElement("div", {
          "data-testid": "native-render-slot",
        }),
      ),
    );

    expect(html).toContain(`data-sse-spike-route="${SSE_SPIKE_ROUTE}"`);
    expect(html).toContain('data-sse-spike-live-connection="false"');
    expect(html).toContain('data-sse-spike-proxy="false"');
    expect(html).toContain('data-sse-spike-playground="false"');
    expect(html).toContain("does not open a live Factory connection");
    expect(html).toContain("does not add a proxy");
    expect(html).toContain("does not enable a live request playground");

    expect(html).toContain('data-sse-spike-operation="getEventsBySessionId"');
    expect(html).toContain(
      'data-sse-spike-operation="getFactoryResponseEventsBySessionId"',
    );
    expect(html).toContain('data-sse-spike-operation="getEvents"');
    expect(html).toContain('data-sse-spike-role="canonical"');
    expect(html).toContain('data-sse-spike-role="ephemeral"');
    expect(html).toContain('data-sse-spike-role="compatibility-only"');
    expect(html).toContain("/factory-sessions/{session_id}/events");
    expect(html).toContain("/factory-sessions/{session_id}/response-events");
    expect(html).toContain('data-sse-spike-path="/events"');
  });
});
