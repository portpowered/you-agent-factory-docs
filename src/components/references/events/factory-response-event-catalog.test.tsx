import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import {
  EventsVerificationHarness,
  FactoryResponseEventCatalogSection,
  ResponseEventEnvelopeReference,
  ResponseEventMatrix,
  ResponseEventPayloadCatalog,
  ResponseEventPayloadVariant,
} from "@/components/references/events";
import {
  buildFactoryResponseEventCatalog,
  countPayloadVariantsFromRootSchema,
  EVENT_ENVELOPE_EXAMPLE_ORIGIN,
  envelopeExampleConformsToOpenApiSchema,
  FACTORY_RESPONSE_EVENT_SCHEMA_NAME,
  FactoryResponseEventCatalogError,
  factoryResponseEventCatalogKindValues,
  factoryResponseEventCatalogPayloadSchemaNames,
  factoryResponseEventCatalogPhaseValues,
  resolveEventCorpus,
} from "@/lib/references/events";

afterEach(() => {
  cleanup();
});

describe("buildFactoryResponseEventCatalog", () => {
  test("builds envelope + live dimension / oneOf inventory from packaged OpenAPI", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);
    const liveRoot =
      corpus.openapi.document.components?.schemas?.[
        FACTORY_RESPONSE_EVENT_SCHEMA_NAME
      ];
    const livePayloadCount = countPayloadVariantsFromRootSchema(
      corpus.openapi.document,
      liveRoot,
    );

    expect(catalog.envelopeSchemaName).toBe("FactoryResponseEvent");
    expect(catalog.ephemeral).toBe(true);
    expect(catalog.cartesianCombinationsValid).toBe(false);
    expect(catalog.payloadVariants.length).toBe(livePayloadCount);
    // Baseline observation from package inventory (not a frozen product quota).
    expect(catalog.payloadVariants.length).toBeGreaterThanOrEqual(14);

    const required = catalog.envelopeFieldsDefinition.required ?? [];
    for (const field of [
      "schemaVersion",
      "eventId",
      "sequence",
      "kind",
      "phase",
      "provenance",
      "payload",
    ]) {
      expect(required).toContain(field);
      expect(
        catalog.envelopeFieldsDefinition.properties?.[field],
      ).toBeDefined();
    }

    // Optional correlation fields when present in the contract.
    expect(
      catalog.envelopeFieldsDefinition.properties?.dispatchId,
    ).toBeDefined();
    expect(catalog.envelopeFieldsDefinition.properties?.turnId).toBeDefined();

    const kinds = factoryResponseEventCatalogKindValues(catalog);
    expect(kinds).toContain("MESSAGE");
    expect(kinds).toContain("STREAM_GAP");
    expect(kinds).toEqual([...kinds].sort());

    const phases = factoryResponseEventCatalogPhaseValues(catalog);
    expect(phases).toContain("STARTED");
    expect(phases).toContain("DELTA");
    expect(phases).toEqual([...phases].sort());

    const payloadNames = factoryResponseEventCatalogPayloadSchemaNames(catalog);
    expect(payloadNames).toContain("FactoryResponseEventMessagePayload");
    expect(payloadNames).toContain("FactoryResponseEventStreamGapPayload");
    expect(payloadNames).toEqual([...payloadNames].sort());
    expect(payloadNames.length).toBe(catalog.payloadVariants.length);

    expect(catalog.provenance.definition.properties?.provider).toBeDefined();
    expect(
      catalog.payloadDefinitionsByName.FactoryResponseEventMessagePayload,
    ).toBeDefined();

    // Full envelope JSON example — corpus-true keys/enums, no ellipsis body.
    const example = catalog.envelopeExample;
    expect(example.envelopeSchemaName).toBe(FACTORY_RESPONSE_EVENT_SCHEMA_NAME);
    expect(example.language).toBe("json");
    expect(example.origin).toBe(
      EVENT_ENVELOPE_EXAMPLE_ORIGIN.corpusConstructed,
    );
    expect(example.code).not.toMatch(/[…]|\.\.\./);
    for (const field of [
      "schemaVersion",
      "eventId",
      "sequence",
      "kind",
      "phase",
      "provenance",
      "payload",
    ]) {
      expect(example.value).toHaveProperty(field);
    }
    expect(example.value.schemaVersion).toBe("agent-factory.response-event.v1");
    expect(kinds).toContain(example.value.kind as string);
    expect(phases).toContain(example.value.phase as string);
    expect(
      envelopeExampleConformsToOpenApiSchema(
        example.value,
        liveRoot,
        corpus.openapi.document.components?.schemas as
          | Record<string, unknown>
          | undefined,
      ),
    ).toEqual({ ok: true });

    // Every published response payload variant carries a corpus-true JSON example.
    const schemas = corpus.openapi.document.components?.schemas as
      | Record<string, unknown>
      | undefined;
    for (const variant of catalog.payloadVariants) {
      const payloadExample = variant.payloadExample;
      expect(payloadExample.payloadSchemaName).toBe(variant.payloadSchemaName);
      expect(payloadExample.language).toBe("json");
      expect(payloadExample.code).not.toMatch(/[…]|\.\.\./);
      expect(typeof payloadExample.value).toBe("object");
      expect(payloadExample.value).not.toBeNull();
      expect(
        envelopeExampleConformsToOpenApiSchema(
          payloadExample.value,
          schemas?.[variant.payloadSchemaName],
          schemas,
        ),
      ).toEqual({ ok: true });
    }
  });

  test("fails closed when FactoryResponseEvent schema is missing", () => {
    expect(() =>
      buildFactoryResponseEventCatalog({
        components: { schemas: {} },
      }),
    ).toThrow(FactoryResponseEventCatalogError);
  });
});

describe("FactoryResponseEvent catalog UI", () => {
  test("ResponseEventEnvelopeReference keeps shared envelope fields visible and ephemeral", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);

    render(
      <ResponseEventEnvelopeReference
        envelopeExample={catalog.envelopeExample}
        envelopeFieldsDefinition={catalog.envelopeFieldsDefinition}
      />,
    );

    const section = screen.getByTestId("response-event-envelope-reference");
    expect(section.getAttribute("data-event-envelope-complete")).toBe("true");
    expect(section.getAttribute("data-event-ephemeral")).toBe("true");
    expect(screen.getByText("FactoryResponseEvent envelope")).toBeTruthy();
    expect(
      screen.getByText(/not canonical FactoryEvent replay state/i),
    ).toBeTruthy();

    const exampleArticle = within(section).getByTestId(
      "event-envelope-json-example",
    );
    expect(exampleArticle.getAttribute("data-event-envelope-example")).toBe(
      "FactoryResponseEvent",
    );
    expect(
      exampleArticle.getAttribute("data-event-envelope-example-origin"),
    ).toBe(EVENT_ENVELOPE_EXAMPLE_ORIGIN.corpusConstructed);
    const code = within(exampleArticle).getByTestId(
      `event-envelope-json-example-code-${catalog.envelopeExample.id}`,
    );
    expect(code.textContent).toContain('"schemaVersion"');
    expect(code.textContent).toContain('"agent-factory.response-event.v1"');
    expect(code.textContent).toContain('"kind"');
    expect(code.textContent).not.toMatch(/[…]|\.\.\./);

    const fields = within(section).getByLabelText(
      /Fields for FactoryResponseEvent/i,
    );
    expect(
      fields.querySelector('[data-schema-field-path="schemaVersion"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="eventId"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="sequence"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="kind"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="phase"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="provenance"]'),
    ).toBeTruthy();
    expect(
      fields.querySelector('[data-schema-field-path="payload"]'),
    ).toBeTruthy();

    const fieldRows = fields.querySelectorAll(
      '[data-testid="schema-field-row"]',
    );
    const paths = [...fieldRows].map((row) =>
      row.getAttribute("data-schema-field-path"),
    );
    expect(paths.length).toBe(new Set(paths).size);
    for (const field of [
      "schemaVersion",
      "eventId",
      "sequence",
      "kind",
      "phase",
      "provenance",
      "payload",
    ]) {
      expect(
        fields.querySelectorAll(`[data-schema-field-path="${field}"]`).length,
      ).toBe(1);
    }
    const schemaVersionRow = fields.querySelector(
      '[data-schema-field-path="schemaVersion"]',
    );
    expect(
      schemaVersionRow?.querySelector("[data-schema-field-path-label]"),
    ).toBeNull();

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
    const kindRow = fields.querySelector('[data-schema-field-path="kind"]');
    expect(kindRow?.querySelector("[data-schema-ref-label]")?.textContent).toBe(
      "FactoryResponseEventKind",
    );
    expect(kindRow?.textContent ?? "").not.toMatch(
      /components\/schemas\/.*\/properties\//,
    );
  });

  test("ResponseEventMatrix documents dimensions without Cartesian validity", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);

    render(
      <ResponseEventMatrix
        catalog={catalog}
        pagePath="/events-renderer-harness"
      />,
    );

    const matrix = screen.getByTestId("response-event-matrix");
    expect(matrix.getAttribute("data-event-cartesian-valid")).toBe("false");
    expect(matrix.getAttribute("data-event-ephemeral")).toBe("true");
    expect(matrix.getAttribute("data-response-event-kind-count")).toBe(
      String(catalog.kind.values.length),
    );
    expect(matrix.getAttribute("data-response-event-phase-count")).toBe(
      String(catalog.phase.values.length),
    );
    expect(matrix.getAttribute("data-response-event-payload-count")).toBe(
      String(catalog.payloadVariants.length),
    );

    expect(
      screen.getByText(/does not claim a full Cartesian product/i),
    ).toBeTruthy();
    expect(screen.getByText("MESSAGE")).toBeTruthy();
    expect(screen.getByText("STREAM_GAP")).toBeTruthy();
    expect(screen.getByText("STARTED")).toBeTruthy();
    expect(screen.getByText("DELTA")).toBeTruthy();
    expect(screen.getByText("FactoryResponseEventMessagePayload")).toBeTruthy();
    expect(
      screen.getByTestId("response-event-dimension-provenance"),
    ).toBeTruthy();

    // Envelope $ref components render as full schema definitions, not labels only.
    const kindDef = screen.getByTestId("response-event-kind-schema-definition");
    expect(kindDef.getAttribute("data-schema-definition-pointer")).toBe(
      "/components/schemas/FactoryResponseEventKind",
    );
    expect(
      kindDef.querySelector('[data-schema-constraint="enum"]'),
    ).toBeTruthy();
    expect(kindDef.textContent ?? "").toContain("MESSAGE");

    const phaseDef = screen.getByTestId(
      "response-event-phase-schema-definition",
    );
    expect(phaseDef.getAttribute("data-schema-definition-pointer")).toBe(
      "/components/schemas/FactoryResponseEventPhase",
    );
    expect(
      phaseDef.querySelector('[data-schema-constraint="enum"]'),
    ).toBeTruthy();

    const provenanceDef = screen.getByTestId(
      "response-event-provenance-schema-definition",
    );
    expect(provenanceDef.getAttribute("data-schema-definition-pointer")).toBe(
      "/components/schemas/FactoryResponseEventProvenance",
    );
    expect(
      within(provenanceDef).getByLabelText(
        /Fields for FactoryResponseEventProvenance/i,
      ),
    ).toBeTruthy();

    expect(
      screen
        .getByTestId("response-event-dimension-kind")
        .getAttribute("data-event-envelope-component"),
    ).toBe("FactoryResponseEventKind");
    expect(
      screen
        .getByTestId("response-event-dimension-phase")
        .getAttribute("data-event-envelope-component"),
    ).toBe("FactoryResponseEventPhase");
    expect(
      screen
        .getByTestId("response-event-dimension-provenance")
        .getAttribute("data-event-envelope-component"),
    ).toBe("FactoryResponseEventProvenance");
  });

  test("ResponseEventPayloadVariant is marked payload-only / ephemeral", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);
    const variant = catalog.payloadVariants.find(
      (entry) =>
        entry.payloadSchemaName === "FactoryResponseEventMessagePayload",
    );
    expect(variant).toBeDefined();
    if (variant === undefined) {
      return;
    }
    const definition =
      catalog.payloadDefinitionsByName[variant.payloadSchemaName];
    expect(definition).toBeDefined();
    if (definition === undefined) {
      return;
    }

    render(
      <ResponseEventPayloadVariant definition={definition} variant={variant} />,
    );

    const node = screen.getByTestId("response-event-payload-variant");
    expect(node.getAttribute("data-event-payload-only")).toBe("true");
    expect(node.getAttribute("data-event-ephemeral")).toBe("true");
    expect(screen.getByText(/event catalog/i)).toBeTruthy();
    expect(
      screen.queryByText(/not a complete FactoryResponseEvent envelope/i),
    ).toBeNull();
    // Envelope-only fields must not appear as if this were a full event.
    expect(
      node.querySelector('[data-schema-field-path="schemaVersion"]'),
    ).toBeNull();
    expect(node.querySelector('[data-schema-field-path="eventId"]')).toBeNull();

    const exampleArticle = within(node).getByTestId(
      "event-payload-json-example",
    );
    expect(exampleArticle.getAttribute("data-event-payload-example")).toBe(
      variant.payloadSchemaName,
    );
    expect(
      exampleArticle.getAttribute("data-event-payload-example-origin"),
    ).toBe(variant.payloadExample.origin);
    const code = within(exampleArticle).getByTestId(
      `event-payload-json-example-code-${variant.payloadExample.id}`,
    );
    expect(code.textContent).not.toMatch(/[…]|\.\.\./);
    expect(code.textContent?.trim().length ?? 0).toBeGreaterThan(2);
  });

  test("ResponseEventPayloadCatalog renders every oneOf payload variant", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);

    render(
      <ResponseEventPayloadCatalog
        payloadDefinitionsByName={catalog.payloadDefinitionsByName}
        variants={catalog.payloadVariants}
      />,
    );

    const catalogNode = screen.getByTestId("response-event-payload-catalog");
    expect(catalogNode.getAttribute("data-event-payload-catalog-count")).toBe(
      String(catalog.payloadVariants.length),
    );
    expect(screen.getAllByTestId("response-event-payload-variant").length).toBe(
      catalog.payloadVariants.length,
    );
    expect(screen.getAllByTestId("event-payload-json-example").length).toBe(
      catalog.payloadVariants.length,
    );
  });

  test("FactoryResponseEventCatalogSection + harness compose envelope, matrix, and payloads", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);

    render(
      <EventsVerificationHarness
        factoryResponseEventCatalog={catalog}
        summaries={[]}
      />,
    );

    const section = screen.getByTestId(
      "factory-response-event-catalog-section",
    );
    expect(section).toBeTruthy();
    expect(
      screen.getByTestId("response-event-envelope-reference"),
    ).toBeTruthy();
    expect(screen.getByTestId("event-envelope-json-example")).toBeTruthy();
    expect(screen.getByTestId("response-event-matrix")).toBeTruthy();
    expect(screen.getByTestId("response-event-payload-catalog")).toBeTruthy();
    expect(
      screen.getByTestId("response-event-kind-schema-definition"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("response-event-phase-schema-definition"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("response-event-provenance-schema-definition"),
    ).toBeTruthy();
    expect(screen.getAllByTestId("event-payload-json-example").length).toBe(
      catalog.payloadVariants.length,
    );
    expect(screen.getAllByText(/event catalog/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        /Payload only — ephemeral; not a complete FactoryResponseEvent envelope/i,
      ),
    ).toBeNull();
    expect(section.textContent ?? "").not.toMatch(
      /components\/schemas\/.*\/properties\//,
    );
    expect(section.getAttribute("data-event-catalog-payload-count")).toBe(
      String(catalog.payloadVariants.length),
    );
    expect(section.getAttribute("data-event-ephemeral")).toBe("true");
  });

  test("FactoryResponseEventCatalogSection renders standalone", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);

    render(<FactoryResponseEventCatalogSection catalog={catalog} />);

    expect(
      screen.getByTestId("factory-response-event-catalog-section"),
    ).toBeTruthy();
    expect(screen.getByText("Response event dimensions")).toBeTruthy();
  });
});
