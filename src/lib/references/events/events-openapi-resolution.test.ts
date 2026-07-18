/**
 * Story 002 — OpenAPI as event truth with fail-closed inventory.
 */

import { describe, expect, test } from "bun:test";
import {
  ApiPackageArtifactResolutionError,
  resolveApiPackageArtifact,
} from "@/lib/references/api-package-artifact-resolver";
import {
  assertEventInventoryMatchesExpected,
  EVENT_STREAM_OPERATIONS,
  EVENTS_ASYNCAPI_DEPENDENCY_POLICY,
  EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE,
  EVENTS_OPENAPI_EXPORT,
  EVENTS_SSE_MEDIA_TYPE,
  EVENTS_SSE_RESPONSE_STATUS,
  EventInventoryValidationError,
  eventSchemaDisplayTargetsForStreams,
  hashOpenApiSource,
  loadEventsOpenApi,
  projectEventsOpenApiToAsyncApi,
  registerEventSchemaTargets,
  resolveEventCorpus,
  SelectEventStreamsError,
  selectEventStreamsByHardCodedSchemaNamesOnly,
  selectEventStreamsFromOpenApi,
} from "@/lib/references/events";

describe("W09 OpenAPI event-truth resolution (002)", () => {
  test("loads packaged OpenAPI through W03 public-subpath resolution", () => {
    const loaded = loadEventsOpenApi();
    expect(loaded.specifier).toBe(EVENTS_OPENAPI_EXPORT);
    expect(loaded.subpath).toBe("openapi");
    expect(loaded.rawText.length).toBeGreaterThan(0);
    expect(loaded.document.paths).toBeTruthy();

    const viaW03 = resolveApiPackageArtifact(EVENTS_OPENAPI_EXPORT);
    expect(loaded.resolvedPath).toBe(viaW03.resolvedPath);
    expect(loaded.rawText).toBe(viaW03.rawText);
  });

  test("rejects package-root and package-internal targets via W03", () => {
    expect(() => resolveApiPackageArtifact("@you-agent-factory/api")).toThrow(
      ApiPackageArtifactResolutionError,
    );
    try {
      resolveApiPackageArtifact("@you-agent-factory/api");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      if (error instanceof ApiPackageArtifactResolutionError) {
        expect(error.code).toBe("illegal-target");
        expect(error.message).toMatch(/package-root/i);
      }
    }

    expect(() =>
      resolveApiPackageArtifact(
        "@you-agent-factory/api/generated/openapi/openapi.yaml",
      ),
    ).toThrow(ApiPackageArtifactResolutionError);
    try {
      resolveApiPackageArtifact(
        "@you-agent-factory/api/generated/openapi/openapi.yaml",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ApiPackageArtifactResolutionError);
      if (error instanceof ApiPackageArtifactResolutionError) {
        expect(error.code).toBe("illegal-target");
        expect(error.message).toMatch(/package-internal|generated/i);
      }
    }

    // Events loader always requests the public openapi subpath (never root/internal).
    const loaded = loadEventsOpenApi();
    expect(loaded.specifier).toBe("@you-agent-factory/api/openapi");
    expect(loaded.subpath).toBe("openapi");
  });

  test("selects three SSE streams by path/operation/status/media-type and x-event-schema", () => {
    const loaded = loadEventsOpenApi();
    const streams = selectEventStreamsFromOpenApi(loaded.document);

    expect(streams).toHaveLength(EVENT_STREAM_OPERATIONS.length);
    expect(streams.map((s) => s.role)).toEqual([
      "canonical",
      "ephemeral",
      "compatibility-only",
    ]);

    for (const stream of streams) {
      expect(stream.status).toBe(EVENTS_SSE_RESPONSE_STATUS);
      expect(stream.mediaType).toBe(EVENTS_SSE_MEDIA_TYPE);
      expect(stream.payloadRootRef.startsWith("#/components/schemas/")).toBe(
        true,
      );
      expect(stream.payloadRootSchemaName.length).toBeGreaterThan(0);
    }

    expect(streams[0]?.payloadRootSchemaName).toBe("FactoryEvent");
    expect(streams[1]?.payloadRootSchemaName).toBe("FactoryResponseEvent");
    expect(streams[2]?.payloadRootSchemaName).toBe("FactoryEvent");
    expect(streams[0]?.preferred).toBe(true);
    expect(streams[1]?.preferred).toBe(true);
    expect(streams[2]?.preferred).toBe(false);
    expect(streams[2]?.compatibilityLabel).toBe(
      "compatibility-only-non-preferred",
    );
  });

  test("rejects hard-coded schema-name-only selection", () => {
    const loaded = loadEventsOpenApi();
    expect(() =>
      selectEventStreamsByHardCodedSchemaNamesOnly(loaded.document, [
        "FactoryEvent",
      ]),
    ).toThrow(/Hard-coded schema-name-only selection is rejected/);
  });

  test("fails closed when a stream path is missing from OpenAPI", () => {
    const loaded = loadEventsOpenApi();
    const broken = structuredClone(loaded.document);
    delete broken.paths?.["/factory-sessions/{session_id}/events"];
    expect(() => selectEventStreamsFromOpenApi(broken)).toThrow(
      SelectEventStreamsError,
    );
    try {
      selectEventStreamsFromOpenApi(broken);
    } catch (error) {
      expect(error).toBeInstanceOf(SelectEventStreamsError);
      if (error instanceof SelectEventStreamsError) {
        expect(error.code).toBe("missing-path");
        expect(error.operationId).toBe("getEventsBySessionId");
      }
    }
  });

  test("resolveEventCorpus builds inventory and W04 schema targets from live OpenAPI", () => {
    const corpus = resolveEventCorpus();
    expect(corpus.sourceHash).toBe(hashOpenApiSource(corpus.openapi.rawText));
    expect(corpus.selectedStreams).toHaveLength(3);
    expect(corpus.inventory.operations).toHaveLength(3);
    expect(corpus.schemaClosure.unresolvedReferenceCount).toBe(0);
    expect(corpus.schemaClosure.schemaNames.length).toBeGreaterThan(50);

    const byRole = Object.fromEntries(
      corpus.inventory.operations.map((op) => [op.role, op]),
    );
    expect(byRole.canonical?.rootEventSchemaName).toBe("FactoryEvent");
    expect(byRole.canonical?.rootEventSchemaRef).toBe(
      "#/components/schemas/FactoryEvent",
    );
    // Baseline observation (~31) — assert against live inventory, not a quota.
    expect(byRole.canonical?.eventTypeCount).toBeGreaterThan(0);
    expect(byRole.canonical?.payloadVariantCount).toBe(
      byRole.canonical?.eventTypeCount,
    );
    expect(byRole.ephemeral?.rootEventSchemaName).toBe("FactoryResponseEvent");
    expect(byRole.ephemeral?.payloadVariantCount).toBeGreaterThan(0);

    expect(corpus.schemaTargets).toHaveLength(3);
    expect(corpus.schemaTargets[0]?.formattedAddress).toContain(
      EVENTS_OPENAPI_EXPORT,
    );
    expect(corpus.schemaTargets[0]?.schemaPointerAnchor).toContain(
      "components-schemas-FactoryEvent",
    );
    expect(corpus.schemaTargets[0]?.eventAnchor).toBe("FactoryEvent");
    expect(corpus.asyncApiProjection).toBeUndefined();
  });

  test("optional AsyncAPI projection is source-hashed and never a second authored corpus", () => {
    const corpus = resolveEventCorpus({ includeAsyncApiProjection: true });
    const projection = corpus.asyncApiProjection;
    expect(projection).toBeDefined();
    if (!projection) {
      return;
    }

    expect(projection.sourceHash).toBe(corpus.sourceHash);
    expect(projection.generatedFileNotice).toBe(
      EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE,
    );
    expect(projection.asyncapi.info["x-openapi-source-hash"]).toBe(
      corpus.sourceHash,
    );
    expect(projection.asyncapi.info["x-generated-file-notice"]).toBe(
      EVENTS_ASYNCAPI_GENERATED_FILE_NOTICE,
    );
    expect(projection.asyncapi.info["x-generated-from"]).toBe(
      "packaged-openapi",
    );
    expect(projection.asyncapi.info["x-projection-role"]).toBe(
      "optional-generated-only",
    );
    expect(projection.asyncapi.info.description).toContain("Do not hand-edit");
    expect(projection.asyncapi.components.schemas.FactoryEvent).toBeDefined();
    expect(
      projection.asyncapi.components.schemas.FactoryResponseEvent,
    ).toBeDefined();
    expect(EVENTS_ASYNCAPI_DEPENDENCY_POLICY.eventTruthOwner).toBe("openapi");
    expect(EVENTS_ASYNCAPI_DEPENDENCY_POLICY.asyncApiRole).toBe(
      "generated-projection-only",
    );
    expect(
      EVENTS_ASYNCAPI_DEPENDENCY_POLICY.permanentlyPinsFumadocsAsyncApi,
    ).toBe(false);
  });

  test("fails closed on unresolved transitive $refs", () => {
    const loaded = loadEventsOpenApi();
    const broken = structuredClone(loaded.document);
    // Drop a nested schema that FactoryEvent transitively references.
    if (broken.components?.schemas) {
      delete broken.components.schemas.FactoryEventType;
    }
    expect(() =>
      projectEventsOpenApiToAsyncApi(broken, { sourceText: loaded.rawText }),
    ).toThrow(EventInventoryValidationError);

    try {
      projectEventsOpenApiToAsyncApi(broken, { sourceText: loaded.rawText });
    } catch (error) {
      expect(error).toBeInstanceOf(EventInventoryValidationError);
      if (error instanceof EventInventoryValidationError) {
        expect(error.code).toBe("unresolved-transitive-ref");
        expect(error.details.some((d) => d.includes("FactoryEventType"))).toBe(
          true,
        );
      }
    }
  });

  test("fails closed on semantic inventory drift", () => {
    const corpus = resolveEventCorpus();
    const drifted = structuredClone(corpus.inventory);
    const canonical = drifted.operations.find((op) => op.role === "canonical");
    expect(canonical).toBeDefined();
    if (canonical) {
      canonical.eventTypeCount = Math.max(0, canonical.eventTypeCount - 1);
    }

    expect(() =>
      assertEventInventoryMatchesExpected(corpus.inventory, drifted),
    ).toThrow(EventInventoryValidationError);

    expect(() => resolveEventCorpus({ expectedInventory: drifted })).toThrow(
      EventInventoryValidationError,
    );
  });

  test("registers W04 anchors for payload roots without inventing a second corpus", () => {
    const corpus = resolveEventCorpus();
    const targets = eventSchemaDisplayTargetsForStreams(corpus.selectedStreams);
    const { registered, registry } = registerEventSchemaTargets(
      corpus.selectedStreams,
    );

    expect(targets).toHaveLength(3);
    // FactoryEvent is shared by canonical + compatibility-only → 2 unique schema roots
    // (FactoryEvent, FactoryResponseEvent) × (schema-pointer + event) = 4 entries.
    expect(registered).toHaveLength(4);
    const pageEntries = registry.listPage("references/events");
    expect(pageEntries.some((entry) => entry.kind === "schema-pointer")).toBe(
      true,
    );
    expect(pageEntries.some((entry) => entry.kind === "event")).toBe(true);
    expect(
      pageEntries.filter((entry) => entry.identity.includes("FactoryEvent"))
        .length,
    ).toBeGreaterThan(0);
  });
});
