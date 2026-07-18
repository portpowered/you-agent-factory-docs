/**
 * Always-on W19 reference-surface overflow matrix contract proofs.
 * Served-page probes live in
 * `a11y-reference-overflow-matrix-page.test.ts` (opt-in via
 * VERIFY_PRODUCTION_INTEGRATION_TESTS).
 */

import { afterEach, describe, expect, test } from "bun:test";
import {
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  listReferenceOverflowMatrixCases,
  PAGE_OVERFLOW_TOLERANCE_PX,
  REFERENCE_SURFACE_ROUTES,
  REFERENCE_SURFACE_VIEWPORTS,
} from "@/lib/verify/a11y-reference-surface-contract";
import {
  collectReferenceSurfaceOverflowProbe,
  findIntentionalHorizontalScrollContainers,
} from "@/lib/verify/a11y-reference-surface-probes";

function clearDocumentWidthOverrides(): void {
  for (const target of [document.documentElement, document.body]) {
    for (const prop of ["clientWidth", "scrollWidth"] as const) {
      try {
        Reflect.deleteProperty(target, prop);
      } catch {
        // happy-dom may keep native getters; ignore
      }
    }
  }
}

describe("reference responsive overflow matrix (always-on)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    clearDocumentWidthOverrides();
  });

  test("contract matrix covers all representative routes at five layouts including zoomed", () => {
    const cases = listReferenceOverflowMatrixCases();
    expect(cases).toHaveLength(
      REFERENCE_SURFACE_ROUTES.length * REFERENCE_SURFACE_VIEWPORTS.length,
    );
    expect(
      REFERENCE_SURFACE_VIEWPORTS.map((viewport) => viewport.width),
    ).toEqual([1440, 1024, 768, 390, 512]);
    expect(REFERENCE_SURFACE_ROUTES.map((route) => route.path)).toEqual([
      "/docs/references/api",
      "/docs/references/events",
      "/docs/references/factory-schema",
      "/docs/factories/packaged",
      "/docs/workers/hosted",
      "/docs/workstations/standard",
    ]);

    for (const viewport of REFERENCE_SURFACE_VIEWPORTS) {
      for (const route of REFERENCE_SURFACE_ROUTES) {
        expect(
          cases.some(
            (entry) =>
              entry.route.id === route.id && entry.viewport.id === viewport.id,
          ),
        ).toBe(true);
      }
    }
  });

  test("intentional code and overflow-x-auto scrollers do not imply page-level overflow", () => {
    document.body.innerHTML = `
      <main>
        <div data-rich-content-scroll="code" class="overflow-x-auto"></div>
        <pre class="overflow-x-auto">very-long-openapi-path-/sessions/{sessionId}/workers/{workerId}/dispatch</pre>
        <nav class="min-w-0 overflow-x-auto" aria-label="Event catalog"></nav>
      </main>
    `;
    const code = document.querySelector(
      '[data-rich-content-scroll="code"]',
    ) as HTMLElement;
    const pre = document.querySelector("pre") as HTMLElement;
    const nav = document.querySelector("nav") as HTMLElement;
    for (const element of [code, pre, nav]) {
      Object.defineProperty(element, "clientWidth", {
        configurable: true,
        get: () => 200,
      });
      Object.defineProperty(element, "scrollWidth", {
        configurable: true,
        get: () => 900,
      });
    }
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.documentElement, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "scrollWidth", {
      configurable: true,
      get: () => 390,
    });

    const probe = collectReferenceSurfaceOverflowProbe(document, document);
    expect(probe.page.hasUnintendedOverflow).toBe(false);
    expect(probe.page.overflowPx).toBeLessThanOrEqual(
      PAGE_OVERFLOW_TOLERANCE_PX,
    );
    expect(probe.allowsIntentionalScrollers).toBe(true);
    expect(
      findIntentionalHorizontalScrollContainers(
        document,
        INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
      ).filter((hit) => hit.canScrollHorizontally).length,
    ).toBeGreaterThanOrEqual(2);
  });

  test("page-level overflow beyond tolerance fails the reference probe", () => {
    document.body.innerHTML = `<main><p>wide content</p></main>`;
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.documentElement, "scrollWidth", {
      configurable: true,
      get: () => 520,
    });
    Object.defineProperty(document.body, "clientWidth", {
      configurable: true,
      get: () => 390,
    });
    Object.defineProperty(document.body, "scrollWidth", {
      configurable: true,
      get: () => 520,
    });

    const probe = collectReferenceSurfaceOverflowProbe(document, document);
    expect(probe.page.hasUnintendedOverflow).toBe(true);
    expect(probe.page.overflowPx).toBeGreaterThan(PAGE_OVERFLOW_TOLERANCE_PX);
    expect(probe.allowsIntentionalScrollers).toBe(false);
  });
});
