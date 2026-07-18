/**
 * Story 006 — focused tests for envelope-attached FactoryEvent mappings and
 * FactoryResponseEvent kind/phase/payload documentation without inventing a
 * discriminator.
 */

import { describe, expect, test } from "bun:test";
import {
  assertEnvelopeProjectionRules,
  ENVELOPE_ATTACHMENT_MODE,
  FACTORY_EVENT_ENVELOPE_ATTACHMENT_NOTE,
  FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE,
  observeEnvelopeProjectionEvidence,
  payloadSchemasAreNotStandaloneMessages,
} from "./envelope-projection-rules";
import {
  FACTORY_EVENT_SCHEMA_NAME,
  FACTORY_EVENT_SCHEMA_REF,
  FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF,
  FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
  FACTORY_RESPONSE_EVENT_SCHEMA_REF,
} from "./event-schema-discoverability";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import type { OpenApiLike } from "./observe-sse-operations";
import {
  messageIdForSelectedStream,
  projectOpenApiSseToAsyncApi,
} from "./project-openapi-to-asyncapi";

function parsePackagedOpenApi(): {
  doc: OpenApiLike & { components?: { schemas?: Record<string, unknown> } };
  sourceText: string;
} {
  const artifact = loadPackagedOpenApiArtifact();
  return {
    doc: Bun.YAML.parse(artifact.rawText) as OpenApiLike & {
      components?: { schemas?: Record<string, unknown> };
    },
    sourceText: artifact.rawText,
  };
}

describe("W02 SSE spike — envelope attachment / no invented discriminator (006)", () => {
  test("FactoryEvent messages stay envelope-attached with type discriminator on the envelope", () => {
    const { doc, sourceText } = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    const { envelopeEvidence, asyncapi, selectedStreams } = projection;

    expect(envelopeEvidence.factoryEvent.rootSchemaRef).toBe(
      FACTORY_EVENT_SCHEMA_REF,
    );
    expect(envelopeEvidence.factoryEvent.envelopeAttachment).toBe(
      ENVELOPE_ATTACHMENT_MODE,
    );
    expect(envelopeEvidence.factoryEvent.discriminatorPropertyName).toBe(
      "type",
    );
    expect(envelopeEvidence.factoryEvent.mappingCount).toBeGreaterThan(0);
    expect(
      envelopeEvidence.factoryEvent.payloadSchemasNotStandaloneMessages,
    ).toBe(true);
    expect(envelopeEvidence.factoryEvent.inventedDiscriminator).toBe(false);

    const factoryEventSchema = asyncapi.components.schemas[
      FACTORY_EVENT_SCHEMA_NAME
    ] as {
      discriminator?: {
        propertyName?: string;
        mapping?: Record<string, string>;
      };
    };
    expect(factoryEventSchema.discriminator?.propertyName).toBe("type");
    expect(
      Object.keys(factoryEventSchema.discriminator?.mapping ?? {}).length,
    ).toBe(envelopeEvidence.factoryEvent.mappingCount);

    for (const stream of selectedStreams.filter(
      (s) => s.payloadRootSchemaName === FACTORY_EVENT_SCHEMA_NAME,
    )) {
      const messageId = messageIdForSelectedStream(stream);
      const message = asyncapi.components.messages[messageId];
      expect(message?.payload.$ref).toBe(FACTORY_EVENT_SCHEMA_REF);
      expect(message?.["x-envelope-attachment"]).toBe(ENVELOPE_ATTACHMENT_MODE);
      expect(message?.["x-invented-discriminator"]).toBe(false);
      expect(message?.["x-envelope-attachment-note"]).toBe(
        FACTORY_EVENT_ENVELOPE_ATTACHMENT_NOTE,
      );
      expect(message?.description).toContain("envelope");
    }

    // Mapping targets exist as schemas but are never message payloads.
    const sampleTarget =
      envelopeEvidence.factoryEvent.mappingTargetRefs[0] ?? "";
    expect(sampleTarget).toMatch(/^#\/components\/schemas\//);
    expect(
      Object.values(asyncapi.components.messages).some(
        (m) => m.payload.$ref === sampleTarget,
      ),
    ).toBe(false);
  });

  test("FactoryResponseEvent documents kind/phase/payload without inventing a discriminator", () => {
    const { doc, sourceText } = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    const { envelopeEvidence, asyncapi, selectedStreams } = projection;

    expect(envelopeEvidence.factoryResponseEvent.rootSchemaRef).toBe(
      FACTORY_RESPONSE_EVENT_SCHEMA_REF,
    );
    expect(envelopeEvidence.factoryResponseEvent.hasKindProperty).toBe(true);
    expect(envelopeEvidence.factoryResponseEvent.hasPhaseProperty).toBe(true);
    expect(envelopeEvidence.factoryResponseEvent.payloadSchemaRef).toBe(
      FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF,
    );
    expect(
      envelopeEvidence.factoryResponseEvent.payloadVariantCount,
    ).toBeGreaterThan(0);
    expect(envelopeEvidence.factoryResponseEvent.envelopeHasDiscriminator).toBe(
      false,
    );
    expect(envelopeEvidence.factoryResponseEvent.payloadHasDiscriminator).toBe(
      false,
    );
    expect(envelopeEvidence.factoryResponseEvent.inventedDiscriminator).toBe(
      false,
    );
    expect(envelopeEvidence.factoryResponseEvent.payloadSelectionRule).toBe(
      FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE,
    );

    const fre = asyncapi.components.schemas[FACTORY_RESPONSE_EVENT_SCHEMA_NAME];
    const frep = asyncapi.components.schemas.FactoryResponseEventPayload as
      | { discriminator?: unknown; oneOf?: unknown[] }
      | undefined;
    expect(
      fre && typeof fre === "object" && "discriminator" in fre
        ? (fre as { discriminator?: unknown }).discriminator
        : undefined,
    ).toBeUndefined();
    expect(frep?.discriminator).toBeUndefined();

    const ephemeral = selectedStreams.find((s) => s.role === "ephemeral");
    expect(ephemeral).toBeDefined();
    if (!ephemeral) {
      throw new Error("expected ephemeral stream");
    }
    const messageId = messageIdForSelectedStream(ephemeral);
    const message = asyncapi.components.messages[messageId];
    expect(message?.payload.$ref).toBe(FACTORY_RESPONSE_EVENT_SCHEMA_REF);
    expect(message?.["x-payload-selection-rule"]).toBe(
      FACTORY_RESPONSE_EVENT_PAYLOAD_SELECTION_RULE,
    );
    expect(message?.description).toContain("kind and phase");
    expect(message?.description).toContain("does not invent");
  });

  test("assertEnvelopeProjectionRules passes for packaged projection and rejects payload-only messages", () => {
    const { doc, sourceText } = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });

    const evidence = assertEnvelopeProjectionRules(
      projection.asyncapi,
      projection.selectedStreams,
    );
    expect(evidence.messages).toHaveLength(3);
    expect(
      evidence.messages.every(
        (m) => m.envelopeAttachment === ENVELOPE_ATTACHMENT_MODE,
      ),
    ).toBe(true);

    // Simulate a bad projector that emits a payload-only standalone message.
    const broken = structuredClone(projection.asyncapi);
    broken.components.messages.payload_only_bad = {
      name: "payload_only_bad",
      title: "RunRequestEventPayload",
      contentType: "application/json",
      payload: {
        $ref: evidence.factoryEvent.mappingTargetRefs[0] ?? "",
      },
      description: "bad standalone payload message",
      "x-envelope-attachment": ENVELOPE_ATTACHMENT_MODE,
      "x-invented-discriminator": false,
    };

    expect(
      payloadSchemasAreNotStandaloneMessages(
        broken,
        broken.components.schemas[FACTORY_EVENT_SCHEMA_NAME],
      ),
    ).toBe(false);

    expect(() =>
      assertEnvelopeProjectionRules(broken, projection.selectedStreams),
    ).toThrow(/payload schema is presented as a standalone event message/);
  });

  test("assertEnvelopeProjectionRules rejects an invented FactoryResponseEvent discriminator", () => {
    const { doc, sourceText } = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    const broken = structuredClone(projection.asyncapi);
    const fre = broken.components.schemas[
      FACTORY_RESPONSE_EVENT_SCHEMA_NAME
    ] as Record<string, unknown>;
    fre.discriminator = {
      propertyName: "kind",
      mapping: {
        session: "#/components/schemas/FactoryResponseEventSessionPayload",
      },
    };

    expect(() =>
      assertEnvelopeProjectionRules(broken, projection.selectedStreams),
    ).toThrow(/invented FactoryResponseEvent discriminator/);
  });

  test("observeEnvelopeProjectionEvidence matches projection.envelopeEvidence", () => {
    const { doc, sourceText } = parsePackagedOpenApi();
    const projection = projectOpenApiSseToAsyncApi(doc, { sourceText });
    expect(
      observeEnvelopeProjectionEvidence(
        projection.asyncapi,
        projection.selectedStreams,
      ),
    ).toEqual(projection.envelopeEvidence);
  });
});
