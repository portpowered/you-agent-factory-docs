/**
 * Story 009 — fail-closed discriminator / payload inventory drift tests.
 *
 * Compare cataloged and search-document inventories against live packaged
 * OpenAPI identities dynamically. Omitting a mapping or payload variant must
 * fail with an actionable message naming the missing identity. Never assert a
 * frozen product quota.
 */
import { describe, expect, test } from "bun:test";
import {
  assertEventCatalogInventoryMatchesLive,
  buildEventCorpusSearchDocuments,
  buildFactoryEventCatalog,
  buildFactoryResponseEventCatalog,
  compareEventCatalogInventoryIdentities,
  EventCatalogInventoryDriftError,
  eventSearchDocumentFactoryEventTypeIdentities,
  eventSearchDocumentResponsePayloadIdentities,
  extractFactoryEventMappingIdentitiesFromOpenApi,
  extractFactoryEventTypesFromOpenApi,
  extractFactoryResponseEventKindValuesFromOpenApi,
  extractFactoryResponseEventPayloadNamesFromOpenApi,
  extractFactoryResponseEventPhaseValuesFromOpenApi,
  factoryEventCatalogMappingIdentities,
  factoryEventCatalogTypeIdentities,
  factoryEventMappingIdentity,
  factoryResponseEventCatalogKindIdentities,
  factoryResponseEventCatalogPayloadIdentities,
  factoryResponseEventCatalogPhaseIdentities,
  resolveEventCorpus,
} from "@/lib/references/events";

describe("compareEventCatalogInventoryIdentities", () => {
  test("matches equal identity sets regardless of order", () => {
    const result = compareEventCatalogInventoryIdentities(
      [
        "RUN_REQUEST→RunRequestEventPayload",
        "ARTIFACT_CREATED→ArtifactCreatedEventPayload",
      ],
      [
        "ARTIFACT_CREATED→ArtifactCreatedEventPayload",
        "RUN_REQUEST→RunRequestEventPayload",
      ],
      "event type→payload mapping",
    );
    expect(result).toEqual({
      ok: true,
      resolvedCount: 2,
      renderedCount: 2,
    });
  });

  test("reports missing mappings with an actionable message", () => {
    const missing = factoryEventMappingIdentity(
      "RUN_REQUEST",
      "RunRequestEventPayload",
    );
    const result = compareEventCatalogInventoryIdentities(
      [missing, "ARTIFACT_CREATED→ArtifactCreatedEventPayload"],
      ["ARTIFACT_CREATED→ArtifactCreatedEventPayload"],
      "event type→payload mapping",
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected mismatch");
    }
    expect(result.missingFromInventory).toEqual([missing]);
    expect(result.message).toContain(missing);
    expect(result.message).toContain("event type→payload mapping");
  });

  test("reports unexpected extras with an actionable message", () => {
    const result = compareEventCatalogInventoryIdentities(
      ["FactoryResponseEventMessagePayload"],
      ["FactoryResponseEventMessagePayload", "InventedResponsePayload"],
      "response-event payload",
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected mismatch");
    }
    expect(result.extraInInventory).toEqual(["InventedResponsePayload"]);
    expect(result.message).toContain("InventedResponsePayload");
    expect(result.message).toContain("unexpected");
  });
});

describe("W09 FactoryEvent catalog inventory drift (live OpenAPI)", () => {
  test("cataloged discriminator mappings match live packaged OpenAPI dynamically", () => {
    const corpus = resolveEventCorpus();
    const liveTypes = extractFactoryEventTypesFromOpenApi(
      corpus.openapi.document,
    );
    const liveMappings = extractFactoryEventMappingIdentitiesFromOpenApi(
      corpus.openapi.document,
    );
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);
    const renderedTypes = factoryEventCatalogTypeIdentities(catalog);
    const renderedMappings = factoryEventCatalogMappingIdentities(catalog);

    // Dynamic completeness — baseline observation only, not a frozen quota.
    expect(liveTypes.length).toBeGreaterThanOrEqual(31);
    expect(liveMappings.length).toBe(liveTypes.length);
    expect(renderedTypes.length).toBe(liveTypes.length);
    expect(renderedMappings.length).toBe(liveMappings.length);

    const typeDrift = assertEventCatalogInventoryMatchesLive(
      liveTypes,
      renderedTypes,
      "event type",
    );
    expect(typeDrift).toEqual({
      ok: true,
      resolvedCount: liveTypes.length,
      renderedCount: renderedTypes.length,
    });

    const mappingDrift = assertEventCatalogInventoryMatchesLive(
      liveMappings,
      renderedMappings,
      "event type→payload mapping",
    );
    expect(mappingDrift).toEqual({
      ok: true,
      resolvedCount: liveMappings.length,
      renderedCount: renderedMappings.length,
    });
  });

  test("omitting a FactoryEvent discriminator mapping fails naming the missing type→payload", () => {
    const corpus = resolveEventCorpus();
    const liveMappings = extractFactoryEventMappingIdentitiesFromOpenApi(
      corpus.openapi.document,
    );
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);
    expect(catalog.mappings.length).toBeGreaterThan(1);

    const omitted = catalog.mappings[0];
    if (omitted === undefined) {
      throw new Error("expected at least one FactoryEvent mapping");
    }
    const incomplete = {
      ...catalog,
      mappings: catalog.mappings.slice(1),
    };
    const omittedIdentity = factoryEventMappingIdentity(
      omitted.eventType,
      omitted.payloadSchemaName,
    );

    expect(() =>
      assertEventCatalogInventoryMatchesLive(
        liveMappings,
        factoryEventCatalogMappingIdentities(incomplete),
        "event type→payload mapping",
      ),
    ).toThrow(EventCatalogInventoryDriftError);

    try {
      assertEventCatalogInventoryMatchesLive(
        liveMappings,
        factoryEventCatalogMappingIdentities(incomplete),
        "event type→payload mapping",
      );
    } catch (error) {
      expect(error).toBeInstanceOf(EventCatalogInventoryDriftError);
      const drift = error as EventCatalogInventoryDriftError;
      expect(drift.missingFromInventory).toContain(omittedIdentity);
      expect(drift.message).toContain(omittedIdentity);
      expect(drift.message).toContain(omitted.eventType);
      expect(drift.identityKind).toBe("event type→payload mapping");
    }
  });

  test("unexpected extra FactoryEvent mapping fails naming the invented identity", () => {
    const corpus = resolveEventCorpus();
    const liveMappings = extractFactoryEventMappingIdentitiesFromOpenApi(
      corpus.openapi.document,
    );
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);
    const firstMapping = catalog.mappings[0];
    if (firstMapping === undefined) {
      throw new Error("expected at least one FactoryEvent mapping");
    }
    const invented = factoryEventMappingIdentity(
      "INVENTED_EVENT",
      "InventedEventPayload",
    );
    const withExtra = {
      ...catalog,
      mappings: [
        ...catalog.mappings,
        {
          eventType: "INVENTED_EVENT",
          payloadSchemaName: "InventedEventPayload",
          payloadSchemaRef: "#/components/schemas/InventedEventPayload",
          payloadAddress: firstMapping.payloadAddress,
          payloadSchemaPointerAnchor: "schema-invented",
          eventTypeAnchor: "event-invented",
          payloadExample: {
            ...firstMapping.payloadExample,
            id: "factory-event-payload-json-invented-event-payload",
            payloadSchemaName: "InventedEventPayload",
            title: "InventedEventPayload example",
            eventIdentity: "INVENTED_EVENT",
          },
        },
      ],
    };

    const drift = compareEventCatalogInventoryIdentities(
      liveMappings,
      factoryEventCatalogMappingIdentities(withExtra),
      "event type→payload mapping",
    );
    expect(drift.ok).toBe(false);
    if (drift.ok) {
      throw new Error("expected extra mapping drift");
    }
    expect(drift.extraInInventory).toContain(invented);
    expect(drift.message).toContain(invented);
  });
});

describe("W09 FactoryResponseEvent catalog inventory drift (live OpenAPI)", () => {
  test("cataloged payload / kind / phase inventories match live packaged OpenAPI dynamically", () => {
    const corpus = resolveEventCorpus();
    const livePayloads = extractFactoryResponseEventPayloadNamesFromOpenApi(
      corpus.openapi.document,
    );
    const liveKinds = extractFactoryResponseEventKindValuesFromOpenApi(
      corpus.openapi.document,
    );
    const livePhases = extractFactoryResponseEventPhaseValuesFromOpenApi(
      corpus.openapi.document,
    );
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);

    // Dynamic completeness — baseline observation only, not a frozen quota.
    expect(livePayloads.length).toBeGreaterThanOrEqual(14);
    expect(liveKinds.length).toBeGreaterThan(0);
    expect(livePhases.length).toBeGreaterThan(0);

    expect(
      assertEventCatalogInventoryMatchesLive(
        livePayloads,
        factoryResponseEventCatalogPayloadIdentities(catalog),
        "response-event payload",
      ),
    ).toEqual({
      ok: true,
      resolvedCount: livePayloads.length,
      renderedCount: livePayloads.length,
    });

    expect(
      assertEventCatalogInventoryMatchesLive(
        liveKinds,
        factoryResponseEventCatalogKindIdentities(catalog),
        "response-event kind",
      ),
    ).toEqual({
      ok: true,
      resolvedCount: liveKinds.length,
      renderedCount: liveKinds.length,
    });

    expect(
      assertEventCatalogInventoryMatchesLive(
        livePhases,
        factoryResponseEventCatalogPhaseIdentities(catalog),
        "response-event phase",
      ),
    ).toEqual({
      ok: true,
      resolvedCount: livePhases.length,
      renderedCount: livePhases.length,
    });
  });

  test("omitting a FactoryResponseEvent payload variant fails naming the missing schema", () => {
    const corpus = resolveEventCorpus();
    const livePayloads = extractFactoryResponseEventPayloadNamesFromOpenApi(
      corpus.openapi.document,
    );
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);
    expect(catalog.payloadVariants.length).toBeGreaterThan(1);

    const omitted = catalog.payloadVariants[0];
    if (omitted === undefined) {
      throw new Error("expected at least one response payload variant");
    }
    const incomplete = {
      ...catalog,
      payloadVariants: catalog.payloadVariants.slice(1),
    };

    try {
      assertEventCatalogInventoryMatchesLive(
        livePayloads,
        factoryResponseEventCatalogPayloadIdentities(incomplete),
        "response-event payload",
      );
      throw new Error("expected payload drift");
    } catch (error) {
      expect(error).toBeInstanceOf(EventCatalogInventoryDriftError);
      const drift = error as EventCatalogInventoryDriftError;
      expect(drift.missingFromInventory).toContain(omitted.payloadSchemaName);
      expect(drift.message).toContain(omitted.payloadSchemaName);
      expect(drift.identityKind).toBe("response-event payload");
    }
  });

  test("omitting a FactoryResponseEvent kind fails naming the missing enum value", () => {
    const corpus = resolveEventCorpus();
    const liveKinds = extractFactoryResponseEventKindValuesFromOpenApi(
      corpus.openapi.document,
    );
    const catalog = buildFactoryResponseEventCatalog(corpus.openapi.document);
    expect(catalog.kind.values.length).toBeGreaterThan(1);

    const omitted = catalog.kind.values[0];
    if (omitted === undefined) {
      throw new Error("expected at least one kind value");
    }
    const incomplete = {
      ...catalog,
      kind: {
        ...catalog.kind,
        values: catalog.kind.values.slice(1),
      },
    };

    try {
      assertEventCatalogInventoryMatchesLive(
        liveKinds,
        factoryResponseEventCatalogKindIdentities(incomplete),
        "response-event kind",
      );
      throw new Error("expected kind drift");
    } catch (error) {
      expect(error).toBeInstanceOf(EventCatalogInventoryDriftError);
      const drift = error as EventCatalogInventoryDriftError;
      expect(drift.missingFromInventory).toContain(omitted);
      expect(drift.message).toContain(omitted);
      expect(drift.identityKind).toBe("response-event kind");
    }
  });
});

describe("W09 event search-document inventory drift (live OpenAPI)", () => {
  test("search documents cover every live FactoryEvent type and response payload", () => {
    const corpus = resolveEventCorpus();
    const liveTypes = extractFactoryEventTypesFromOpenApi(
      corpus.openapi.document,
    );
    const livePayloads = extractFactoryResponseEventPayloadNamesFromOpenApi(
      corpus.openapi.document,
    );
    const factoryCatalog = buildFactoryEventCatalog(corpus.openapi.document);
    const responseCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );
    const search = buildEventCorpusSearchDocuments(
      factoryCatalog,
      responseCatalog,
    );

    expect(
      assertEventCatalogInventoryMatchesLive(
        liveTypes,
        eventSearchDocumentFactoryEventTypeIdentities(search),
        "event type",
      ),
    ).toEqual({
      ok: true,
      resolvedCount: liveTypes.length,
      renderedCount: liveTypes.length,
    });

    expect(
      assertEventCatalogInventoryMatchesLive(
        livePayloads,
        eventSearchDocumentResponsePayloadIdentities(search),
        "response-event payload",
      ),
    ).toEqual({
      ok: true,
      resolvedCount: livePayloads.length,
      renderedCount: livePayloads.length,
    });
  });

  test("omitting a search-document event type fails naming the missing type", () => {
    const corpus = resolveEventCorpus();
    const liveTypes = extractFactoryEventTypesFromOpenApi(
      corpus.openapi.document,
    );
    const factoryCatalog = buildFactoryEventCatalog(corpus.openapi.document);
    const responseCatalog = buildFactoryResponseEventCatalog(
      corpus.openapi.document,
    );
    const search = buildEventCorpusSearchDocuments(
      factoryCatalog,
      responseCatalog,
    );
    expect(search.navEntries.length).toBeGreaterThan(1);

    const factoryEntries = search.navEntries.filter(
      (entry) => entry.kind === "factory-event-type",
    );
    const omitted = factoryEntries[0];
    if (omitted === undefined) {
      throw new Error("expected a factory-event-type nav entry");
    }
    const incomplete = {
      ...search,
      navEntries: search.navEntries.filter((entry) => entry.id !== omitted.id),
    };

    try {
      assertEventCatalogInventoryMatchesLive(
        liveTypes,
        eventSearchDocumentFactoryEventTypeIdentities(incomplete),
        "event type",
      );
      throw new Error("expected search-document type drift");
    } catch (error) {
      expect(error).toBeInstanceOf(EventCatalogInventoryDriftError);
      const drift = error as EventCatalogInventoryDriftError;
      expect(drift.missingFromInventory).toContain(omitted.label);
      expect(drift.message).toContain(omitted.label);
    }
  });
});
