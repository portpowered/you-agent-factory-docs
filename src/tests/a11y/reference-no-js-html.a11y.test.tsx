/**
 * Always-on W19 reference-surface no-JS / static HTML readability proofs.
 * Served-page / export probes live in `a11y-reference-no-js-html-page.test.ts`
 * (opt-in via VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ApiNavigationVerificationHarness } from "@/components/references/api/api-navigation-verification-harness";
import type { ApiOperationDetail } from "@/components/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/components/references/api/operation-navigation";
import {
  EventPayloadVariant,
  type EventStreamOperationSummaryModel,
  EventStreamOperationsList,
  eventCanonicalityPresentationForRole,
} from "@/components/references/events";
import { EventEnvelopeReference } from "@/components/references/events/event-envelope-reference";
import { SchemaDefinitionEmbed } from "@/components/references/shared/SchemaDefinitionEmbed";
import { FactoryMetadataSourceSchemaEmbed } from "@/content/docs/factories/packaged/FactoryMetadataSourceSchemaEmbed";
import { FactorySchemaReference } from "@/content/docs/references/factory-schema/FactorySchemaReference";
import {
  buildFactoryEventCatalog,
  resolveEventCorpus,
} from "@/lib/references/events";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";
import {
  expectReferenceNoJsHtmlReadability,
  listRequiredReferenceNoJsFacts,
  REFERENCE_NO_JS_ROUTE_IDS,
  stripScriptsFromHtml,
} from "@/lib/verify/a11y-reference-no-js-html-contract";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const miniNav: ApiOperationNavModel = {
  groups: [
    {
      tag: "Work",
      items: [
        {
          id: "submitWorkBySessionId",
          method: "post",
          path: "/factory-sessions/{session_id}/work",
          operationId: "submitWorkBySessionId",
          anchor: "submitWorkBySessionId",
          summary: "Submit work",
          tags: ["Work"],
        },
      ],
    },
  ],
  linkCount: 1,
  operationCount: 1,
};

const sampleDetail: ApiOperationDetail = {
  method: "post",
  path: "/factory-sessions/{session_id}/work",
  operationId: "submitWorkBySessionId",
  anchor: "submitWorkBySessionId",
  summary: "Submit work for one session",
  parameters: [],
  responses: [],
};

const detailsByAnchor = new Map<string, ApiOperationDetail>([
  ["submitWorkBySessionId", sampleDetail],
]);

const canonicalStreamSummary: EventStreamOperationSummaryModel = {
  path: "/factory-sessions/{session_id}/events",
  method: "get",
  operationId: "listSessionEvents",
  role: "canonical",
  roleLabel: "Canonical session stream",
  payloadRoot: "FactoryEvent",
  canonicality: eventCanonicalityPresentationForRole("canonical"),
  catalogAnchor: "RUN_REQUEST",
};

describe("reference no-JS static HTML readability (always-on)", () => {
  test("contract covers all six representative routes", () => {
    expect(REFERENCE_NO_JS_ROUTE_IDS).toHaveLength(6);
    for (const routeId of REFERENCE_NO_JS_ROUTE_IDS) {
      expect(listRequiredReferenceNoJsFacts(routeId).length).toBeGreaterThan(0);
    }
  });

  test("API harness exposes method, path, and summary without scripts", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    const stripped = stripScriptsFromHtml(container.innerHTML);
    document.body.innerHTML = stripped;

    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "references-api",
    );
    expect(probe.ok).toBe(true);
    expect(probe.scriptsAbsent).toBe(true);
    const api = probe.facts.find(
      (entry) => entry.id === "api-operation-method-path-summary",
    );
    expect(api?.readableHitCount).toBeGreaterThan(0);
    expect(api?.sampleTexts.join(" ")).toMatch(/post/i);
    expect(api?.sampleTexts.join(" ")).toContain(
      "/factory-sessions/{session_id}/work",
    );
  });

  test("events catalog keeps type identity and envelope/payload headings", () => {
    const corpus = resolveEventCorpus();
    const catalog = buildFactoryEventCatalog(corpus.openapi.document);
    const mapping = catalog.mappings.find(
      (entry) => entry.eventType === "RUN_REQUEST",
    );
    expect(mapping).toBeDefined();
    if (!mapping) {
      return;
    }
    const definition =
      catalog.payloadDefinitionsByName[mapping.payloadSchemaName];
    expect(definition).toBeDefined();
    if (!definition) {
      return;
    }

    const { container } = render(
      <div>
        <EventStreamOperationsList summaries={[canonicalStreamSummary]} />
        <EventEnvelopeReference
          discriminatorPropertyName={catalog.discriminatorPropertyName}
          envelopeFieldsDefinition={catalog.envelopeFieldsDefinition}
        />
        <EventPayloadVariant definition={definition} mapping={mapping} />
      </div>,
    );

    const stripped = stripScriptsFromHtml(container.innerHTML);
    document.body.innerHTML = stripped;

    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "references-events",
    );
    expect(probe.ok).toBe(true);
    expect(
      probe.facts.find((entry) => entry.id === "event-type-identity")
        ?.readableHitCount,
    ).toBeGreaterThan(0);
    expect(
      probe.facts.find((entry) => entry.id === "event-envelope-heading")
        ?.readableHitCount,
    ).toBeGreaterThan(0);
    expect(
      probe.facts.find((entry) => entry.id === "event-payload-heading")
        ?.readableHitCount,
    ).toBeGreaterThan(0);
  });

  test("factory-schema page keeps field names and types in static HTML", () => {
    const { container } = render(<FactorySchemaReference />);
    const stripped = stripScriptsFromHtml(container.innerHTML);
    document.body.innerHTML = stripped;

    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "references-factory-schema",
    );
    expect(probe.ok).toBe(true);
    expect(
      probe.facts.find((entry) => entry.id === "schema-field-name")
        ?.readableHitCount,
    ).toBeGreaterThan(0);
    expect(
      probe.facts.find((entry) => entry.id === "schema-field-type")
        ?.readableHitCount,
    ).toBeGreaterThan(0);
  });

  test("authored factory embed keeps schema field names and types", () => {
    const { container } = render(<FactoryMetadataSourceSchemaEmbed />);
    const stripped = stripScriptsFromHtml(container.innerHTML);
    document.body.innerHTML = stripped;

    const probe = expectReferenceNoJsHtmlReadability(
      document,
      "authored-factory",
    );
    expect(probe.ok).toBe(true);
    expect(
      probe.facts.find((entry) => entry.id === "schema-field-name")
        ?.readableHitCount,
    ).toBeGreaterThan(0);
    expect(
      probe.facts.find((entry) => entry.id === "schema-field-type")
        ?.readableHitCount,
    ).toBeGreaterThan(0);
  });

  test("SchemaDefinitionEmbed fragment stays readable without JS", () => {
    const definition = createSchemaDefinitionModel({
      address: {
        publicArtifactId: "factory",
        pointer: "#/definitions/EmbedProbe",
      },
      title: "EmbedProbe",
      properties: {
        timeoutMs: createSchemaFieldModel({
          path: "timeoutMs",
          required: false,
          typeSummary: "integer",
        }),
      },
    });

    const { container } = render(
      <SchemaDefinitionEmbed definition={definition} />,
    );
    expect(container.textContent).toContain("timeoutMs");
    expect(container.innerHTML).not.toMatch(/<script\b/i);
  });
});
