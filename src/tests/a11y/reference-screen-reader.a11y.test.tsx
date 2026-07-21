/**
 * Always-on W19 reference-surface screen-reader / non-color status proofs.
 * Served-page probes live in `a11y-reference-screen-reader-page.test.ts`
 * (opt-in via VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { FactorySchemaReference } from "@/content/docs/references/factory-schema/FactorySchemaReference";
import { ApiNavigationVerificationHarness } from "@/features/references/api/api-navigation-verification-harness";
import type { ApiOperationDetail } from "@/features/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/features/references/api/operation-navigation";
import {
  type EventStreamOperationSummaryModel,
  EventStreamOperationsList,
  eventCanonicalityPresentationForRole,
} from "@/features/references/events";
import { SchemaRequiredBadge } from "@/features/references/schema";
import { CopyableReferenceAnchor } from "@/features/references/shared/CopyableReferenceAnchor";
import { ReferenceLifecycleVisibility } from "@/features/references/shared/ReferenceLifecycleVisibility";
import {
  expectCoherentReferenceHeadingHierarchy,
  expectReferenceNonColorStatus,
  expectReferenceScreenReaderChrome,
  listRequiredReferenceLabeledControls,
  listRequiredReferenceNonColorStatus,
} from "@/lib/verify/a11y-reference-screen-reader-contract";
import { REFERENCE_SURFACE_ROUTES } from "@/lib/verify/a11y-reference-surface-contract";
import { expectNoSeriousAxeViolations } from "@/tests/a11y/axe";

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

describe("reference screen-reader labels, headings, and non-color status (always-on)", () => {
  test("contract requires labeled chrome and non-color status on primary reference routes", () => {
    const labeledByRoute = Object.fromEntries(
      REFERENCE_SURFACE_ROUTES.map((route) => [
        route.id,
        listRequiredReferenceLabeledControls(route.id).map((spec) => spec.id),
      ]),
    );
    const statusByRoute = Object.fromEntries(
      REFERENCE_SURFACE_ROUTES.map((route) => [
        route.id,
        listRequiredReferenceNonColorStatus(route.id).map((spec) => spec.id),
      ]),
    );

    expect(labeledByRoute["references-api"]).toContain("api-filter-input");
    expect(labeledByRoute["references-api"]).toContain("api-copy-link");
    expect(statusByRoute["references-api"]).toEqual(["api-http-method"]);
    expect(labeledByRoute["references-events"]).toContain("events-nav-link");
    expect(statusByRoute["references-events"]).toEqual(["events-canonicality"]);
    expect(labeledByRoute["references-factory-schema"]).toContain(
      "schema-filter-input",
    );
    expect(statusByRoute["references-factory-schema"]).toEqual([
      "schema-required-optional",
    ]);
  });

  test("color-only status fixtures fail the non-color gate", () => {
    document.body.innerHTML = `
      <span data-api-method-badge="" class="bg-green-500 text-transparent"></span>
    `;
    expect(() =>
      expectReferenceNonColorStatus(document, "references-api"),
    ).toThrow(/color-only|missing text cue/);
  });

  test("API harness exposes labeled chrome, HTTP method text, coherent headings, and no serious axe violations", async () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    expect(() =>
      expectReferenceScreenReaderChrome(container, "references-api"),
    ).not.toThrow();
    expect(() =>
      expectCoherentReferenceHeadingHierarchy(container, {
        context: "API harness",
      }),
    ).not.toThrow();

    const methodBadge = container.querySelector("[data-api-method-badge]");
    expect(methodBadge?.textContent?.trim()).toBe("POST");
    expect(
      screen.getByRole("searchbox", {
        name: /filter operations/i,
      }),
    ).toBeTruthy();

    await expectNoSeriousAxeViolations(container);
  });

  test("events stream summaries expose canonicality text cues, labeled links, coherent headings, and no serious axe violations", async () => {
    const { container } = render(
      <div>
        <EventStreamOperationsList summaries={[canonicalStreamSummary]} />
        <section id="RUN_REQUEST">
          <CopyableReferenceAnchor anchor="RUN_REQUEST" family="events" />
        </section>
      </div>,
    );

    expect(() =>
      expectReferenceScreenReaderChrome(container, "references-events"),
    ).not.toThrow();
    expect(() =>
      expectCoherentReferenceHeadingHierarchy(container, {
        context: "events stream fixture",
      }),
    ).not.toThrow();

    const badge = screen.getByTestId("event-canonicality-badge");
    expect(badge.textContent).toMatch(/Canonical/i);
    expect(badge.textContent).toMatch(/Preferred/i);
    const methodSpan = container.querySelector(
      "[data-testid='event-stream-operation-summary'] .uppercase",
    );
    expect(methodSpan?.textContent?.trim().toLowerCase()).toBe("get");

    await expectNoSeriousAxeViolations(container);
  });

  test("factory-schema exposes labeled filter/$ref chrome, required/optional text, coherent headings, and no serious axe violations", async () => {
    const { container } = render(<FactorySchemaReference />);

    expect(() =>
      expectReferenceScreenReaderChrome(container, "references-factory-schema"),
    ).not.toThrow();
    expect(() =>
      expectCoherentReferenceHeadingHierarchy(container, {
        context: "factory-schema",
      }),
    ).not.toThrow();

    const requiredBadge = container.querySelector(
      '[data-schema-required="true"]',
    );
    const optionalBadge = container.querySelector(
      '[data-schema-required="false"]',
    );
    expect(requiredBadge?.textContent).toMatch(/Required/i);
    expect(optionalBadge?.textContent).toMatch(/Optional/i);
    expect(
      screen.getByRole("searchbox", {
        name: /filter schema definitions and fields/i,
      }),
    ).toBeTruthy();

    await expectNoSeriousAxeViolations(container);
  }, 60_000);

  test("lifecycle chrome carries text + icon cues (never color-only)", async () => {
    const { container } = render(
      <ReferenceLifecycleVisibility
        lifecycle={{ state: "deprecated", since: "1.2.0" }}
        visibility="public"
      />,
    );

    expect(() =>
      expectReferenceNonColorStatus(container, "authored-factory"),
    ).not.toThrow();
    const chip = container.querySelector("[data-lifecycle-state='deprecated']");
    expect(chip?.textContent).toMatch(/Lifecycle/i);
    expect(chip?.textContent).toMatch(/Deprecated/i);
    await expectNoSeriousAxeViolations(container);

    cleanup();
    const { container: badgeRoot } = render(
      <SchemaRequiredBadge required={false} />,
    );
    expect(badgeRoot.textContent).toMatch(/Optional/i);
    await expectNoSeriousAxeViolations(badgeRoot);
  });
});
