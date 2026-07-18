import { describe, expect, test } from "bun:test";
import type { OpenApiComponentsLike } from "./event-schema-discoverability";
import {
  countExactSchemaRef,
  FACTORY_EVENT_SCHEMA_REF,
  FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF,
  FACTORY_RESPONSE_EVENT_SCHEMA_REF,
  observeEventSchemaDiscoverabilityEvidence,
  observeFactoryEventContractFacts,
  observeFactoryResponseEventContractFacts,
  probeEventSchemaDiscoverabilityHtml,
} from "./event-schema-discoverability";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import { NATIVE_FUMADOCS_SSE_RENDER } from "./native-sse-render-evidence";

function parsePackagedOpenApi(): OpenApiComponentsLike {
  const artifact = loadPackagedOpenApiArtifact();
  return Bun.YAML.parse(artifact.rawText) as OpenApiComponentsLike;
}

describe("W02 SSE spike — FactoryEvent / FactoryResponseEvent discoverability", () => {
  test("FactoryEvent contract has type discriminator mappings to payload schemas", () => {
    const doc = parsePackagedOpenApi();
    const facts = observeFactoryEventContractFacts(doc);

    expect(facts.schemaRef).toBe(FACTORY_EVENT_SCHEMA_REF);
    expect(facts.hasTypeDiscriminator).toBe(true);
    expect(facts.discriminatorPropertyName).toBe("type");
    expect(facts.mappingCount).toBeGreaterThan(0);
    expect(facts.mappingKeys).toContain("RUN_REQUEST");
    expect(facts.mappingKeys).toContain("SESSION_STARTED");
    expect(facts.payloadIsOneOf).toBe(true);
    expect(facts.payloadVariantCount).toBe(facts.mappingCount);
  });

  test("FactoryResponseEvent contract documents kind/phase/oneOf without a simple type discriminator", () => {
    const doc = parsePackagedOpenApi();
    const facts = observeFactoryResponseEventContractFacts(doc);

    expect(facts.schemaRef).toBe(FACTORY_RESPONSE_EVENT_SCHEMA_REF);
    expect(facts.hasKindProperty).toBe(true);
    expect(facts.hasPhaseProperty).toBe(true);
    expect(facts.payloadSchemaRef).toBe(
      FACTORY_RESPONSE_EVENT_PAYLOAD_SCHEMA_REF,
    );
    expect(facts.envelopeHasDiscriminator).toBe(false);
    expect(facts.payloadHasOneOf).toBe(true);
    expect(facts.payloadVariantCount).toBeGreaterThan(0);
    expect(facts.payloadHasDiscriminator).toBe(false);
    expect(facts.usesSimpleTypeDiscriminatorLikeFactoryEvent).toBe(false);
  });

  test("native SSE render does not discover FactoryEvent mappings or FactoryResponseEvent shapes", () => {
    const doc = parsePackagedOpenApi();
    const evidence = observeEventSchemaDiscoverabilityEvidence(doc);

    expect(evidence.renderer).toBe(NATIVE_FUMADOCS_SSE_RENDER.renderer);
    expect(evidence.xEventSchemaHandling).toBe("ignored");
    expect(evidence.operations).toHaveLength(3);
    expect(evidence.operations.map((entry) => entry.role)).toEqual([
      "canonical",
      "ephemeral",
      "compatibility-only",
    ]);
    expect(evidence.operations.map((entry) => entry.rootEventSchema)).toEqual([
      "FactoryEvent",
      "FactoryResponseEvent",
      "FactoryEvent",
    ]);

    for (const entry of evidence.operations) {
      expect(entry.factoryEventTypeMappingsDiscoverable).toBe(
        "not-discoverable",
      );
      expect(entry.factoryResponseEventKindPhaseOneOfDiscoverable).toBe(
        "not-discoverable",
      );
      expect(entry.reason).toContain("x-event-schema");
      expect(entry.reason).toContain("ignored");
    }

    // Roles stay distinguishable even though payload shapes are not.
    expect(new Set(evidence.operations.map((entry) => entry.role)).size).toBe(
      3,
    );
  });

  test("HTML probe reports not-discoverable when payload schema tokens are absent", () => {
    const html = [
      'data-sse-spike-role="canonical"',
      'data-sse-spike-role="ephemeral"',
      'data-sse-spike-role="compatibility-only"',
      "text/event-stream",
      '<span class="text-fd-muted-foreground font-mono">string</span>',
      "referenced by x-event-schema",
      // Must not appear for not-discoverable:
      // FACTORY_EVENT_SCHEMA_REF / discriminator / RUN_REQUEST
      // FactoryResponseEventKind / FactoryResponseEventPhase
    ].join("\n");

    const probe = probeEventSchemaDiscoverabilityHtml(html);
    expect(probe.factoryEventTypeMappingsDiscoverable).toBe("not-discoverable");
    expect(probe.factoryResponseEventKindPhaseOneOfDiscoverable).toBe(
      "not-discoverable",
    );
    expect(probe.rolesDistinguishable).toBe(true);
    expect(probe.roleMarkerCounts).toEqual({
      canonical: 1,
      ephemeral: 1,
      "compatibility-only": 1,
    });
    expect(probe.discriminatorTokenCount).toBe(0);
    expect(probe.runRequestMappingKeyCount).toBe(0);
  });

  test("exact schema-ref count ignores longer prefixed names like FactoryResponseEventKind", () => {
    const html = [
      "#/components/schemas/FactoryResponseEventKind",
      "#/components/schemas/FactoryResponseEventPayload",
      // Exact envelope ref once:
      "#/components/schemas/FactoryResponseEvent",
      "#/components/schemas/FactoryEventType",
    ].join("\n");

    expect(countExactSchemaRef(html, FACTORY_RESPONSE_EVENT_SCHEMA_REF)).toBe(
      1,
    );
    expect(countExactSchemaRef(html, FACTORY_EVENT_SCHEMA_REF)).toBe(0);
  });

  test("HTML probe detects discoverable FactoryEvent mappings when present", () => {
    const html = [
      FACTORY_EVENT_SCHEMA_REF,
      "discriminator",
      "RUN_REQUEST",
      FACTORY_RESPONSE_EVENT_SCHEMA_REF,
      "FactoryResponseEventKind",
      "FactoryResponseEventPhase",
      'data-sse-spike-role="canonical"',
      'data-sse-spike-role="ephemeral"',
      'data-sse-spike-role="compatibility-only"',
    ].join("\n");

    const probe = probeEventSchemaDiscoverabilityHtml(html);
    expect(probe.factoryEventTypeMappingsDiscoverable).toBe("discoverable");
    expect(probe.factoryResponseEventKindPhaseOneOfDiscoverable).toBe(
      "discoverable",
    );
    expect(probe.rolesDistinguishable).toBe(true);
  });
});
