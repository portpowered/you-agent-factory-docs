import { afterEach, describe, expect, test } from "bun:test";
import {
  evaluateReferenceReducedMotionInBrowser,
  expectReferenceReducedMotionChrome,
  expectReferenceReducedMotionHashFocus,
  listReferenceMotionChromeForRoute,
  MOBILE_DRAWER_MOTION_CHROME,
  probeReferenceMotionChrome,
  REFERENCE_MOTION_CHROME,
  REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS,
  referenceHashFocusScrollBehavior,
  referenceReducedMotionEvaluateArgs,
} from "./a11y-reference-reduced-motion-contract";
import { REFERENCE_SURFACE_ROUTE_IDS } from "./a11y-reference-surface-contract";

describe("a11y-reference-reduced-motion-contract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("enumerates motion chrome and hash routes for W19", () => {
    expect(REFERENCE_MOTION_CHROME.map((entry) => entry.id)).toEqual([
      "docs-mobile-drawer",
      "docs-mobile-drawer-backdrop",
    ]);
    expect([...REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS]).toEqual([
      "references-api",
      "references-events",
      "references-factory-schema",
    ]);

    for (const routeId of REFERENCE_SURFACE_ROUTE_IDS) {
      expect(listReferenceMotionChromeForRoute(routeId).length).toBe(2);
    }
  });

  test("referenceHashFocusScrollBehavior honors reduced motion", () => {
    expect(referenceHashFocusScrollBehavior(true)).toBe("auto");
    expect(referenceHashFocusScrollBehavior(false)).toBe("smooth");
  });

  test("probeReferenceMotionChrome requires motion-reduce class fragments", () => {
    document.body.innerHTML = `
      <aside
        data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"
        class="duration-300 motion-reduce:transition-none motion-reduce:duration-0"
        style="transition-duration: 0.01ms; animation-duration: 0s;"
      >
        drawer
      </aside>
    `;
    const spec = REFERENCE_MOTION_CHROME.find(
      (entry) => entry.id === "docs-mobile-drawer",
    );
    expect(spec).toBeDefined();
    if (!spec) {
      return;
    }

    const probe = probeReferenceMotionChrome(document, spec, {
      assumeReducedMotionPreference: true,
    });
    expect(probe.found).toBe(true);
    expect(probe.hasReduceClasses).toBe(true);
    expect(probe.isReduced).toBe(true);

    expect(() =>
      expectReferenceReducedMotionChrome(document, "references-api", {
        assumeReducedMotionPreference: true,
        requirePresent: true,
      }),
    ).not.toThrow();
  });

  test("expectReferenceReducedMotionChrome fails when reduce classes are missing", () => {
    document.body.innerHTML = `
      <aside data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}" class="duration-300">
        drawer
      </aside>
    `;
    expect(() =>
      expectReferenceReducedMotionChrome(document, "references-api", {
        requirePresent: true,
      }),
    ).toThrow(/missing reduce classes/);
  });

  test("expectReferenceReducedMotionHashFocus focuses without rewriting content", () => {
    document.body.innerHTML = `
      <section id="submitWorkBySessionId" data-api-operation-section="" tabindex="-1">
        <h2>Submit work</h2>
      </section>
    `;
    const probe = expectReferenceReducedMotionHashFocus(
      document,
      "references-api",
    );
    expect(probe.scrollBehaviorWhenReduced).toBe("auto");
    expect(probe.hashFocus?.ok).toBe(true);
    expect(document.activeElement?.id).toBe("submitWorkBySessionId");
  });

  test("browser evaluate helper reports failure when preference is off", () => {
    document.body.innerHTML = `
      <section id="op" data-api-operation-section="" tabindex="-1">op</section>
    `;
    const result = evaluateReferenceReducedMotionInBrowser(
      referenceReducedMotionEvaluateArgs("references-api", {
        hashSelector: "[data-api-operation-section]",
      }),
    );
    // happy-dom typically does not emulate prefers-reduced-motion.
    expect(result.prefersReducedMotion).toBe(false);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/prefers-reduced-motion/);
  });
});
