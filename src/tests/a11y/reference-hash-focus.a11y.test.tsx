/**
 * Always-on W19 reference-surface hash focus, sticky visibility, and mobile
 * collapse proofs. Served-page probes live in
 * `a11y-reference-hash-focus-page.test.ts` (opt-in via
 * VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { FactorySchemaReference } from "@/content/docs/references/factory-schema/FactorySchemaReference";
import { ApiNavigationVerificationHarness } from "@/features/references/api/api-navigation-verification-harness";
import type { ApiOperationDetail } from "@/features/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/features/references/api/operation-navigation";
import { EventPayloadVariant } from "@/features/references/events";
import {
  buildFactoryEventCatalog,
  resolveEventCorpus,
} from "@/lib/references/events";
import {
  expectReferenceHashFocus,
  expectReferenceMobileNav,
  listRequiredReferenceHashTargets,
  listRequiredReferenceMobileNavs,
} from "@/lib/verify/a11y-reference-hash-focus-contract";
import { REFERENCE_SURFACE_ROUTES } from "@/lib/verify/a11y-reference-surface-contract";

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
  summary: "Submit work",
  parameters: [],
  responses: [],
};

const detailsByAnchor = new Map<string, ApiOperationDetail>([
  ["submitWorkBySessionId", sampleDetail],
]);

describe("reference hash focus, sticky visibility, and mobile collapse (always-on)", () => {
  test("contract requires hash targets and API mobile nav on primary routes", () => {
    const hashByRoute = Object.fromEntries(
      REFERENCE_SURFACE_ROUTES.map((route) => [
        route.id,
        listRequiredReferenceHashTargets(route.id).map((spec) => spec.id),
      ]),
    );
    const mobileByRoute = Object.fromEntries(
      REFERENCE_SURFACE_ROUTES.map((route) => [
        route.id,
        listRequiredReferenceMobileNavs(route.id).map((spec) => spec.id),
      ]),
    );

    expect(hashByRoute["references-api"]).toEqual(["api-operation-section"]);
    expect(hashByRoute["references-events"]).toEqual(["event-payload-variant"]);
    expect(hashByRoute["references-factory-schema"]).toEqual([
      "schema-definition",
    ]);
    expect(mobileByRoute["references-api"]).toEqual(["api-mobile-navigator"]);
    expect(mobileByRoute["references-events"]).toEqual([]);
  });

  test("API harness focuses operation hashes without rewriting content and collapses mobile nav", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    const section = container.querySelector(
      "#submitWorkBySessionId",
    ) as HTMLElement;
    expect(section.className).toMatch(/scroll-mt-/);

    expect(() =>
      expectReferenceHashFocus(container, "references-api", {
        scroll: false,
        reduceMotion: true,
      }),
    ).not.toThrow();
    expect(document.activeElement).toBe(section);

    const mobile = container.querySelector(
      "[data-api-mobile-navigator]",
    ) as HTMLDetailsElement;
    expect(mobile.open).toBe(false);
    expect(() =>
      expectReferenceMobileNav(container, "references-api"),
    ).not.toThrow();
    expect(mobile.open).toBe(false);
  });

  test("event payload variants accept hash focus with scroll-margin clearance", () => {
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
      <EventPayloadVariant definition={definition} mapping={mapping} />,
    );

    expect(() =>
      expectReferenceHashFocus(container, "references-events", {
        scroll: false,
        reduceMotion: true,
      }),
    ).not.toThrow();

    const target = container.querySelector(
      `[data-event-type="${mapping.eventType}"]`,
    ) as HTMLElement;
    expect(target.id).toBe(mapping.eventTypeAnchor);
    expect(target.className).toMatch(/scroll-mt-/);
    expect(document.activeElement).toBe(target);
  });

  test("FactorySchemaReference definitions accept hash focus with scroll-margin clearance", () => {
    const { container } = render(<FactorySchemaReference />);

    expect(() =>
      expectReferenceHashFocus(container, "references-factory-schema", {
        scroll: false,
        reduceMotion: true,
      }),
    ).not.toThrow();

    const definition = container.querySelector(
      "[data-schema-definition-pointer]",
    ) as HTMLElement;
    expect(definition).toBeTruthy();
    expect(definition.id.length).toBeGreaterThan(0);
    expect(definition.className).toMatch(/scroll-mt-/);
    expect(definition.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(definition);
  });
});
