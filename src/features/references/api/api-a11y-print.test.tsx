import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { collectResponsiveOverflowProbe } from "@/lib/verify/a11y-responsive-probes";
import {
  API_KEYBOARD_CONTROL_SELECTORS,
  API_PRINT_CHROME_ATTR,
  API_PRINT_CHROME_HIDE,
  API_PRINT_CONTENT_ATTR,
  API_PRINT_POLICY,
  API_PRINT_ROOT_ATTR,
  API_VERIFICATION_VIEWPORTS,
  apiHashFocusScrollBehavior,
  hasApiVisibleFocusRingClass,
  probeApiKeyboardControls,
  probeApiPrintReadableFacts,
} from "./a11y-verification";
import { ApiNavigationVerificationHarness } from "./api-navigation-verification-harness";
import { ApiOperationSection } from "./api-operation-section";
import { focusApiOperationAnchor } from "./api-reference-hash-controller";
import {
  API_HASH_FOCUSED_ATTR,
  API_OPERATION_COPY_LINK_LABEL,
} from "./operation-anchors";
import type { ApiOperationDetail } from "./operation-detail";
import type { ApiOperationNavModel } from "./operation-navigation";

afterEach(() => {
  cleanup();
  window.location.hash = "";
});

function setViewportWidth(width: number) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.documentElement, "scrollWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.body, "clientWidth", {
    configurable: true,
    get: () => width,
  });
  Object.defineProperty(document.body, "scrollWidth", {
    configurable: true,
    get: () => width,
  });
}

const sampleDetail: ApiOperationDetail = {
  method: "post",
  path: "/factory-sessions/{session_id}/work",
  operationId: "submitWorkBySessionId",
  anchor: "submitWorkBySessionId",
  summary: "Submit work",
  parameters: [
    {
      name: "session_id",
      location: "path",
      required: true,
      typeSummary: "string",
    },
  ],
  requestBody: {
    required: true,
    mediaTypes: [
      {
        mediaType: "application/json",
        kind: "json",
        examples: [],
      },
    ],
  },
  responses: [
    {
      statusCode: "200",
      description: "Accepted",
      mediaTypes: [
        {
          mediaType: "application/json",
          kind: "json",
          examples: [],
        },
      ],
    },
  ],
};

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
        {
          id: "getEventsBySessionId",
          method: "get",
          path: "/factory-sessions/{session_id}/events",
          operationId: "getEventsBySessionId",
          anchor: "getEventsBySessionId",
          summary: "Session event stream",
          tags: ["Work"],
        },
      ],
    },
  ],
  linkCount: 2,
  operationCount: 2,
};

const detailsByAnchor = new Map<string, ApiOperationDetail>([
  ["submitWorkBySessionId", sampleDetail],
  [
    "getEventsBySessionId",
    {
      method: "get",
      path: "/factory-sessions/{session_id}/events",
      operationId: "getEventsBySessionId",
      anchor: "getEventsBySessionId",
      summary: "Session event stream",
      parameters: [],
      responses: [
        {
          statusCode: "200",
          mediaTypes: [
            {
              mediaType: "text/event-stream",
              kind: "event-stream",
              examples: [],
            },
          ],
        },
      ],
    },
  ],
]);

describe("a11y verification contract", () => {
  test("defines phone, tablet, and desktop viewports", () => {
    expect(API_VERIFICATION_VIEWPORTS.map((v) => v.id)).toEqual([
      "phone",
      "tablet",
      "desktop",
    ]);
    expect(API_VERIFICATION_VIEWPORTS[0]?.width).toBe(390);
    expect(API_VERIFICATION_VIEWPORTS[1]?.width).toBe(768);
    expect(API_VERIFICATION_VIEWPORTS[2]?.width).toBe(1440);
  });

  test("print policy forbids hover-only facts and names the stylesheet", () => {
    expect(API_PRINT_POLICY.hoverOnlyFactsForbidden).toBe(true);
    expect(API_PRINT_POLICY.keepReadableFacts).toContain("method");
    expect(API_PRINT_POLICY.keepReadableFacts).toContain("path");
    expect(API_PRINT_POLICY.stylesheetImport).toContain(
      "references-api-print.css",
    );
  });

  test("reduced-motion hash focus uses instant scroll", () => {
    expect(apiHashFocusScrollBehavior(true)).toBe("auto");
    expect(apiHashFocusScrollBehavior(false)).toBe("smooth");
  });

  test("visible focus ring helper recognizes focus-visible utilities", () => {
    expect(
      hasApiVisibleFocusRingClass(
        "focus-visible:ring-2 focus-visible:ring-ring",
      ),
    ).toBe(true);
    expect(hasApiVisibleFocusRingClass("hover:underline")).toBe(false);
  });
});

describe("API harness keyboard, overflow, reduced-motion, print", () => {
  test("primary controls are keyboard focusable with visible focus rings", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    const filter = container.querySelector(
      '[data-api-operation-filter="input"]',
    ) as HTMLInputElement;
    expect(filter).not.toBeNull();
    filter.focus();
    expect(document.activeElement).toBe(filter);
    fireEvent.change(filter, { target: { value: "submit" } });
    expect(filter.value).toBe("submit");

    const clear = container.querySelector(
      '[data-api-operation-filter="clear"]',
    ) as HTMLButtonElement;
    clear.focus();
    expect(document.activeElement).toBe(clear);
    fireEvent.click(clear);
    expect(filter.value).toBe("");

    const copy = screen.getAllByRole("button", {
      name: API_OPERATION_COPY_LINK_LABEL,
    })[0];
    expect(copy).toBeTruthy();
    copy.focus();
    expect(document.activeElement).toBe(copy);

    const mobile = container.querySelector(
      "[data-api-mobile-navigator]",
    ) as HTMLDetailsElement;
    expect(mobile).not.toBeNull();
    const summary = mobile.querySelector("summary") as HTMLElement;
    summary.focus();
    expect(document.activeElement).toBe(summary);
    fireEvent.click(summary);
    expect(mobile.open).toBe(true);

    const probes = probeApiKeyboardControls(container);
    for (const selector of API_KEYBOARD_CONTROL_SELECTORS) {
      const hit = probes.find((p) => p.selector === selector);
      expect(hit?.found).toBe(true);
      expect(hit?.hasFocusRing).toBe(true);
    }
  });

  test("responsive overflow stays contained at phone, tablet, and desktop widths", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    for (const viewport of API_VERIFICATION_VIEWPORTS) {
      setViewportWidth(viewport.width);
      const probe = collectResponsiveOverflowProbe(document, document.body);
      expect(probe.page.hasUnintendedOverflow).toBe(false);

      const harness = container.querySelector(
        "[data-api-navigation-verification-harness]",
      );
      expect(harness?.className).toContain("min-w-0");
      expect(harness?.className).toContain("overflow-x-hidden");
    }
  });

  test("reduced-motion hash focus still focuses without rewriting content", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    const section = container.querySelector(
      "#submitWorkBySessionId",
    ) as HTMLElement;
    const before = section.innerHTML;

    expect(
      focusApiOperationAnchor(container, "submitWorkBySessionId", {
        reduceMotion: true,
      }),
    ).toBe(true);
    expect(section.getAttribute(API_HASH_FOCUSED_ATTR)).toBe("");
    expect(document.activeElement).toBe(section);
    expect(section.innerHTML).toBe(before);
  });

  test("print markers hide chrome and keep operation facts readable", () => {
    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    expect(container.querySelector(`[${API_PRINT_ROOT_ATTR}]`)).not.toBeNull();

    const chrome = container.querySelectorAll(
      `[${API_PRINT_CHROME_ATTR}="${API_PRINT_CHROME_HIDE}"]`,
    );
    expect(chrome.length).toBeGreaterThanOrEqual(3);

    const section = container.querySelector(
      `#submitWorkBySessionId[${API_PRINT_CONTENT_ATTR}]`,
    );
    expect(section).not.toBeNull();

    const facts = probeApiPrintReadableFacts(section as Element);
    expect(facts.method?.toLowerCase()).toBe("post");
    expect(facts.path).toContain("/factory-sessions");
    expect(facts.summary).toBe("Submit work");
    expect(facts.hasParametersRegion).toBe(true);
    expect(facts.hasRequestBodyRegion).toBe(true);
    expect(facts.hasResponsesRegion).toBe(true);
    expect(facts.hoverOnlyFacts).toBe(false);
  });

  test("ApiOperationSection exposes print-readable method/path without hover-only facts", () => {
    const { container } = render(<ApiOperationSection detail={sampleDetail} />);
    const section = container.querySelector(
      `[${API_PRINT_CONTENT_ATTR}]`,
    ) as Element;
    const facts = probeApiPrintReadableFacts(section);
    expect(facts.hoverOnlyFacts).toBe(false);
    expect(facts.method?.toLowerCase()).toBe("post");
    expect(facts.path).toBe(sampleDetail.path);
  });
});
