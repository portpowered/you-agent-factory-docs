/**
 * Story 008 — custom schema-backed event catalog + placement/hooks evidence.
 */

import { describe, expect, test } from "bun:test";
import { buildEventCatalogFixture } from "./build-event-catalog-fixture";
import type { OpenApiComponentsLike } from "./event-schema-discoverability";
import { loadPackagedOpenApiArtifact } from "./load-packaged-openapi";
import {
  evaluateOpenApiRendererHooksForEventInjection,
  hybridInjectionUsesDocumentedHookOnly,
} from "./openapi-renderer-hooks-evaluation";
import { parseOpenApiYamlText } from "./parse-openapi-yaml";
import {
  assertPlacementHtmlProbe,
  buildPlacementComparisonEvidence,
  measurePlacementHtmlCostSignals,
  PLACEMENT_OPTIONS,
  PLACEMENT_SPIKE_ROUTES,
} from "./placement-comparison-evidence";

function loadPackagedDoc(): OpenApiComponentsLike {
  return parseOpenApiYamlText<OpenApiComponentsLike>(
    loadPackagedOpenApiArtifact().rawText,
  );
}

describe("W02 SSE spike — custom catalog fixture (008)", () => {
  test("builds preferred FactoryEvent + FactoryResponseEvent envelopes with payload variants", () => {
    const catalog = buildEventCatalogFixture(loadPackagedDoc());

    expect(catalog.status).toBe("non-production-temporary");
    expect(catalog.preferredEntries).toHaveLength(2);
    expect(catalog.compatibilityEntries).toHaveLength(1);

    const factoryEvent = catalog.preferredEntries.find(
      (entry) => entry.envelopeSchemaName === "FactoryEvent",
    );
    const responseEvent = catalog.preferredEntries.find(
      (entry) => entry.envelopeSchemaName === "FactoryResponseEvent",
    );

    expect(factoryEvent).toBeDefined();
    expect(factoryEvent?.selectionMode).toBe("type-discriminator-mapping");
    expect(factoryEvent?.discriminatorPropertyName).toBe("type");
    expect(factoryEvent?.inventedDiscriminator).toBe(false);
    expect(factoryEvent?.payloadVariants.length).toBeGreaterThanOrEqual(30);
    expect(
      factoryEvent?.payloadVariants.some(
        (variant) => variant.key === "RUN_REQUEST",
      ),
    ).toBe(true);

    expect(responseEvent).toBeDefined();
    expect(responseEvent?.selectionMode).toBe("kind-phase-oneof");
    expect(responseEvent?.discriminatorPropertyName).toBeUndefined();
    expect(responseEvent?.inventedDiscriminator).toBe(false);
    expect(responseEvent?.payloadVariants.length).toBeGreaterThanOrEqual(10);

    expect(catalog.compatibilityEntries[0]?.role).toBe("compatibility-only");
    expect(catalog.compatibilityEntries[0]?.preferred).toBe(false);
    expect(catalog.totals.preferredEnvelopeCount).toBe(2);
    expect(catalog.totals.preferredPayloadVariantCount).toBe(
      (factoryEvent?.payloadVariants.length ?? 0) +
        (responseEvent?.payloadVariants.length ?? 0),
    );
  });

  test("catalog follows x-event-schema roots rather than inventing schema names", () => {
    const doc = loadPackagedDoc();
    const renamed = structuredClone(doc) as OpenApiComponentsLike;
    const schemas = renamed.components?.schemas;
    if (!schemas || typeof schemas.FactoryEvent !== "object") {
      throw new Error("expected FactoryEvent schema");
    }
    schemas.RenamedFactoryEvent = schemas.FactoryEvent;
    // Keep original for response-events / other refs; retarget canonical media type only.
    const media =
      renamed.paths?.["/factory-sessions/{session_id}/events"]?.get
        ?.responses?.["200"]?.content?.["text/event-stream"];
    if (!media || typeof media !== "object") {
      throw new Error("expected canonical text/event-stream media type");
    }
    (media as { "x-event-schema": string })["x-event-schema"] =
      "#/components/schemas/RenamedFactoryEvent";

    const catalog = buildEventCatalogFixture(renamed);
    const canonical = catalog.entries.find(
      (entry) => entry.operationId === "getEventsBySessionId",
    );
    expect(canonical?.envelopeSchemaName).toBe("RenamedFactoryEvent");
    expect(canonical?.envelopeSchemaRef).toBe(
      "#/components/schemas/RenamedFactoryEvent",
    );
  });
});

describe("W02 SSE spike — OpenAPI hooks evaluation (008)", () => {
  test("hybrid injection uses documented renderOperationLayout only", () => {
    const evaluation = evaluateOpenApiRendererHooksForEventInjection();
    expect(evaluation.renderer).toBe("fumadocs-openapi");
    expect(evaluation.rendererVersion).toBe("10.10.3");
    expect(evaluation.hybridInjectionChoice.hook).toBe(
      "content.renderOperationLayout",
    );
    expect(evaluation.hybridInjectionChoice.documented).toBe(true);
    expect(
      evaluation.hybridInjectionChoice.requiresAdapterAndUpgradeTestFollowOn,
    ).toBe(false);
    expect(hybridInjectionUsesDocumentedHookOnly(evaluation)).toBe(true);
    expect(evaluation.rejectedUndocumentedInternals.length).toBeGreaterThan(0);
    expect(
      evaluation.supportedHooks.some(
        (hook) => hook.hook === "content.renderOperationLayout",
      ),
    ).toBe(true);
  });
});

describe("W02 SSE spike — placement comparison evidence (008)", () => {
  test("measures HTML cost signals and ranks payloads", () => {
    const integrated = `<main aria-labelledby="x"><section aria-labelledby="a"><h1>OpenAPI</h1><h2>Ops</h2><div data-sse-spike-operation="getEventsBySessionId"></div></section></main>`;
    const separate = `<main><section aria-labelledby="a"><h1>Catalog</h1><h2>Preferred</h2><h3>FactoryEvent</h3><div data-sse-catalog-envelope="FactoryEvent" data-sse-catalog-variant="RUN_REQUEST"></div><div data-sse-catalog-envelope="FactoryResponseEvent" data-sse-catalog-variant="Message"></div></section></main>`;
    const hybrid = `<main><section aria-labelledby="a"><h1>Hybrid</h1><h2>Ops</h2><div data-sse-hybrid-operation="getEventsBySessionId" data-sse-catalog-envelope="FactoryEvent" data-sse-catalog-variant="RUN_REQUEST"></div><div data-sse-catalog-envelope="FactoryResponseEvent" data-sse-catalog-variant="Message"></div></section></main>`;

    const comparison = buildPlacementComparisonEvidence({
      "integrated-only": integrated,
      "separate-catalog": separate,
      hybrid,
    });

    expect(comparison.options).toHaveLength(3);
    expect(PLACEMENT_OPTIONS).toEqual([
      "integrated-only",
      "separate-catalog",
      "hybrid",
    ]);
    expect(PLACEMENT_SPIKE_ROUTES["integrated-only"]).toBe(
      "/spikes/sse-openapi",
    );
    expect(PLACEMENT_SPIKE_ROUTES["separate-catalog"]).toBe(
      "/spikes/sse-catalog",
    );
    expect(PLACEMENT_SPIKE_ROUTES.hybrid).toBe("/spikes/sse-placement-hybrid");

    for (const option of comparison.options) {
      expect(option.viewports).toHaveLength(2);
      expect(option.viewports.map((viewport) => viewport.viewport)).toEqual([
        "desktop",
        "phone",
      ]);
      expect(option.costSummary.length).toBeGreaterThan(20);
      expect(option.html.hasMainLandmark).toBe(true);
    }

    const integratedSignals = measurePlacementHtmlCostSignals(integrated);
    expect(integratedSignals.catalogEnvelopeMarkerCount).toBe(0);

    expect(assertPlacementHtmlProbe("integrated-only", integrated)).toEqual([]);
    expect(assertPlacementHtmlProbe("separate-catalog", separate)).toEqual([]);
    expect(assertPlacementHtmlProbe("hybrid", hybrid)).toEqual([]);
    expect(
      assertPlacementHtmlProbe("separate-catalog", integrated).length,
    ).toBeGreaterThan(0);
  });
});
