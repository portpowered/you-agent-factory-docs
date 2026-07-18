/**
 * Story 004 — focused tests for temporary AsyncAPI projector selection path.
 *
 * Proves:
 * - packaged OpenAPI is the sole input
 * - selection walks path → operation → status → text/event-stream
 * - payload roots resolve from x-event-schema (not hard-coded schema names)
 * - compatibility GET /events is labeled compatibility-only / non-preferred
 * - hard-coded-name-only selection is rejected as the spike mechanism
 */

import { describe, expect, test } from "bun:test";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import type { OpenApiLike } from "./observe-sse-operations";
import {
  ASYNCAPI_GENERATED_FILE_NOTICE,
  channelIdForSelectedStream,
  messageIdForSelectedStream,
  projectOpenApiSseToAsyncApi,
} from "./project-openapi-to-asyncapi";
import {
  resolvePayloadRootFromXEventSchema,
  SelectSseStreamsError,
  selectSseStreamFromOpenApi,
  selectSseStreamsByHardCodedSchemaNamesOnly,
  selectSseStreamsFromOpenApi,
} from "./select-sse-streams";
import {
  SSE_SPIKE_OPENAPI_EXPORT,
  SSE_SPIKE_OPERATIONS,
  type SseSpikeOperation,
} from "./sse-operations";

function parsePackagedOpenApi(): OpenApiLike {
  const artifact = loadPackagedOpenApiArtifact();
  return Bun.YAML.parse(artifact.rawText) as OpenApiLike;
}

/** Clone packaged OpenAPI and rewrite one path's x-event-schema + schema name. */
function withRenamedPayloadRoot(
  doc: OpenApiLike,
  path: string,
  newSchemaName: string,
): OpenApiLike {
  const clone = structuredClone(doc) as OpenApiLike & {
    components?: { schemas?: Record<string, unknown> };
  };
  const media =
    clone.paths?.[path]?.get?.responses?.["200"]?.content?.[
      "text/event-stream"
    ];
  if (!media) {
    throw new Error(`missing text/event-stream on ${path}`);
  }

  const previousRef = media["x-event-schema"];
  if (typeof previousRef !== "string") {
    throw new Error(`missing x-event-schema on ${path}`);
  }
  const previousName = previousRef.replace("#/components/schemas/", "");
  const schemas = clone.components?.schemas ?? {};
  const previousSchema = schemas[previousName];
  if (!previousSchema) {
    throw new Error(`missing schema ${previousName}`);
  }

  schemas[newSchemaName] = previousSchema;
  delete schemas[previousName];
  media["x-event-schema"] = `#/components/schemas/${newSchemaName}`;
  clone.components = { ...(clone.components ?? {}), schemas };
  return clone;
}

describe("W02 SSE spike — AsyncAPI projector selection path (004)", () => {
  test("projector input is the packaged OpenAPI public artifact only", () => {
    const artifact = loadPackagedOpenApiArtifact();
    expect(artifact.specifier).toBe(SSE_SPIKE_OPENAPI_EXPORT);
    expect(artifact.rawText).toContain("x-event-schema");

    const doc = Bun.YAML.parse(artifact.rawText) as OpenApiLike;
    const projection = projectOpenApiSseToAsyncApi(doc);

    expect(projection.asyncapi.info["x-generated-from"]).toBe(
      "packaged-openapi",
    );
    expect(projection.asyncapi.info.description).toBe(
      ASYNCAPI_GENERATED_FILE_NOTICE,
    );
    expect(projection.generatedFileNotice).toContain("Do not hand-edit");
    expect(projection.generatedFileNotice).toContain("Regenerate");
  });

  test("selects all three streams by path/operation/status/media-type", () => {
    const doc = parsePackagedOpenApi();
    const selected = selectSseStreamsFromOpenApi(doc);

    expect(selected).toHaveLength(3);
    expect(selected.map((s) => s.path)).toEqual([
      "/factory-sessions/{session_id}/events",
      "/factory-sessions/{session_id}/response-events",
      "/events",
    ]);
    expect(selected.map((s) => s.operationId)).toEqual([
      "getEventsBySessionId",
      "getFactoryResponseEventsBySessionId",
      "getEvents",
    ]);
    for (const stream of selected) {
      expect(stream.method).toBe("get");
      expect(stream.status).toBe("200");
      expect(stream.mediaType).toBe("text/event-stream");
    }
  });

  test("payload roots resolve from x-event-schema, not hard-coded names", () => {
    const doc = parsePackagedOpenApi();
    const selected = selectSseStreamsFromOpenApi(doc);

    expect(selected[0]?.payloadRootRef).toBe(
      "#/components/schemas/FactoryEvent",
    );
    expect(selected[1]?.payloadRootRef).toBe(
      "#/components/schemas/FactoryResponseEvent",
    );
    expect(selected[2]?.payloadRootRef).toBe(
      "#/components/schemas/FactoryEvent",
    );

    // Renaming the schema component + updating x-event-schema must change the
    // resolved root. Selection must not keep looking for "FactoryEvent" by name.
    const renamed = withRenamedPayloadRoot(
      doc,
      "/factory-sessions/{session_id}/events",
      "RenamedSessionEventEnvelope",
    );
    const renamedSelected = selectSseStreamFromOpenApi(
      renamed,
      SSE_SPIKE_OPERATIONS[0],
    );
    expect(renamedSelected.payloadRootRef).toBe(
      "#/components/schemas/RenamedSessionEventEnvelope",
    );
    expect(renamedSelected.payloadRootSchemaName).toBe(
      "RenamedSessionEventEnvelope",
    );

    const projection = projectOpenApiSseToAsyncApi(renamed);
    const messageId = messageIdForSelectedStream(renamedSelected);
    expect(
      projection.asyncapi.components.messages[messageId]?.payload.$ref,
    ).toBe("#/components/schemas/RenamedSessionEventEnvelope");
  });

  test("canonical and ephemeral are preferred; compatibility GET /events is labeled non-preferred", () => {
    const doc = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc);
    const byRole = Object.fromEntries(
      projection.selectedStreams.map((s) => [s.role, s]),
    );

    expect(byRole.canonical?.preferred).toBe(true);
    expect(byRole.canonical?.compatibilityLabel).toBe("preferred");
    expect(byRole.ephemeral?.preferred).toBe(true);
    expect(byRole.ephemeral?.compatibilityLabel).toBe("preferred");
    const compatibilityOnly = byRole["compatibility-only"];
    expect(compatibilityOnly).toBeDefined();
    if (!compatibilityOnly) {
      throw new Error("expected compatibility-only stream");
    }
    expect(compatibilityOnly.preferred).toBe(false);
    expect(compatibilityOnly.compatibilityLabel).toBe(
      "compatibility-only-non-preferred",
    );
    expect(compatibilityOnly.path).toBe("/events");

    const compatChannel =
      projection.asyncapi.channels[
        channelIdForSelectedStream(compatibilityOnly)
      ];
    expect(compatChannel?.description).toContain(
      "compatibility-only / non-preferred",
    );
    expect(compatChannel?.description).toContain("x-event-schema");
  });

  test("projected AsyncAPI channels address OpenAPI paths and message payloads use x-event-schema refs", () => {
    const doc = parsePackagedOpenApi();
    const { asyncapi, selectedStreams } = projectOpenApiSseToAsyncApi(doc);

    expect(Object.keys(asyncapi.channels).sort()).toEqual(
      selectedStreams.map(channelIdForSelectedStream).sort(),
    );

    for (const stream of selectedStreams) {
      const channelId = channelIdForSelectedStream(stream);
      const messageId = messageIdForSelectedStream(stream);
      expect(asyncapi.channels[channelId]?.address).toBe(stream.path);
      expect(asyncapi.components.messages[messageId]?.payload.$ref).toBe(
        stream.payloadRootRef,
      );
    }
  });

  test("rejects hard-coded schema-name-only selection as the spike mechanism", () => {
    const doc = parsePackagedOpenApi();

    expect(() =>
      selectSseStreamsByHardCodedSchemaNamesOnly(doc, [
        "FactoryEvent",
        "FactoryResponseEvent",
      ]),
    ).toThrow(/Hard-coded schema-name-only selection is rejected/);

    // Positive control: real selection still succeeds on the same document.
    expect(selectSseStreamsFromOpenApi(doc)).toHaveLength(3);
  });

  test("fails closed when text/event-stream or x-event-schema is missing", () => {
    const doc = parsePackagedOpenApi();
    const broken = structuredClone(doc) as OpenApiLike;
    const content =
      broken.paths?.["/factory-sessions/{session_id}/events"]?.get?.responses?.[
        "200"
      ]?.content;
    if (!content) {
      throw new Error("expected content map");
    }
    delete content["text/event-stream"];

    expect(() =>
      selectSseStreamFromOpenApi(broken, SSE_SPIKE_OPERATIONS[0]),
    ).toThrow(SelectSseStreamsError);

    const missingExt = structuredClone(doc) as OpenApiLike;
    const media =
      missingExt.paths?.["/factory-sessions/{session_id}/response-events"]?.get
        ?.responses?.["200"]?.content?.["text/event-stream"];
    if (!media) {
      throw new Error("expected media");
    }
    delete media["x-event-schema"];

    try {
      selectSseStreamFromOpenApi(missingExt, SSE_SPIKE_OPERATIONS[1]);
      throw new Error("expected SelectSseStreamsError");
    } catch (error) {
      expect(error).toBeInstanceOf(SelectSseStreamsError);
      expect((error as SelectSseStreamsError).code).toBe(
        "missing-x-event-schema",
      );
    }
  });

  test("resolvePayloadRootFromXEventSchema reads the extension only", () => {
    expect(
      resolvePayloadRootFromXEventSchema({
        schema: { type: "string" },
        "x-event-schema": "#/components/schemas/CustomRoot",
      }),
    ).toBe("#/components/schemas/CustomRoot");

    expect(() =>
      resolvePayloadRootFromXEventSchema({ schema: { type: "string" } }),
    ).toThrow(/x-event-schema must be a non-empty string ref/);
  });

  test("inventory-driven selection rejects inventing operations outside OpenAPI paths", () => {
    const doc = parsePackagedOpenApi();
    const fake: SseSpikeOperation = {
      path: "/does-not-exist",
      method: "get",
      operationId: "getDoesNotExist",
      role: "canonical",
      roleLabel: "Fake",
    };

    expect(() => selectSseStreamFromOpenApi(doc, fake)).toThrow(
      SelectSseStreamsError,
    );
  });
});
