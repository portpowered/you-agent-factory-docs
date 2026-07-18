import { describe, expect, test } from "bun:test";
import {
  accessibleNameOf,
  expectCoherentReferenceHeadingHierarchy,
  expectReferenceLabeledChrome,
  expectReferenceNonColorStatus,
  expectReferenceScreenReaderChrome,
  listReferenceLabeledControlsForRoute,
  listRequiredReferenceLabeledControls,
  listRequiredReferenceNonColorStatus,
  probeReferenceHeadingHierarchy,
  probeReferenceLabeledControl,
  probeReferenceNonColorStatus,
  REFERENCE_LABELED_CONTROLS,
  REFERENCE_NON_COLOR_STATUS,
} from "./a11y-reference-screen-reader-contract";
import { REFERENCE_SURFACE_ROUTE_IDS } from "./a11y-reference-surface-contract";

describe("a11y-reference-screen-reader-contract", () => {
  test("enumerates labeled chrome and non-color status for primary reference routes", () => {
    expect(REFERENCE_LABELED_CONTROLS.length).toBeGreaterThan(0);
    expect(REFERENCE_NON_COLOR_STATUS.length).toBeGreaterThan(0);

    for (const routeId of [
      "references-api",
      "references-events",
      "references-factory-schema",
    ] as const) {
      expect(
        listReferenceLabeledControlsForRoute(routeId).length,
      ).toBeGreaterThan(0);
      expect(
        listRequiredReferenceNonColorStatus(routeId).length,
      ).toBeGreaterThan(0);
    }

    expect(
      listRequiredReferenceLabeledControls("references-api").map((s) => s.id),
    ).toEqual([
      "api-filter-input",
      "api-mobile-nav-summary",
      "api-nav-link",
      "api-copy-link",
    ]);
    expect(
      listRequiredReferenceNonColorStatus("references-api").map((s) => s.id),
    ).toEqual(["api-http-method"]);
    expect(
      listRequiredReferenceNonColorStatus("references-events").map((s) => s.id),
    ).toEqual(["events-canonicality"]);
    expect(
      listRequiredReferenceNonColorStatus("references-factory-schema").map(
        (s) => s.id,
      ),
    ).toEqual(["schema-required-optional"]);

    // Authored routes only carry optional lifecycle status in this contract.
    for (const routeId of REFERENCE_SURFACE_ROUTE_IDS.filter((id) =>
      id.startsWith("authored-"),
    )) {
      expect(listRequiredReferenceLabeledControls(routeId)).toEqual([]);
      expect(listRequiredReferenceNonColorStatus(routeId)).toEqual([]);
    }
  });

  test("accessibleNameOf prefers aria-label, labelledby, and label[for]", () => {
    document.body.innerHTML = `
      <label id="lbl">From labelledby</label>
      <button aria-labelledby="lbl" type="button">Visible</button>
      <button aria-label="Explicit" type="button">Ignore</button>
      <label for="inp">Filter operations</label>
      <input id="inp" />
    `;
    const labelledBy = document.querySelector("[aria-labelledby]");
    const ariaLabel = document.querySelector("[aria-label]");
    const input = document.querySelector("input");
    expect(labelledBy).not.toBeNull();
    expect(ariaLabel).not.toBeNull();
    expect(input).not.toBeNull();
    expect(accessibleNameOf(labelledBy as Element)).toBe("From labelledby");
    expect(accessibleNameOf(ariaLabel as Element)).toBe("Explicit");
    expect(accessibleNameOf(input as Element)).toBe("Filter operations");
  });

  test("heading hierarchy detects skips and coherent outlines", () => {
    document.body.innerHTML = `
      <main>
        <h1>API</h1>
        <h2>Operations</h2>
        <h3>Submit</h3>
      </main>
    `;
    const coherent = probeReferenceHeadingHierarchy(document);
    expect(coherent.levels).toEqual([1, 2, 3]);
    expect(coherent.hasSkippedLevel).toBe(false);
    expect(coherent.h1Count).toBe(1);
    expect(() =>
      expectCoherentReferenceHeadingHierarchy(document, { requireH1: true }),
    ).not.toThrow();

    document.body.innerHTML = `
      <main>
        <h1>API</h1>
        <h3>Skipped</h3>
      </main>
    `;
    expect(probeReferenceHeadingHierarchy(document).hasSkippedLevel).toBe(true);
    expect(() => expectCoherentReferenceHeadingHierarchy(document)).toThrow(
      /skips a level/,
    );
  });

  test("expectReferenceLabeledChrome fails when a required control lacks a name", () => {
    document.body.innerHTML = `
      <input data-api-operation-filter="input" />
      <details data-api-mobile-navigator="">
        <summary>Ops</summary>
      </details>
      <a href="#submit" data-api-operation-nav-link="submit">Submit</a>
      <button type="button" data-api-operation-copy-link="submit"></button>
    `;

    expect(() =>
      expectReferenceLabeledChrome(document, "references-api"),
    ).toThrow(/accessible name|name did not match/);
  });

  test("expectReferenceNonColorStatus fails on color-only method badge", () => {
    document.body.innerHTML = `
      <span data-api-method-badge="" class="bg-blue-500"></span>
    `;
    const probe = probeReferenceNonColorStatus(
      document,
      REFERENCE_NON_COLOR_STATUS[0] as (typeof REFERENCE_NON_COLOR_STATUS)[number],
    );
    expect(probe.found).toBe(true);
    expect(probe.colorOnlyHitCount).toBe(1);

    expect(() =>
      expectReferenceNonColorStatus(document, "references-api"),
    ).toThrow(/color-only|missing text cue/);
  });

  test("expectReferenceScreenReaderChrome passes labeled + text status fixtures", () => {
    document.body.innerHTML = `
      <label for="api-filter">Filter operations</label>
      <input id="api-filter" data-api-operation-filter="input" />
      <details data-api-mobile-navigator="">
        <summary>Operations</summary>
      </details>
      <a href="#submit" data-api-operation-nav-link="submit">Submit work</a>
      <button type="button" data-api-operation-copy-link="submit" aria-label="Copy link to Submit work">Copy</button>
      <span data-api-method-badge="POST" title="HTTP method POST">POST</span>
    `;

    const result = expectReferenceScreenReaderChrome(
      document,
      "references-api",
    );
    expect(result.labeled.every((p) => p.found)).toBe(true);
    expect(result.nonColor.find((p) => p.id === "api-http-method")?.found).toBe(
      true,
    );

    const labeledProbe = probeReferenceLabeledControl(
      document,
      listRequiredReferenceLabeledControls(
        "references-api",
      )[0] as (typeof REFERENCE_LABELED_CONTROLS)[number],
    );
    expect(labeledProbe.unnamedHitCount).toBe(0);
    expect(labeledProbe.namePatternMatched).toBe(true);
  });
});
