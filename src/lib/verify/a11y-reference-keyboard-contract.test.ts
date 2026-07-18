import { describe, expect, test } from "bun:test";
import {
  expectReferenceKeyboardChrome,
  hasReferenceVisibleFocusRingClass,
  isKeyboardFocusableElement,
  isPointerOnlyInteractiveElement,
  listReferenceKeyboardControlsForRoute,
  listRequiredReferenceKeyboardControls,
  probeReferenceKeyboardControl,
  probeReferenceKeyboardControlsForRoute,
  REFERENCE_KEYBOARD_CONTROLS,
} from "./a11y-reference-keyboard-contract";
import { REFERENCE_SURFACE_ROUTE_IDS } from "./a11y-reference-surface-contract";

describe("a11y-reference-keyboard-contract", () => {
  test("enumerates keyboard chrome for every representative route family", () => {
    expect(REFERENCE_KEYBOARD_CONTROLS.length).toBeGreaterThan(0);

    for (const routeId of REFERENCE_SURFACE_ROUTE_IDS) {
      const specs = listReferenceKeyboardControlsForRoute(routeId);
      expect(specs.length).toBeGreaterThan(0);
    }

    expect(
      listRequiredReferenceKeyboardControls("references-api").map((s) => s.id),
    ).toEqual([
      "api-filter-input",
      "api-mobile-nav-summary",
      "api-nav-link",
      "api-copy-link",
    ]);
    expect(
      listRequiredReferenceKeyboardControls("references-events").map(
        (s) => s.id,
      ),
    ).toEqual(["events-nav-link", "events-anchor-copy"]);
    expect(
      listRequiredReferenceKeyboardControls("references-factory-schema").map(
        (s) => s.id,
      ),
    ).toEqual(["schema-filter-input", "schema-ref-link"]);
  });

  test("detects keyboard focusable vs pointer-only interactive elements", () => {
    document.body.innerHTML = `
      <button type="button" class="focus-visible:ring-2">Copy</button>
      <a href="#op" class="focus-visible:ring-2">Link</a>
      <div role="button" data-pointer-only-action="" class="cursor-pointer">Bad</div>
      <div onclick="void 0">Also bad</div>
    `;

    const button = document.querySelector("button");
    const link = document.querySelector("a");
    const pointerRole = document.querySelector('[role="button"]');
    const pointerClick = document.querySelector("[onclick]");

    expect(button).not.toBeNull();
    expect(link).not.toBeNull();
    expect(pointerRole).not.toBeNull();
    expect(pointerClick).not.toBeNull();

    expect(isKeyboardFocusableElement(button as Element)).toBe(true);
    expect(isKeyboardFocusableElement(link as Element)).toBe(true);
    expect(isKeyboardFocusableElement(pointerRole as Element)).toBe(false);
    expect(isPointerOnlyInteractiveElement(pointerRole as Element)).toBe(true);
    expect(isPointerOnlyInteractiveElement(pointerClick as Element)).toBe(true);
    expect(hasReferenceVisibleFocusRingClass("focus-visible:ring-2")).toBe(
      true,
    );
    expect(hasReferenceVisibleFocusRingClass("hover:underline")).toBe(false);
  });

  test("expectReferenceKeyboardChrome fails when a required control is pointer-only", () => {
    document.body.innerHTML = `
      <input data-api-operation-filter="input" class="focus-visible:ring-2" />
      <details data-api-mobile-navigator="">
        <summary class="focus-visible:ring-2">Ops</summary>
      </details>
      <a href="#submit" data-api-operation-nav-link="submit" class="focus-visible:ring-2">Submit</a>
      <div data-api-operation-copy-link="submit" role="button" class="cursor-pointer">Copy</div>
    `;

    expect(() =>
      expectReferenceKeyboardChrome(document, "references-api"),
    ).toThrow(/pointer-only|not keyboard focusable/);
  });

  test("expectReferenceKeyboardChrome fails when a required control is missing", () => {
    document.body.innerHTML = `
      <input data-api-operation-filter="input" class="focus-visible:ring-2" />
      <details data-api-mobile-navigator="">
        <summary class="focus-visible:ring-2">Ops</summary>
      </details>
      <a href="#submit" data-api-operation-nav-link="submit" class="focus-visible:ring-2">Submit</a>
    `;

    expect(() =>
      expectReferenceKeyboardChrome(document, "references-api"),
    ).toThrow(/api-copy-link|Copy|was not found/);
  });

  test("expectReferenceKeyboardChrome passes a complete keyboard-safe API fixture", () => {
    document.body.innerHTML = `
      <input data-api-operation-filter="input" class="focus-visible:ring-2" />
      <details data-api-mobile-navigator="">
        <summary class="focus-visible:ring-2">Ops</summary>
      </details>
      <a href="#submit" data-api-operation-nav-link="submit" class="focus-visible:ring-2">Submit</a>
      <button type="button" data-api-operation-copy-link="submit" class="focus-visible:ring-2">Copy</button>
    `;

    const probes = expectReferenceKeyboardChrome(document, "references-api");
    const required = probes.filter((probe) => probe.required);
    expect(required.every((probe) => probe.found)).toBe(true);
    expect(required.every((probe) => probe.allHitsKeyboardFocusable)).toBe(
      true,
    );
    expect(required.every((probe) => probe.allHitsHaveFocusRing)).toBe(true);
  });

  test("probe helpers report optional clear controls without requiring them", () => {
    document.body.innerHTML = `
      <a href="#FactoryEvent" data-event-catalog-link="" class="focus-visible:ring-2">FactoryEvent</a>
      <button type="button" data-reference-anchor-copy="" class="focus-visible:ring-2">Copy link</button>
    `;

    const probes = probeReferenceKeyboardControlsForRoute(
      document,
      "references-events",
    );
    const clear = probes.find((probe) => probe.id === "events-filter-clear");
    expect(clear?.required).toBe(false);
    expect(clear?.found).toBe(false);

    expect(() =>
      expectReferenceKeyboardChrome(document, "references-events"),
    ).not.toThrow();

    const missingClear = probeReferenceKeyboardControl(
      document,
      REFERENCE_KEYBOARD_CONTROLS.find(
        (entry) => entry.id === "events-filter-clear",
      ) ?? REFERENCE_KEYBOARD_CONTROLS[0],
    );
    expect(missingClear.found).toBe(false);
  });
});
