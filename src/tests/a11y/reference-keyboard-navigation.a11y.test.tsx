/**
 * Always-on W19 reference-surface keyboard navigation proofs.
 * Served-page probes live in `a11y-reference-keyboard-page.test.ts`
 * (opt-in via VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FactorySchemaReference } from "@/content/docs/references/factory-schema/FactorySchemaReference";
import { ApiNavigationVerificationHarness } from "@/features/references/api/api-navigation-verification-harness";
import type { ApiOperationDetail } from "@/features/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/features/references/api/operation-navigation";
import { EventCatalogNavigation } from "@/features/references/events/event-catalog-navigation";
import { SchemaFieldTree } from "@/features/references/schema/schema-field-tree";
import type { SchemaFieldTreeNode } from "@/features/references/schema/types";
import { CopyableReferenceAnchor } from "@/features/references/shared/CopyableReferenceAnchor";
import type { EventCatalogNavEntry } from "@/lib/references/events";
import { createSchemaFieldModel } from "@/lib/references/schema-model";
import {
  expectReferenceKeyboardChrome,
  listRequiredReferenceKeyboardControls,
} from "@/lib/verify/a11y-reference-keyboard-contract";
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

const eventNavEntries: EventCatalogNavEntry[] = [
  {
    id: "RUN_REQUEST",
    label: "RUN_REQUEST",
    anchor: "RUN_REQUEST",
    identityText: "RUN_REQUEST",
    aliases: ["run-request"],
    description: "FactoryEvent run request",
    kind: "factory-event-type",
  },
];

const nestedSchemaNodes: SchemaFieldTreeNode[] = [
  {
    field: createSchemaFieldModel({
      path: "tools",
      typeSummary: "object",
      required: false,
      description: "Tool configuration.",
    }),
    children: [
      {
        field: createSchemaFieldModel({
          path: "tools.timeout",
          typeSummary: "number",
          required: true,
        }),
      },
    ],
  },
];

describe("reference keyboard navigation (always-on)", () => {
  test("contract requires keyboard chrome on API, events, and factory-schema routes", () => {
    const requiredByRoute = Object.fromEntries(
      REFERENCE_SURFACE_ROUTES.map((route) => [
        route.id,
        listRequiredReferenceKeyboardControls(route.id).map((spec) => spec.id),
      ]),
    );

    expect(requiredByRoute["references-api"]).toContain("api-filter-input");
    expect(requiredByRoute["references-api"]).toContain(
      "api-mobile-nav-summary",
    );
    expect(requiredByRoute["references-api"]).toContain("api-copy-link");
    expect(requiredByRoute["references-events"]).toContain("events-nav-link");
    expect(requiredByRoute["references-events"]).toContain(
      "events-anchor-copy",
    );
    expect(requiredByRoute["references-events"]).not.toContain(
      "events-filter-query",
    );
    expect(requiredByRoute["references-factory-schema"]).toContain(
      "schema-filter-input",
    );
    expect(requiredByRoute["references-factory-schema"]).toContain(
      "schema-ref-link",
    );
  });

  test("pointer-only required control fixtures fail the keyboard gate", () => {
    document.body.innerHTML = `
      <input data-api-operation-filter="input" class="focus-visible:ring-2" />
      <details data-api-mobile-navigator="">
        <summary class="focus-visible:ring-2">Ops</summary>
      </details>
      <a href="#submit" data-api-operation-nav-link="submit" class="focus-visible:ring-2">Submit</a>
      <div data-api-operation-copy-link="submit" role="button">Copy</div>
    `;

    expect(() =>
      expectReferenceKeyboardChrome(document, "references-api"),
    ).toThrow(/pointer-only|not keyboard focusable/);
  });

  test("API harness filters, mobile nav, nav links, and copy are keyboard operable", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    expect(() =>
      expectReferenceKeyboardChrome(container, "references-api"),
    ).not.toThrow();

    const filter = container.querySelector(
      '[data-api-operation-filter="input"]',
    ) as HTMLInputElement;
    filter.focus();
    expect(document.activeElement).toBe(filter);
    await user.keyboard("submit");
    expect(filter.value).toBe("submit");

    const clear = container.querySelector(
      '[data-api-operation-filter="clear"]',
    ) as HTMLButtonElement;
    expect(clear).not.toBeNull();
    clear.focus();
    expect(document.activeElement).toBe(clear);
    await user.keyboard("{Enter}");
    expect(filter.value).toBe("");

    const mobile = container.querySelector(
      "[data-api-mobile-navigator]",
    ) as HTMLDetailsElement;
    const summary = mobile.querySelector("summary") as HTMLElement;
    summary.focus();
    expect(document.activeElement).toBe(summary);
    fireEvent.click(summary);
    expect(mobile.open).toBe(true);

    const navLink = container.querySelector(
      "[data-api-operation-nav-link]",
    ) as HTMLAnchorElement;
    navLink.focus();
    expect(document.activeElement).toBe(navLink);

    const copy = container.querySelector(
      "[data-api-operation-copy-link]",
    ) as HTMLButtonElement;
    copy.focus();
    expect(document.activeElement).toBe(copy);
  });

  test("events catalog filter, anchors, and copy remain keyboard operable", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div>
        <EventCatalogNavigation entries={eventNavEntries} />
        <a
          className="focus-visible:ring-2"
          data-event-catalog-link=""
          href="#RUN_REQUEST"
        >
          RUN_REQUEST
        </a>
        <section id="RUN_REQUEST">
          <CopyableReferenceAnchor anchor="RUN_REQUEST" family="events" />
        </section>
      </div>,
    );

    expect(() =>
      expectReferenceKeyboardChrome(container, "references-events"),
    ).not.toThrow();

    const query = screen.getByRole("searchbox", { name: /event or payload/i });
    query.focus();
    expect(document.activeElement).toBe(query);
    await user.keyboard("RUN");
    expect((query as HTMLInputElement).value).toBe("RUN");

    const catalogLink = container.querySelector(
      "[data-event-catalog-link]",
    ) as HTMLAnchorElement;
    expect(catalogLink).not.toBeNull();
    catalogLink.focus();
    expect(document.activeElement).toBe(catalogLink);

    const navLink = container.querySelector(
      "[data-event-catalog-nav-link]",
    ) as HTMLAnchorElement;
    expect(navLink).not.toBeNull();
    navLink.focus();
    expect(document.activeElement).toBe(navLink);

    const copy = container.querySelector(
      "[data-reference-anchor-copy]",
    ) as HTMLButtonElement;
    copy.focus();
    expect(document.activeElement).toBe(copy);
  });

  test("factory-schema filter and $ref links remain keyboard operable", async () => {
    const user = userEvent.setup();
    const { container } = render(<FactorySchemaReference />);

    expect(() =>
      expectReferenceKeyboardChrome(container, "references-factory-schema"),
    ).not.toThrow();

    const filter = container.querySelector(
      '[data-schema-filter="input"]',
    ) as HTMLInputElement;
    expect(filter).not.toBeNull();
    filter.focus();
    expect(document.activeElement).toBe(filter);
    await user.keyboard("worker");
    expect(filter.value.toLowerCase()).toContain("worker");

    const refLink = container.querySelector(
      "a[data-schema-ref-kind]",
    ) as HTMLAnchorElement;
    expect(refLink).not.toBeNull();
    refLink.focus();
    expect(document.activeElement).toBe(refLink);
  });

  test("nested schema field expand/collapse is keyboard operable when present", async () => {
    const user = userEvent.setup();
    const { container } = render(<SchemaFieldTree nodes={nestedSchemaNodes} />);

    const expand = container.querySelector(
      "[data-schema-field-expand]",
    ) as HTMLButtonElement;
    expect(expand).not.toBeNull();
    expect(expand.className).toContain("focus-visible:ring");
    expand.focus();
    expect(document.activeElement).toBe(expand);
    await user.keyboard("{Enter}");
    expect(expand.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("timeout")).toBeTruthy();
  });
});
