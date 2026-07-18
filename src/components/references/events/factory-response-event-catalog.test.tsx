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
    expect(
      screen.getByText(/not a complete FactoryResponseEvent envelope/i),
    ).toBeTruthy();
    // Envelope-only fields must not appear as if this were a full event.
    expect(
      node.querySelector('[data-schema-field-path="schemaVersion"]'),
    ).toBeNull();
    expect(node.querySelector('[data-schema-field-path="eventId"]')).toBeNull();
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

    expect(
      screen.getByTestId("factory-response-event-catalog-section"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("response-event-envelope-reference"),
    ).toBeTruthy();
    expect(screen.getByTestId("response-event-matrix")).toBeTruthy();
    expect(screen.getByTestId("response-event-payload-catalog")).toBeTruthy();
    expect(
      screen
        .getByTestId("factory-response-event-catalog-section")
        .getAttribute("data-event-catalog-payload-count"),
    ).toBe(String(catalog.payloadVariants.length));
    expect(
      screen
        .getByTestId("factory-response-event-catalog-section")
        .getAttribute("data-event-ephemeral"),
    ).toBe("true");
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
