import { describe, expect, test } from "bun:test";
import {
  A11Y_SUITE_REPRODUCTION_COMMAND,
  listReferenceBrowserCloseoutCases,
  listReferenceBrowserCloseoutCoveredRouteIds,
  REFERENCE_BROWSER_CLOSEOUT_CASES,
  REFERENCE_BROWSER_CLOSEOUT_EXCLUDED_W20_SUITES,
  REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS,
  REFERENCE_BROWSER_CLOSEOUT_PROBE_KINDS,
  REFERENCE_PAYLOAD_BUDGET_COMMAND,
  referenceBrowserCloseoutCoversRequiredSurfaces,
} from "./a11y-reference-browser-closeout-contract";
import {
  REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS,
  referencePayloadBudgetsAlignWithSurfaceContract,
} from "./a11y-reference-payload-budget";
import {
  listReferenceOverflowMatrixCases,
  REFERENCE_SURFACE_ROUTE_IDS,
  REFERENCE_SURFACE_ROUTES,
  REFERENCE_SURFACE_VIEWPORT_IDS,
} from "./a11y-reference-surface-contract";

describe("a11y-reference-browser-closeout-contract", () => {
  test("enumerates every W19 probe kind once in the close-out matrix", () => {
    expect(REFERENCE_BROWSER_CLOSEOUT_PROBE_KINDS).toEqual([
      "overflow",
      "keyboard",
      "hashFocus",
      "copyAnnouncement",
      "reducedMotion",
      "longTokenOverflow",
      "noJsHtml",
      "payloadBudget",
    ]);
    expect(
      REFERENCE_BROWSER_CLOSEOUT_CASES.map((entry) => entry.probeKind),
    ).toEqual([...REFERENCE_BROWSER_CLOSEOUT_PROBE_KINDS]);
  });

  test("covers all representative routes and interactive API/events/schema probes", () => {
    expect(referenceBrowserCloseoutCoversRequiredSurfaces()).toBe(true);
    expect(listReferenceBrowserCloseoutCoveredRouteIds()).toEqual([
      ...REFERENCE_SURFACE_ROUTE_IDS,
    ]);

    const overflow = REFERENCE_BROWSER_CLOSEOUT_CASES.find(
      (entry) => entry.id === "overflow-matrix",
    );
    expect(overflow?.routeIds).toEqual([...REFERENCE_SURFACE_ROUTE_IDS]);
    expect(overflow?.viewportIds).toEqual([...REFERENCE_SURFACE_VIEWPORT_IDS]);
    expect(overflow?.harness).toBe("evaluateResponsiveOverflowInBrowser");

    for (const routeId of REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS) {
      expect([
        "references-api",
        "references-events",
        "references-factory-schema",
      ]).toContain(routeId);
    }
  });

  test("expanded cases stay on the shared surface contract paths and widths", () => {
    const expanded = listReferenceBrowserCloseoutCases();
    expect(expanded.length).toBeGreaterThan(
      listReferenceOverflowMatrixCases().length,
    );

    const overflowRows = expanded.filter(
      (row) => row.caseId === "overflow-matrix",
    );
    expect(overflowRows).toHaveLength(
      REFERENCE_SURFACE_ROUTES.length * REFERENCE_SURFACE_VIEWPORT_IDS.length,
    );

    for (const row of overflowRows) {
      const route = REFERENCE_SURFACE_ROUTES.find(
        (entry) => entry.id === row.routeId,
      );
      expect(route?.path).toBe(row.path);
      expect(row.viewportId).not.toBeNull();
      expect(row.width).toBeGreaterThan(0);
      expect(row.height).toBeGreaterThan(0);
    }

    const budgetRows = expanded.filter(
      (row) => row.caseId === "focused-payload-budgets",
    );
    expect(budgetRows.map((row) => row.routeId)).toEqual([
      ...REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS,
    ]);
    for (const row of budgetRows) {
      expect(row.viewportId).toBeNull();
      expect(row.harness).toBe("evaluateReferencePayloadBudgets");
    }
  });

  test("focused payload budgets remain aligned and W20 suites stay excluded", () => {
    expect(referencePayloadBudgetsAlignWithSurfaceContract()).toBe(true);
    expect(REFERENCE_PAYLOAD_BUDGET_COMMAND).toBe("make budget");
    expect(A11Y_SUITE_REPRODUCTION_COMMAND).toBe("make a11y");
    expect(REFERENCE_BROWSER_CLOSEOUT_EXCLUDED_W20_SUITES).toEqual([
      "static-export-sitemap-canonical",
      "full-link-search-cross-surface-convergence",
    ]);
  });
});
