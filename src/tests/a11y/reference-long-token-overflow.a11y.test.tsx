/**
 * Always-on W19 reference-surface long-token overflow proofs. Served-page
 * probes live in `a11y-reference-long-token-overflow-page.test.ts` (opt-in via
 * VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ApiNavigationVerificationHarness } from "@/components/references/api/api-navigation-verification-harness";
import type { ApiOperationDetail } from "@/components/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/components/references/api/operation-navigation";
import { EventStreamOperationSummary } from "@/components/references/events";
import type { EventStreamOperationSummaryModel } from "@/components/references/events/event-stream-display";
import { SchemaConstraintList } from "@/components/references/schema/schema-constraint-list";
import { SchemaFieldRow } from "@/components/references/schema/schema-field-row";
import { SchemaDefinitionEmbed } from "@/components/references/shared/SchemaDefinitionEmbed";
import { FactorySchemaReference } from "@/content/docs/references/factory-schema/FactorySchemaReference";
import {
  createSchemaDefinitionModel,
  createSchemaFieldModel,
} from "@/lib/references/schema-model";
import {
  expectReferenceLongTokenOverflow,
  listReferenceLongTokenOverflowViewports,
  REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS,
} from "@/lib/verify/a11y-reference-long-token-overflow-contract";
import { PAGE_OVERFLOW_TOLERANCE_PX } from "@/lib/verify/a11y-reference-surface-contract";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  for (const target of [document.documentElement, document.body]) {
    for (const prop of ["clientWidth", "scrollWidth"] as const) {
      try {
        Reflect.deleteProperty(target, prop);
      } catch {
        // ignore
      }
    }
  }
});

function stubCleanPageWidth(width: number): void {
  for (const target of [document.documentElement, document.body]) {
    Object.defineProperty(target, "clientWidth", {
      configurable: true,
      get: () => width,
    });
    Object.defineProperty(target, "scrollWidth", {
      configurable: true,
      get: () => width,
    });
  }
}

const LONG_PATH =
  "/factory-sessions/{session_id}/workers/{worker_id}/dispatch-with-an-extremely-long-unbroken-suffix-token-for-overflow-containment";

const miniNav: ApiOperationNavModel = {
  groups: [
    {
      tag: "Work",
      items: [
        {
          id: "dispatchLong",
          method: "post",
          path: LONG_PATH,
          operationId: "dispatchLong",
          anchor: "dispatchLong",
          summary: "Dispatch with long path",
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
  path: LONG_PATH,
  operationId: "dispatchLong",
  anchor: "dispatchLong",
  summary: "Dispatch with long path",
  parameters: [],
  responses: [],
};

const detailsByAnchor = new Map<string, ApiOperationDetail>([
  ["dispatchLong", sampleDetail],
]);

const eventSummary: EventStreamOperationSummaryModel = {
  path: LONG_PATH,
  method: "get",
  operationId: "listSessionEvents",
  role: "canonical",
  roleLabel: "Canonical session-scoped FactoryEvent stream",
  payloadRoot: "FactoryEvent",
  canonicality: {
    role: "canonical",
    badgeLabel: "Canonical",
    isPreferredSessionStream: true,
    isCompatibilityOnly: false,
    isCanonicalReplayState: true,
    description:
      "Preferred session-scoped FactoryEvent stream. Use this stream for canonical replay and catch-up.",
  },
  catalogAnchor: "FactoryEvent",
};

describe("reference long-token overflow (always-on)", () => {
  test("contract focuses mobile and zoomed layouts", () => {
    expect([...REFERENCE_LONG_TOKEN_OVERFLOW_VIEWPORT_IDS]).toEqual([
      "mobile",
      "zoomed",
    ]);
    expect(listReferenceLongTokenOverflowViewports().map((v) => v.id)).toEqual([
      "mobile",
      "zoomed",
    ]);
  });

  test("API harness long paths stay contained without page overflow", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    for (const viewport of listReferenceLongTokenOverflowViewports()) {
      stubCleanPageWidth(viewport.width);
      const probe = expectReferenceLongTokenOverflow(
        container,
        "references-api",
        document,
      );
      expect(probe.ok).toBe(true);
      expect(probe.overflow.page.overflowPx).toBeLessThanOrEqual(
        PAGE_OVERFLOW_TOLERANCE_PX,
      );
      const path = container.querySelector(
        "[data-api-operation-section] h2 code",
      );
      expect(path?.className).toContain("break-all");
      expect(path?.textContent).toBe(LONG_PATH);
    }
  });

  test("events stream long paths use break-all containment", () => {
    const { container } = render(
      <EventStreamOperationSummary summary={eventSummary} />,
    );

    stubCleanPageWidth(390);
    const probe = expectReferenceLongTokenOverflow(
      container,
      "references-events",
      document,
    );
    expect(probe.ok).toBe(true);
    const pathCode = container.querySelector("[data-event-stream-path] code");
    expect(pathCode?.className).toContain("break-all");
  });

  test("factory-schema field names and paths are contained", () => {
    const { container } = render(<FactorySchemaReference />);
    stubCleanPageWidth(512);
    const probe = expectReferenceLongTokenOverflow(
      container,
      "references-factory-schema",
      document,
    );
    expect(probe.ok).toBe(true);
    expect(container.querySelector("[data-schema-field-name]")).not.toBeNull();
    expect(
      container.querySelector("[data-schema-field-path-label]"),
    ).not.toBeNull();
  });

  test("schema field row and enum constraint contain long tokens", () => {
    const longField =
      "extremelyLongUnbrokenSchemaFieldNameForOverflowContainmentProbe";
    const { container } = render(
      <ul>
        <SchemaFieldRow
          node={{
            field: createSchemaFieldModel({
              path: `root.nested.${longField}`,
              required: true,
              typeSummary: "string",
              enum: [
                "accept",
                "passthrough",
                "extremely-long-unbroken-enum-token-value-for-overflow",
              ],
            }),
          }}
        />
        <SchemaConstraintList
          enum={[
            "alpha",
            "beta",
            "gamma-with-an-extremely-long-unbroken-token",
          ]}
        />
      </ul>,
    );

    stubCleanPageWidth(390);
    const name = container.querySelector("[data-schema-field-name]");
    const path = container.querySelector("[data-schema-field-path-label]");
    const enumCode = container.querySelector(
      '[data-schema-constraint="enum"] code',
    );
    expect(name?.className).toContain("break-all");
    expect(path?.className).toContain("truncate");
    expect(enumCode?.className).toMatch(/break-all|overflow-x-auto/);

    const probe = expectReferenceLongTokenOverflow(
      container,
      "references-factory-schema",
      document,
    );
    expect(probe.ok).toBe(true);
  });

  test("authored schema embeds contain long property names and enums", () => {
    const longName =
      "extremelyLongUnbrokenEmbedPropertyNameForOverflowContainment";
    const { container } = render(
      <SchemaDefinitionEmbed
        definition={createSchemaDefinitionModel({
          address: {
            publicArtifactId: "factory",
            pointer: "#/definitions/EmbedProbe",
          },
          title: "EmbedProbe",
          properties: {
            [longName]: createSchemaFieldModel({
              path: longName,
              required: false,
              typeSummary: "string",
              enum: [
                "one",
                "two",
                "extremely-long-unbroken-embed-enum-token-value",
              ],
            }),
          },
        })}
      />,
    );

    stubCleanPageWidth(390);
    const name = container.querySelector("[data-schema-embed-property-name]");
    const enumNode = container.querySelector("[data-schema-embed-enum]");
    expect(name?.className).toContain("break-all");
    expect(enumNode?.className).toMatch(/break-all|overflow-x-auto/);

    document.body.appendChild(container);
    const probes = expectReferenceLongTokenOverflow(
      document,
      "authored-factory",
      document,
    );
    const nameProbe = probes.tokens.find(
      (entry) => entry.id === "authored-schema-property-name",
    );
    const enumProbe = probes.tokens.find(
      (entry) => entry.id === "authored-schema-enum",
    );
    expect(nameProbe?.found).toBe(true);
    expect(nameProbe?.allHitsContained).toBe(true);
    expect(enumProbe?.found).toBe(true);
    expect(enumProbe?.allHitsContained).toBe(true);
  });
});
