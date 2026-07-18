/**
 * Always-on W19 reference-surface reduced-motion proofs. Served-page probes
 * live in `a11y-reference-reduced-motion-page.test.ts` (opt-in via
 * VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ApiNavigationVerificationHarness } from "@/components/references/api/api-navigation-verification-harness";
import type { ApiOperationDetail } from "@/components/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/components/references/api/operation-navigation";
import { EventPayloadVariant } from "@/components/references/events";
import { focusReferenceHashTarget as focusProductionHashTarget } from "@/components/references/shared/ReferenceHashNavigation";
import { FactorySchemaReference } from "@/content/docs/references/factory-schema/FactorySchemaReference";
import {
  buildFactoryEventCatalog,
  resolveEventCorpus,
} from "@/lib/references/events";
import {
  expectReferenceReducedMotionChrome,
  expectReferenceReducedMotionHashFocus,
  MOBILE_DRAWER_MOTION_CHROME,
  REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS,
  referenceHashFocusScrollBehavior,
} from "@/lib/verify/a11y-reference-reduced-motion-contract";
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

describe("reference reduced-motion (always-on)", () => {
  test("contract covers primary hash routes and shared scroll behavior", () => {
    expect([...REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS]).toEqual([
      "references-api",
      "references-events",
      "references-factory-schema",
    ]);
    expect(referenceHashFocusScrollBehavior(true)).toBe("auto");
    expect(referenceHashFocusScrollBehavior(false)).toBe("smooth");

    for (const route of REFERENCE_SURFACE_ROUTES) {
      if (route.kind === "reference") {
        expect(REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS.includes(route.id)).toBe(
          true,
        );
      }
    }
  });

  test("API harness hash focus uses instant scroll under reduced motion", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    const probe = expectReferenceReducedMotionHashFocus(
      container,
      "references-api",
    );
    expect(probe.hashFocus?.focused).toBe(true);
    expect(probe.hashFocus?.contentUnchanged).toBe(true);
  });

  test("events payload hash focus honors reduceMotion option", () => {
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

    const target = container.querySelector(
      `[data-event-type="${mapping.eventType}"]`,
    ) as HTMLElement | null;
    expect(target).not.toBeNull();
    expect(target?.id).toBe(mapping.eventTypeAnchor);
    if (!target?.id) {
      return;
    }

    const before = target.innerHTML;
    const focused = focusProductionHashTarget(container, `#${target.id}`, {
      reduceMotion: true,
    });
    expect(focused).toBe(target);
    expect(document.activeElement).toBe(target);
    expect(target.innerHTML).toBe(before);
  });

  test("factory-schema hash focus stays instant under reduced motion", () => {
    const { container } = render(<FactorySchemaReference />);
    const probe = expectReferenceReducedMotionHashFocus(
      container,
      "references-factory-schema",
    );
    expect(probe.hashFocus?.ok).toBe(true);
  });

  test("marked motion chrome carries reduce-class kill-switch fragments", () => {
    document.body.innerHTML = `
      <div data-motion-chrome="mobile-drawer-backdrop"
        class="transition-opacity duration-300 motion-reduce:transition-none"></div>
      <aside
        data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"
        class="transition-transform duration-300 motion-reduce:transition-none motion-reduce:duration-0"
        style="transition-duration: 0.01ms; animation-duration: 0s;"
      >drawer</aside>
    `;

    const probes = expectReferenceReducedMotionChrome(
      document,
      "references-api",
      {
        assumeReducedMotionPreference: true,
        requirePresent: true,
      },
    );
    expect(probes.filter((probe) => probe.found).length).toBe(2);
    for (const probe of probes) {
      expect(probe.hasReduceClasses).toBe(true);
      expect(probe.isReduced).toBe(true);
    }
  });
});
