import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  EventDiscriminatorMap,
  EventEnvelopeComponents,
  EventEnvelopeReference,
  EventPayloadCatalog,
  EventPayloadVariant,
  EventsVerificationHarness,
} from "@/components/references/events";
import {
  buildFactoryEventCatalog,
  countEventTypesFromSchema,
  EVENT_ENVELOPE_EXAMPLE_ORIGIN,
  envelopeExampleConformsToOpenApiSchema,
  FACTORY_EVENT_CONTEXT_SCHEMA_NAME,
  FACTORY_EVENT_SCHEMA_NAME,
  FACTORY_EVENT_TYPE_SCHEMA_NAME,
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

    expect(catalog.envelopeComponents.map((entry) => entry.schemaName)).toEqual(
      [FACTORY_EVENT_TYPE_SCHEMA_NAME, FACTORY_EVENT_CONTEXT_SCHEMA_NAME],
    );
    expect(catalog.envelopeComponents[0]?.envelopeFieldName).toBe("type");
    expect(catalog.envelopeComponents[1]?.envelopeFieldName).toBe("context");
    expect(catalog.envelopeComponents[0]?.definition.enum?.length).toBe(
      catalog.mappings.length,
    );
    const contextRequired =
      catalog.envelopeComponents[1]?.definition.required ?? [];
    for (const field of ["sequence", "tick", "eventTime"]) {
      expect(contextRequired).toContain(field);
    }
    expect(
      catalog.envelopeComponents[1]?.definition.properties?.sequence,
    ).toBeDefined();

    const runRequest = catalog.mappings.find(
      (entry) => entry.eventType === "RUN_REQUEST",
    );
    expect(runRequest?.payloadSchemaName).toBe("RunRequestEventPayload");
    expect(
      catalog.payloadDefinitionsByName.RunRequestEventPayload?.properties
        ?.recordedAt,
    ).toBeDefined();

    // Full envelope JSON example — corpus-true keys/enums, no ellipsis body.
    const example = catalog.envelopeExample;
    expect(example.envelopeSchemaName).toBe(FACTORY_EVENT_SCHEMA_NAME);
    expect(example.language).toBe("json");
    expect(example.origin).toBe(
      EVENT_ENVELOPE_EXAMPLE_ORIGIN.corpusConstructed,
    );
    expect(example.code).not.toMatch(/[…]|\.\.\./);
    for (const field of ["schemaVersion", "id", "type", "context", "payload"]) {
      expect(example.value).toHaveProperty(field);
    }
    expect(example.value.schemaVersion).toBe("agent-factory.event.v1");
    expect(typeof example.value.type).toBe("string");
    expect(factoryEventCatalogEventTypes(catalog)).toContain(
      example.value.type as string,
    );
    expect(
      envelopeExampleConformsToOpenApiSchema(
        example.value,
        liveRoot,
        corpus.openapi.document.components?.schemas as
          | Record<string, unknown>
          | undefined,
      ),
    ).toEqual({ ok: true });

    // Every published payload variant carries a corpus-true JSON example.
    const schemas = corpus.openapi.document.components?.schemas as
      | Record<string, unknown>
      | undefined;
    for (const mapping of catalog.mappings) {
      const payloadExample = mapping.payloadExample;
      expect(payloadExample.payloadSchemaName).toBe(mapping.payloadSchemaName);
      expect(payloadExample.eventIdentity).toBe(mapping.eventType);
      expect(payloadExample.language).toBe("json");
      expect(payloadExample.code).not.toMatch(/[…]|\.\.\./);
      expect(typeof payloadExample.value).toBe("object");
      expect(payloadExample.value).not.toBeNull();
      expect(
        envelopeExampleConformsToOpenApiSchema(
          payloadExample.value,
          schemas?.[mapping.payloadSchemaName],
          schemas,
        ),
      ).toEqual({ ok: true });
    }
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
        envelopeExample={catalog.envelopeExample}
        envelopeFieldsDefinition={catalog.envelopeFieldsDefinition}
      />,
    );

    const section = screen.getByTestId("event-envelope-reference");
    expect(section.getAttribute("data-event-envelope-complete")).toBe("true");
    expect(screen.getByText("FactoryEvent envelope")).toBeTruthy();
    expect(screen.getByText(/not complete envelopes/i)).toBeTruthy();

    const exampleArticle = within(section).getByTestId(
      "event-envelope-json-example",
    );
    expect(exampleArticle.getAttribute("data-event-envelope-example")).toBe(
      "FactoryEvent",
    );
    expect(
      exampleArticle.getAttribute("data-event-envelope-example-origin"),
    ).toBe(EVENT_ENVELOPE_EXAMPLE_ORIGIN.corpusConstructed);
    expect(
      within(exampleArticle).getByText(/FactoryEvent envelope example/i),
    ).toBeTruthy();
    const code = within(exampleArticle).getByTestId(
      `event-envelope-json-example-code-${catalog.envelopeExample.id}`,
    );
    expect(code.textContent).toContain('"schemaVersion"');
    expect(code.textContent).toContain('"agent-factory.event.v1"');
    expect(code.textContent).toContain('"type"');
    expect(code.textContent).not.toMatch(/[…]|\.\.\./);

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

    // Each property path appears once; redundant path labels stay hidden.
    const fieldRows = fields.querySelectorAll(
      '[data-testid="schema-field-row"]',
    );
    const paths = [...fieldRows].map((row) =>
      row.getAttribute("data-schema-field-path"),
    );
    expect(paths.length).toBe(new Set(paths).size);
    for (const field of ["schemaVersion", "id", "type", "context", "payload"]) {
      expect(
        fields.querySelectorAll(`[data-schema-field-path="${field}"]`).length,
      ).toBe(1);
    }
    const schemaVersionRow = fields.querySelector(
      '[data-schema-field-path="schemaVersion"]',
    );
    expect(
      schemaVersionRow?.querySelector("[data-schema-field-name]")?.textContent,
    ).toBe("schemaVersion");
    expect(
      schemaVersionRow?.querySelector("[data-schema-field-path-label]"),
    ).toBeNull();

    // Pointer-path chrome stays hidden; deep-link copy and compact $ref remain.
    expect(
      section.querySelectorAll('[data-schema-breadcrumb-segment="components"]')
        .length,
    ).toBe(0);
    expect(
      section.querySelectorAll('[data-schema-path-segments="false"]').length,
    ).toBeGreaterThan(0);
    expect(
      section.querySelector('[data-schema-breadcrumb="copy"]'),
    ).toBeTruthy();
    const typeRow = fields.querySelector('[data-schema-field-path="type"]');
    expect(typeRow?.querySelector("[data-schema-ref-label]")?.textContent).toBe(
      "FactoryEventType",
    );
    expect(typeRow?.textContent ?? "").not.toMatch(
      /components\/schemas\/.*\/properties\//,
    );
    const contextRow = fields.querySelector(
      '[data-schema-field-path="context"]',
    );
    expect(
      contextRow?.querySelector("[data-schema-ref-label]")?.textContent,
    ).toBe("FactoryEventContext");
  });

  test("EventEnvelopeComponents renders FactoryEventType and FactoryEventContext definitions", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);

    render(<EventEnvelopeComponents components={catalog.envelopeComponents} />);

    const section = screen.getByTestId("event-envelope-components");
    expect(section.getAttribute("data-event-envelope-components")).toBe("2");
    expect(screen.getByText("Envelope components")).toBeTruthy();

    const typeDef = screen.getByTestId(
      `event-envelope-component-${FACTORY_EVENT_TYPE_SCHEMA_NAME}`,
    );
    expect(typeDef.getAttribute("data-schema-definition-pointer")).toBe(
      `/components/schemas/${FACTORY_EVENT_TYPE_SCHEMA_NAME}`,
    );
    expect(
      typeDef.querySelector('[data-schema-constraint="enum"]'),
    ).toBeTruthy();
    expect(typeDef.textContent ?? "").toContain("RUN_REQUEST");
    expect(typeDef.textContent ?? "").not.toMatch(
      /components\/schemas\/.*\/properties\//,
    );

    const contextDef = screen.getByTestId(
      `event-envelope-component-${FACTORY_EVENT_CONTEXT_SCHEMA_NAME}`,
    );
    expect(contextDef.getAttribute("data-schema-definition-pointer")).toBe(
      `/components/schemas/${FACTORY_EVENT_CONTEXT_SCHEMA_NAME}`,
    );
    const contextFields = within(contextDef).getByLabelText(
      /Fields for FactoryEventContext/i,
    );
    for (const field of ["sequence", "tick", "eventTime"]) {
      expect(
        contextFields.querySelectorAll(`[data-schema-field-path="${field}"]`)
          .length,
      ).toBe(1);
    }
    expect(
      contextDef.querySelectorAll(
        '[data-schema-breadcrumb-segment="components"]',
      ).length,
    ).toBe(0);
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
    expect(screen.getByText(/event catalog/i)).toBeTruthy();
    expect(
      screen.queryByText(
        /Payload only — not a complete FactoryEvent envelope/i,
      ),
    ).toBeNull();
    expect(
      variant.querySelector('[data-schema-field-path="recordedAt"]'),
    ).toBeTruthy();
    expect(
      variant.querySelectorAll('[data-schema-field-path="recordedAt"]').length,
    ).toBe(1);
    const recordedAtRow = variant.querySelector(
      '[data-schema-field-path="recordedAt"]',
    );
    expect(
      recordedAtRow?.querySelector("[data-schema-field-path-label]"),
    ).toBeNull();
    // Envelope-only fields must not appear as if this were a full event.
    expect(
      variant.querySelector('[data-schema-field-path="schemaVersion"]'),
    ).toBeNull();

    const exampleArticle = within(variant).getByTestId(
      "event-payload-json-example",
    );
    expect(exampleArticle.getAttribute("data-event-payload-example")).toBe(
      mapping.payloadSchemaName,
    );
    expect(
      exampleArticle.getAttribute("data-event-payload-example-identity"),
    ).toBe("RUN_REQUEST");
    expect(
      exampleArticle.getAttribute("data-event-payload-example-origin"),
    ).toBe(mapping.payloadExample.origin);
    const code = within(exampleArticle).getByTestId(
      `event-payload-json-example-code-${mapping.payloadExample.id}`,
    );
    expect(code.textContent).toContain('"recordedAt"');
    expect(code.textContent).not.toMatch(/[…]|\.\.\./);
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
    expect(screen.getAllByTestId("event-payload-json-example").length).toBe(
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

    const section = screen.getByTestId("factory-event-catalog-section");
    expect(section).toBeTruthy();
    expect(screen.getByTestId("event-envelope-reference")).toBeTruthy();
    expect(screen.getByTestId("event-envelope-json-example")).toBeTruthy();
    expect(screen.getByTestId("event-envelope-components")).toBeTruthy();
    expect(screen.getByTestId("event-discriminator-map")).toBeTruthy();
    expect(screen.getByTestId("event-payload-catalog")).toBeTruthy();
    expect(
      screen.getByTestId(
        `event-envelope-component-${FACTORY_EVENT_TYPE_SCHEMA_NAME}`,
      ),
    ).toBeTruthy();
    expect(
      screen.getByTestId(
        `event-envelope-component-${FACTORY_EVENT_CONTEXT_SCHEMA_NAME}`,
      ),
    ).toBeTruthy();
    expect(screen.getAllByTestId("event-payload-json-example").length).toBe(
      catalog.mappings.length,
    );
    expect(screen.getAllByText(/event catalog/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        /Payload only — not a complete FactoryEvent envelope/i,
      ),
    ).toBeNull();
    expect(section.textContent ?? "").not.toMatch(
      /components\/schemas\/.*\/properties\//,
    );
    expect(section.getAttribute("data-event-catalog-mapping-count")).toBe(
      String(catalog.mappings.length),
    );
  });
});
