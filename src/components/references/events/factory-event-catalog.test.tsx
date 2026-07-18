import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  EventDiscriminatorMap,
  EventEnvelopeReference,
  EventPayloadCatalog,
  EventPayloadVariant,
  EventsVerificationHarness,
} from "@/components/references/events";
import {
  buildFactoryEventCatalog,
  countEventTypesFromSchema,
  FACTORY_EVENT_SCHEMA_NAME,
  FactoryEventCatalogError,
  factoryEventCatalogEventTypes,
  factoryEventCatalogPayloadSchemaNames,
  resolveEventCorpus,
} from "@/lib/references/events";

afterEach(() => {
  cleanup();
});

describe("buildFactoryEventCatalog", () => {
  test("builds envelope + live discriminator inventory from packaged OpenAPI", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);
    const liveRoot =
      corpus.openapi.document.components?.schemas?.[FACTORY_EVENT_SCHEMA_NAME];
    const liveCount = countEventTypesFromSchema(liveRoot);

    expect(catalog.envelopeSchemaName).toBe("FactoryEvent");
    expect(catalog.discriminatorPropertyName).toBe("type");
    expect(catalog.mappings.length).toBe(liveCount);
    // Baseline observation from package inventory (not a frozen product quota).
    expect(catalog.mappings.length).toBeGreaterThanOrEqual(31);
    expect(catalog.envelopeFieldsDefinition.composition).toBeUndefined();
    expect(catalog.envelopeDefinition.composition?.discriminator).toBeDefined();

    const required = catalog.envelopeFieldsDefinition.required ?? [];
    for (const field of ["schemaVersion", "id", "type", "context", "payload"]) {
      expect(required).toContain(field);
      expect(
        catalog.envelopeFieldsDefinition.properties?.[field],
      ).toBeDefined();
    }

    const eventTypes = factoryEventCatalogEventTypes(catalog);
    expect(eventTypes).toContain("RUN_REQUEST");
    expect(eventTypes).toContain("ARTIFACT_CREATED");
    expect(eventTypes).toEqual([...eventTypes].sort());

    const payloadNames = factoryEventCatalogPayloadSchemaNames(catalog);
    expect(payloadNames).toContain("RunRequestEventPayload");
    expect(payloadNames.length).toBe(catalog.mappings.length);

    const runRequest = catalog.mappings.find(
      (entry) => entry.eventType === "RUN_REQUEST",
    );
    expect(runRequest?.payloadSchemaName).toBe("RunRequestEventPayload");
    expect(
      catalog.payloadDefinitionsByName.RunRequestEventPayload?.properties
        ?.recordedAt,
    ).toBeDefined();
  });

  test("fails closed when FactoryEvent schema is missing", () => {
    expect(() =>
      buildFactoryEventCatalog({
        components: { schemas: {} },
      }),
    ).toThrow(FactoryEventCatalogError);
  });
});

describe("FactoryEvent catalog UI", () => {
  test("EventEnvelopeReference keeps shared envelope fields visible", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);

    render(
      <EventEnvelopeReference
        discriminatorPropertyName={catalog.discriminatorPropertyName}
        envelopeFieldsDefinition={catalog.envelopeFieldsDefinition}
      />,
    );

    const section = screen.getByTestId("event-envelope-reference");
    expect(section.getAttribute("data-event-envelope-complete")).toBe("true");
    expect(screen.getByText("FactoryEvent envelope")).toBeTruthy();
    expect(screen.getByText(/not complete envelopes/i)).toBeTruthy();

    const fields = within(section).getByLabelText(/Fields for FactoryEvent/i);
    expect(
      fields.querySelector('[data-schema-field-path="schemaVersion"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="type"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="payload"]'),
    ).toBeTruthy();
  });

  test("EventDiscriminatorMap lists all live type → payload mappings", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);

    render(
      <EventDiscriminatorMap
        discriminatorPropertyName={catalog.discriminatorPropertyName}
        mappings={catalog.mappings}
        pagePath="/events-renderer-harness"
      />,
    );

    const map = screen.getByTestId("event-discriminator-map");
    expect(map.getAttribute("data-event-discriminator-count")).toBe(
      String(catalog.mappings.length),
    );
    expect(screen.getByText("RUN_REQUEST")).toBeTruthy();
    expect(screen.getByText("RunRequestEventPayload")).toBeTruthy();
    expect(screen.getByText("ARTIFACT_CREATED")).toBeTruthy();
  });

  test("EventPayloadVariant is marked payload-only and renders schema fields", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);
    const mapping = catalog.mappings.find(
      (entry) => entry.eventType === "RUN_REQUEST",
    );
    expect(mapping).toBeDefined();
    if (mapping === undefined) {
      return;
    }
    const definition =
      catalog.payloadDefinitionsByName[mapping.payloadSchemaName];
    expect(definition).toBeDefined();
    if (definition === undefined) {
      return;
    }

    render(<EventPayloadVariant definition={definition} mapping={mapping} />);

    const variant = screen.getByTestId("event-payload-variant");
    expect(variant.getAttribute("data-event-payload-only")).toBe("true");
    expect(
      screen.getByText(/Payload only — not a complete FactoryEvent envelope/i),
    ).toBeTruthy();
    expect(
      variant.querySelector('[data-schema-field-path="recordedAt"]'),
    ).toBeTruthy();
    // Envelope-only fields must not appear as if this were a full event.
    expect(
      variant.querySelector('[data-schema-field-path="schemaVersion"]'),
    ).toBeNull();
  });

  test("EventPayloadCatalog renders every mapped payload variant", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);

    render(
      <EventPayloadCatalog
        mappings={catalog.mappings}
        payloadDefinitionsByName={catalog.payloadDefinitionsByName}
      />,
    );

    const catalogNode = screen.getByTestId("event-payload-catalog");
    expect(catalogNode.getAttribute("data-event-payload-catalog-count")).toBe(
      String(catalog.mappings.length),
    );
    expect(screen.getAllByTestId("event-payload-variant").length).toBe(
      catalog.mappings.length,
    );
  });

  test("FactoryEventCatalogSection + harness compose envelope, map, and payloads", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);

    render(
      <EventsVerificationHarness
        factoryEventCatalog={catalog}
        summaries={[]}
      />,
    );

    expect(screen.getByTestId("factory-event-catalog-section")).toBeTruthy();
    expect(screen.getByTestId("event-envelope-reference")).toBeTruthy();
    expect(screen.getByTestId("event-discriminator-map")).toBeTruthy();
    expect(screen.getByTestId("event-payload-catalog")).toBeTruthy();
    expect(
      screen
        .getByTestId("factory-event-catalog-section")
        .getAttribute("data-event-catalog-mapping-count"),
    ).toBe(String(catalog.mappings.length));
  });
});
