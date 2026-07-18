/**
 * Story 005 — focused tests for `$ref` closure, source hash, semantic
 * inventory, and fail-closed validation on the temporary AsyncAPI projector.
 */

import { describe, expect, test } from "bun:test";
import { collectSchemaRefClosure } from "./collect-schema-ref-closure";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import type { OpenApiLike } from "./observe-sse-operations";
import {
  ASYNCAPI_GENERATED_FILE_NOTICE,
  projectOpenApiSseToAsyncApi,
} from "./project-openapi-to-asyncapi";
import {
  assertInventoryMatchesExpected,
  hashOpenApiSource,
  ProjectionValidationError,
} from "./projection-inventory";
import { selectSseStreamsFromOpenApi } from "./select-sse-streams";

type OpenApiDoc = OpenApiLike & {
  components?: { schemas?: Record<string, unknown> };
};

function loadPackaged(): { doc: OpenApiDoc; sourceText: string } {
  const artifact = loadPackagedOpenApiArtifact();
  return {
    doc: Bun.YAML.parse(artifact.rawText) as OpenApiDoc,
    sourceText: artifact.rawText,
  };
}

describe("W02 SSE spike — AsyncAPI projector closure / inventory (005)", () => {
  test("projection copies the full transitive $ref closure for selected roots", () => {
    const { doc, sourceText } = loadPackaged();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });

    expect(projection.schemaClosure.unresolvedReferenceCount).toBe(0);
    expect(projection.schemaClosure.schemaNames.length).toBeGreaterThan(50);

    // Envelope roots and nested payload / discriminator targets must be present.
    expect(projection.asyncapi.components.schemas.FactoryEvent).toBeDefined();
    expect(
      projection.asyncapi.components.schemas.FactoryResponseEvent,
    ).toBeDefined();
    expect(
      projection.asyncapi.components.schemas.RunRequestEventPayload,
    ).toBeDefined();
    expect(
      projection.asyncapi.components.schemas.FactoryResponseEventPayload,
    ).toBeDefined();
    expect(
      projection.asyncapi.components.schemas.FactoryEventType,
    ).toBeDefined();

    const factoryEvent = projection.asyncapi.components.schemas
      .FactoryEvent as {
      discriminator?: {
        propertyName?: string;
        mapping?: Record<string, string>;
      };
      description?: string;
      properties?: { payload?: { oneOf?: unknown[] } };
    };

    // Wholesale copy preserves discriminator, description, and oneOf shape.
    expect(factoryEvent.discriminator?.propertyName).toBe("type");
    expect(Object.keys(factoryEvent.discriminator?.mapping ?? {}).length).toBe(
      31,
    );
    expect(factoryEvent.description).toContain("canonical schema");
    expect(factoryEvent.properties?.payload?.oneOf?.length).toBe(31);
  });

  test("generated output carries source hash and generated-file notice", () => {
    const { doc, sourceText } = loadPackaged();
    const expectedHash = hashOpenApiSource(sourceText);
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });

    expect(projection.sourceHash).toBe(expectedHash);
    expect(projection.asyncapi.info["x-openapi-source-hash"]).toBe(
      expectedHash,
    );
    expect(projection.asyncapi.info.description).toBe(
      ASYNCAPI_GENERATED_FILE_NOTICE,
    );
    expect(projection.asyncapi.info["x-generated-file-notice"]).toBe(
      ASYNCAPI_GENERATED_FILE_NOTICE,
    );
    expect(projection.generatedFileNotice).toContain("Do not hand-edit");
  });

  test("semantic inventory records operation identity, roots, counts, and unresolved refs", () => {
    const { doc, sourceText } = loadPackaged();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    const { inventory } = projection;

    expect(inventory.sourceHash).toBe(projection.sourceHash);
    expect(inventory.operations).toHaveLength(3);
    expect(inventory.schemaClosure.unresolvedReferenceCount).toBe(0);
    expect(inventory.schemaClosure.schemaCount).toBe(
      projection.schemaClosure.schemaNames.length,
    );

    const byRole = Object.fromEntries(
      inventory.operations.map((op) => [op.role, op]),
    );

    expect(byRole.canonical?.operationId).toBe("getEventsBySessionId");
    expect(byRole.canonical?.path).toBe(
      "/factory-sessions/{session_id}/events",
    );
    expect(byRole.canonical?.rootEventSchemaName).toBe("FactoryEvent");
    expect(byRole.canonical?.rootEventSchemaRef).toBe(
      "#/components/schemas/FactoryEvent",
    );
    expect(byRole.canonical?.eventTypeCount).toBe(31);
    expect(byRole.canonical?.payloadVariantCount).toBe(31);
    expect(byRole.canonical?.unresolvedReferenceCount).toBe(0);

    expect(byRole.ephemeral?.operationId).toBe(
      "getFactoryResponseEventsBySessionId",
    );
    expect(byRole.ephemeral?.rootEventSchemaName).toBe("FactoryResponseEvent");
    // No simple type discriminator on FactoryResponseEvent.
    expect(byRole.ephemeral?.eventTypeCount).toBe(0);
    expect(byRole.ephemeral?.payloadVariantCount).toBe(14);
    expect(byRole.ephemeral?.unresolvedReferenceCount).toBe(0);

    const compatibilityOnly = byRole["compatibility-only"];
    expect(compatibilityOnly?.operationId).toBe("getEvents");
    expect(compatibilityOnly?.rootEventSchemaName).toBe("FactoryEvent");
    expect(compatibilityOnly?.eventTypeCount).toBe(31);
    expect(compatibilityOnly?.payloadVariantCount).toBe(31);

    expect(projection.asyncapi.info["x-semantic-inventory"]).toEqual(inventory);
  });

  test("fails closed when x-event-schema points to a missing schema", () => {
    const { doc, sourceText } = loadPackaged();
    const broken = structuredClone(doc);
    const media =
      broken.paths?.["/factory-sessions/{session_id}/events"]?.get?.responses?.[
        "200"
      ]?.content?.["text/event-stream"];
    if (!media) {
      throw new Error("expected media");
    }
    media["x-event-schema"] = "#/components/schemas/DoesNotExistEnvelope";

    try {
      projectOpenApiSseToAsyncApi(broken, { sourceText });
      throw new Error("expected ProjectionValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectionValidationError);
      expect((error as ProjectionValidationError).code).toBe(
        "missing-root-schema",
      );
    }
  });

  test("fails closed when a transitive $ref is unresolved", () => {
    const { doc, sourceText } = loadPackaged();
    const broken = structuredClone(doc);
    const schemas = broken.components?.schemas;
    if (!schemas) {
      throw new Error("expected schemas");
    }

    // Break a nested payload ref inside FactoryEvent's payload oneOf.
    const factoryEvent = schemas.FactoryEvent as {
      properties?: { payload?: { oneOf?: Array<{ $ref?: string }> } };
    };
    const first = factoryEvent.properties?.payload?.oneOf?.[0];
    if (!first || typeof first.$ref !== "string") {
      throw new Error("expected FactoryEvent payload oneOf[0].$ref");
    }
    first.$ref = "#/components/schemas/MissingTransitivePayload";

    try {
      projectOpenApiSseToAsyncApi(broken, { sourceText });
      throw new Error("expected ProjectionValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectionValidationError);
      expect((error as ProjectionValidationError).code).toBe(
        "unresolved-transitive-ref",
      );
      expect((error as ProjectionValidationError).details).toContain(
        "#/components/schemas/MissingTransitivePayload",
      );
    }
  });

  test("fails closed on semantic inventory drift without regenerating", () => {
    const { doc, sourceText } = loadPackaged();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    const drifted = structuredClone(projection.inventory);
    const first = drifted.operations[0];
    if (!first) {
      throw new Error("expected inventory operation");
    }
    first.eventTypeCount = first.eventTypeCount + 1;

    expect(() =>
      assertInventoryMatchesExpected(projection.inventory, drifted),
    ).toThrow(ProjectionValidationError);

    try {
      projectOpenApiSseToAsyncApi(doc, {
        sourceText,
        expectedInventory: drifted,
      });
      throw new Error("expected ProjectionValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectionValidationError);
      expect((error as ProjectionValidationError).code).toBe("inventory-drift");
    }

    // Matching expected inventory succeeds (regenerated projection is consistent).
    const again = projectOpenApiSseToAsyncApi(doc, {
      sourceText,
      expectedInventory: projection.inventory,
    });
    expect(again.inventory).toEqual(projection.inventory);
  });

  test("losing x-event-schema fails at selection before inventory emission", () => {
    const { doc, sourceText } = loadPackaged();
    const broken = structuredClone(doc);
    const media =
      broken.paths?.["/factory-sessions/{session_id}/response-events"]?.get
        ?.responses?.["200"]?.content?.["text/event-stream"];
    if (!media) {
      throw new Error("expected media");
    }
    delete media["x-event-schema"];

    expect(() => projectOpenApiSseToAsyncApi(broken, { sourceText })).toThrow(
      /missing-x-event-schema|x-event-schema/,
    );
  });

  test("collectSchemaRefClosure reports unresolved roots without copying them", () => {
    const { doc } = loadPackaged();
    const streams = selectSseStreamsFromOpenApi(doc);
    const first = streams[0];
    if (!first) {
      throw new Error("expected stream");
    }

    const ok = collectSchemaRefClosure(doc, [first.payloadRootRef]);
    expect(ok.unresolvedReferenceCount).toBe(0);
    expect(ok.schemas.FactoryEvent).toBeDefined();

    const bad = collectSchemaRefClosure(doc, [
      "#/components/schemas/TotallyMissingRoot",
    ]);
    expect(bad.unresolvedReferenceCount).toBe(1);
    expect(bad.schemas.TotallyMissingRoot).toBeUndefined();
    expect(bad.unresolvedRefs).toEqual([
      "#/components/schemas/TotallyMissingRoot",
    ]);
  });
});
