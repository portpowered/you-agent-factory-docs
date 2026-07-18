import { describe, expect, test } from "bun:test";
import {
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  listReferenceOverflowMatrixCases,
  PAGE_OVERFLOW_TOLERANCE_PX,
  REFERENCE_SURFACE_ROUTES,
  REFERENCE_SURFACE_VIEWPORTS,
} from "./a11y-reference-surface-contract";
import {
  collectReferenceSurfaceOverflowProbe,
  expectNoSeriousAxeViolations,
  listReferenceSurfaceProbeBindings,
  measurePageLevelOverflow,
  referenceHashFocusScrollBehavior,
  referenceSurfaceOverflowEvaluateArgs,
  resolveA11yResponsiveProbeUrl,
} from "./a11y-reference-surface-probes";

describe("a11y-reference-surface probe helpers", () => {
  test("overflow evaluate args reuse the shared contract selectors and tolerance", () => {
    expect(referenceSurfaceOverflowEvaluateArgs()).toEqual({
      selectors: INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
      tolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
    });
  });

  test("collectReferenceSurfaceOverflowProbe uses existing overflow measurement", () => {
    const doc = {
      documentElement: { clientWidth: 390, scrollWidth: 390 },
      body: { clientWidth: 390, scrollWidth: 390 },
    };
    const root = {
      querySelectorAll: () => [] as unknown as NodeListOf<Element>,
    } as unknown as ParentNode;

    const probe = collectReferenceSurfaceOverflowProbe(doc, root);
    expect(probe.page.hasUnintendedOverflow).toBe(false);
    expect(probe.allowsIntentionalScrollers).toBe(true);

    const measured = measurePageLevelOverflow(doc);
    expect(measured.overflowPx).toBe(0);
  });

  test("listReferenceSurfaceProbeBindings covers the full matrix and names shared harnesses", () => {
    const bindings = listReferenceSurfaceProbeBindings();
    expect(bindings).toHaveLength(listReferenceOverflowMatrixCases().length);
    expect(bindings[0]?.route.path).toBe("/docs/references/api");
    expect(bindings[0]?.viewport.id).toBe("wide");
    expect(bindings[0]?.harness).toEqual({
      overflow: "collectReferenceSurfaceOverflowProbe",
      axe: "expectNoSeriousAxeViolations",
      keyboard: "expectReferenceKeyboardChrome",
      screenReader: "expectReferenceScreenReaderChrome",
      hashFocus: "expectReferenceHashFocusAndMobileCollapse",
      copyAnnouncement: "expectReferenceCopyAnnouncements",
      reducedMotion: "evaluateReferenceReducedMotionInBrowser",
      longTokenOverflow: "expectReferenceLongTokenOverflow",
      noJsHtml: "expectReferenceNoJsHtmlReadability",
      pageSession: "openReferenceSurfacePageProbe",
    });

    expect(typeof expectNoSeriousAxeViolations).toBe("function");
    expect(bindings.map((entry) => entry.route.id)).toEqual(
      listReferenceOverflowMatrixCases().map((entry) => entry.route.id),
    );
  });

  test("referenceHashFocusScrollBehavior honors reduced motion", () => {
    expect(referenceHashFocusScrollBehavior(true)).toBe("auto");
    expect(referenceHashFocusScrollBehavior(false)).toBe("smooth");
  });

  test("resolveA11yResponsiveProbeUrl remains the page-session URL helper for reference paths", () => {
    const apiRoute = REFERENCE_SURFACE_ROUTES.find(
      (route) => route.id === "references-api",
    );
    expect(apiRoute?.path).toBe("/docs/references/api");
    expect(
      resolveA11yResponsiveProbeUrl(
        "http://127.0.0.1:3456",
        apiRoute?.path ?? "",
      ),
    ).toBe("http://127.0.0.1:3456/docs/references/api");

    expect(REFERENCE_SURFACE_VIEWPORTS).toHaveLength(5);
  });
});
