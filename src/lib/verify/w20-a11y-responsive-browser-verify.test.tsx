/**
 * W20 story 005 browser-path proof: a representative reference page remains
 * usable at a narrow width with keyboard focus visible on a primary control.
 *
 * Reuses the W19 API navigation harness + keyboard chrome contract (same
 * production markers as `/docs/references/api`). Worktree Next/Turbopack often
 * cannot start without local `node_modules` — this happy-dom path is the
 * established W19 always-on browser proof style.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { ApiNavigationVerificationHarness } from "@/features/references/api/api-navigation-verification-harness";
import type { ApiOperationDetail } from "@/features/references/api/operation-detail";
import type { ApiOperationNavModel } from "@/features/references/api/operation-navigation";
import {
  expectReferenceKeyboardChrome,
  hasReferenceVisibleFocusRingClass,
} from "@/lib/verify/a11y-reference-keyboard-contract";
import {
  getW20A11yResponsiveBrowserVerifyViewport,
  W20_A11Y_RESPONSIVE_BROWSER_VERIFY,
} from "@/lib/verify/w20-a11y-responsive-convergence";

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

function applyNarrowViewport(): { width: number; height: number } {
  const viewport = getW20A11yResponsiveBrowserVerifyViewport();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: viewport.width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: viewport.height,
  });
  Object.defineProperty(window, "outerWidth", {
    configurable: true,
    value: viewport.width,
  });
  Object.defineProperty(window, "outerHeight", {
    configurable: true,
    value: viewport.height,
  });
  return { width: viewport.width, height: viewport.height };
}

describe("W20 a11y / responsive browser-path narrow keyboard focus", () => {
  test("API representative stays keyboard-usable at narrow width with visible focus on the primary control", () => {
    const { width, height } = applyNarrowViewport();
    expect(width).toBe(390);
    expect(height).toBe(844);
    expect(window.innerWidth).toBe(390);

    const { container } = render(
      <ApiNavigationVerificationHarness
        detailsByAnchor={detailsByAnchor}
        model={miniNav}
      />,
    );

    expect(() =>
      expectReferenceKeyboardChrome(container, "references-api"),
    ).not.toThrow();

    const primary = container.querySelector(
      W20_A11Y_RESPONSIVE_BROWSER_VERIFY.primaryControlSelector,
    ) as HTMLInputElement | null;
    expect(primary).not.toBeNull();
    expect(hasReferenceVisibleFocusRingClass(primary?.className ?? "")).toBe(
      true,
    );

    primary?.focus();
    expect(document.activeElement).toBe(primary);

    // Mobile navigator disclosure must also remain focusable at narrow width.
    const mobileSummary = container.querySelector(
      "[data-api-mobile-navigator] summary",
    ) as HTMLElement | null;
    expect(mobileSummary).not.toBeNull();
    expect(
      hasReferenceVisibleFocusRingClass(mobileSummary?.className ?? ""),
    ).toBe(true);
    mobileSummary?.focus();
    expect(document.activeElement).toBe(mobileSummary);
  });
});
