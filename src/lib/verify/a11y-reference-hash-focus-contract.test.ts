import { describe, expect, test } from "bun:test";
import {
  collectStickyChromeRects,
  expectReferenceHashFocus,
  expectReferenceMobileNav,
  focusReferenceHashTarget,
  hasReferenceHashScrollMargin,
  isHashTargetFullyObscuredBySticky,
  listRequiredReferenceHashTargets,
  listRequiredReferenceMobileNavs,
  probeReferenceMobileNav,
  probeReferenceStickyVisibility,
  REFERENCE_HASH_TARGETS,
  REFERENCE_MOBILE_NAVS,
} from "./a11y-reference-hash-focus-contract";
import { REFERENCE_SURFACE_ROUTE_IDS } from "./a11y-reference-surface-contract";

describe("a11y-reference-hash-focus-contract", () => {
  test("enumerates required hash targets and mobile nav for primary routes", () => {
    expect(REFERENCE_HASH_TARGETS.map((entry) => entry.id)).toEqual([
      "api-operation-section",
      "event-payload-variant",
      "schema-definition",
    ]);
    expect(REFERENCE_MOBILE_NAVS.map((entry) => entry.id)).toEqual([
      "api-mobile-navigator",
    ]);

    expect(
      listRequiredReferenceHashTargets("references-api").map((s) => s.id),
    ).toEqual(["api-operation-section"]);
    expect(
      listRequiredReferenceHashTargets("references-events").map((s) => s.id),
    ).toEqual(["event-payload-variant"]);
    expect(
      listRequiredReferenceHashTargets("references-factory-schema").map(
        (s) => s.id,
      ),
    ).toEqual(["schema-definition"]);
    expect(
      listRequiredReferenceMobileNavs("references-api").map((s) => s.id),
    ).toEqual(["api-mobile-navigator"]);

    for (const routeId of REFERENCE_SURFACE_ROUTE_IDS.filter((id) =>
      id.startsWith("authored-"),
    )) {
      expect(listRequiredReferenceHashTargets(routeId)).toEqual([]);
      expect(listRequiredReferenceMobileNavs(routeId)).toEqual([]);
    }
  });

  test("hasReferenceHashScrollMargin recognizes scroll-mt utilities and computed margins", () => {
    document.body.innerHTML = `<section class="scroll-mt-20" id="a"></section>`;
    const section = document.querySelector("#a");
    expect(section).not.toBeNull();
    expect(hasReferenceHashScrollMargin(section as Element)).toBe(true);
    expect(hasReferenceHashScrollMargin(section as Element, 80)).toBe(true);
    expect(hasReferenceHashScrollMargin(section as Element, 0)).toBe(true);
    document.body.innerHTML = `<section class="pt-8" id="b"></section>`;
    const plain = document.querySelector("#b");
    expect(plain).not.toBeNull();
    expect(hasReferenceHashScrollMargin(plain as Element, 0)).toBe(false);
  });

  test("focusReferenceHashTarget focuses without rewriting content", () => {
    document.body.innerHTML = `
      <section id="submitWorkBySessionId" data-api-operation-section="" tabindex="-1">
        <h2>Submit work</h2>
      </section>
    `;
    const section = document.querySelector("#submitWorkBySessionId");
    expect(section).not.toBeNull();
    const before = (section as HTMLElement).innerHTML;

    const result = focusReferenceHashTarget(
      document,
      "#submitWorkBySessionId",
      {
        reduceMotion: true,
        scroll: false,
      },
    );
    expect(result.ok).toBe(true);
    expect(result.focused).toBe(true);
    expect(result.contentUnchanged).toBe(true);
    expect(document.activeElement).toBe(section);
    expect((section as HTMLElement).innerHTML).toBe(before);
  });

  test("focusReferenceHashTarget fails when the anchor is missing", () => {
    document.body.innerHTML = `<section id="other"></section>`;
    const result = focusReferenceHashTarget(document, "#missing", {
      scroll: false,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  test("sticky obscuring probe detects fully covered targets", () => {
    document.body.innerHTML = `
      <header data-sticky-chrome="" style="position:sticky;top:0;height:80px"></header>
      <section id="op" class="scroll-mt-20" data-api-operation-section=""></section>
    `;
    const header = document.querySelector(
      "[data-sticky-chrome]",
    ) as HTMLElement;
    const section = document.querySelector("#op") as HTMLElement;

    header.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 80,
        height: 80,
        left: 0,
        right: 1024,
        width: 1024,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }) as DOMRect;
    section.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 40,
        height: 40,
        left: 0,
        right: 1024,
        width: 1024,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }) as DOMRect;

    const sticky = collectStickyChromeRects(document, {
      getComputedStyle: () => ({ position: "sticky" }),
    });
    expect(sticky).toHaveLength(1);
    expect(
      isHashTargetFullyObscuredBySticky(
        section,
        sticky.map((s) => s.rect),
      ),
    ).toBe(true);

    const probe = probeReferenceStickyVisibility(document, section, {
      getComputedStyle: () => ({
        position: "sticky",
        scrollMarginTop: "5rem",
      }),
    });
    expect(probe.fullyObscured).toBe(true);
    expect(probe.hasScrollMargin).toBe(true);
  });

  test("expectReferenceHashFocus fails when sticky chrome fully obscures the target", () => {
    document.body.innerHTML = `
      <header data-sticky-chrome=""></header>
      <section id="submitWorkBySessionId" class="scroll-mt-20" data-api-operation-section="" tabindex="-1">
        <h2>Submit</h2>
      </section>
    `;
    const header = document.querySelector(
      "[data-sticky-chrome]",
    ) as HTMLElement;
    const section = document.querySelector(
      "#submitWorkBySessionId",
    ) as HTMLElement;
    header.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 100,
        height: 100,
        left: 0,
        right: 1024,
        width: 1024,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }) as DOMRect;
    section.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 50,
        height: 50,
        left: 0,
        right: 1024,
        width: 1024,
        x: 0,
        y: 0,
        toJSON() {
          return {};
        },
      }) as DOMRect;

    expect(() =>
      expectReferenceHashFocus(document, "references-api", {
        scroll: false,
        getComputedStyle: (element) =>
          element === header
            ? { position: "sticky", scrollMarginTop: "0px" }
            : { position: "static", scrollMarginTop: "5rem" },
      }),
    ).toThrow(/fully obscured by sticky chrome/);
  });

  test("mobile nav probe opens, closes, and returns focus to summary", () => {
    document.body.innerHTML = `
      <details data-api-mobile-navigator="">
        <summary class="focus-visible:ring-2">Ops</summary>
        <a href="#op">Op</a>
      </details>
    `;
    const probe = probeReferenceMobileNav(
      document,
      REFERENCE_MOBILE_NAVS[0] as (typeof REFERENCE_MOBILE_NAVS)[number],
    );
    expect(probe.found).toBe(true);
    expect(probe.defaultOpen).toBe(false);
    expect(probe.opened).toBe(true);
    expect(probe.closed).toBe(true);
    expect(probe.summaryFocusable).toBe(true);
    expect(probe.focusReturnedToSummary).toBe(true);

    expect(() =>
      expectReferenceMobileNav(document, "references-api"),
    ).not.toThrow();
  });

  test("expectReferenceMobileNav fails when the summary cannot take focus", () => {
    document.body.innerHTML = `
      <details data-api-mobile-navigator="" open>
        <div>Not a summary</div>
      </details>
    `;
    expect(() => expectReferenceMobileNav(document, "references-api")).toThrow(
      /was not found|summary/,
    );
  });
});
