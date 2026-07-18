import { describe, expect, test } from "bun:test";
import {
  A11Y_SUITE_REPRODUCTION_COMMAND,
  getReferenceSurfaceRoute,
  getReferenceSurfaceViewport,
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  listReferenceOverflowMatrixCases,
  listReferenceSurfaceRoutePaths,
  PAGE_OVERFLOW_TOLERANCE_PX,
  REFERENCE_SURFACE_ROUTE_IDS,
  REFERENCE_SURFACE_ROUTES,
  REFERENCE_SURFACE_VIEWPORT_IDS,
  REFERENCE_SURFACE_VIEWPORTS,
  REFERENCE_ZOOMED_VIEWPORT,
} from "./a11y-reference-surface-contract";
import { CRITICAL_VIEWPORTS } from "./a11y-responsive-contract";

describe("a11y-reference-surface route contract", () => {
  test("documents the focused a11y suite reproduction command", () => {
    expect(A11Y_SUITE_REPRODUCTION_COMMAND).toBe("make a11y");
  });

  test("enumerates api, events, factory-schema, and one authored factory/worker/workstation page", () => {
    const byId = Object.fromEntries(
      REFERENCE_SURFACE_ROUTES.map((route) => [route.id, route.path]),
    );

    expect(byId["references-api"]).toBe("/docs/references/api");
    expect(byId["references-events"]).toBe("/docs/references/events");
    expect(byId["references-factory-schema"]).toBe(
      "/docs/references/factory-schema",
    );
    expect(byId["authored-factory"]).toMatch(/^\/docs\/factories\//);
    expect(byId["authored-worker"]).toMatch(/^\/docs\/workers\//);
    expect(byId["authored-workstation"]).toMatch(/^\/docs\/workstations\//);

    expect(REFERENCE_SURFACE_ROUTE_IDS).toEqual([
      "references-api",
      "references-events",
      "references-factory-schema",
      "authored-factory",
      "authored-worker",
      "authored-workstation",
    ]);
    expect(listReferenceSurfaceRoutePaths()).toEqual(
      REFERENCE_SURFACE_ROUTES.map((route) => route.path),
    );
  });

  test("getReferenceSurfaceRoute resolves known ids", () => {
    expect(getReferenceSurfaceRoute("references-api")?.path).toBe(
      "/docs/references/api",
    );
    expect(getReferenceSurfaceRoute("authored-factory")?.kind).toBe("authored");
    expect(getReferenceSurfaceRoute("references-events")?.kind).toBe(
      "reference",
    );
  });
});

describe("a11y-reference-surface viewport contract", () => {
  test("covers large desktop, laptop, tablet, narrow phone, and zoomed layouts", () => {
    const byId = Object.fromEntries(
      REFERENCE_SURFACE_VIEWPORTS.map((viewport) => [viewport.id, viewport]),
    );

    expect(byId.wide?.width).toBe(1440);
    expect(byId.laptop?.width).toBe(1024);
    expect(byId.tablet?.width).toBe(768);
    expect(byId.mobile?.width).toBe(390);
    expect(byId.zoomed?.width).toBe(512);
    expect(byId.zoomed?.height).toBe(384);

    expect(REFERENCE_SURFACE_VIEWPORT_IDS).toEqual([
      "wide",
      "laptop",
      "tablet",
      "mobile",
      "zoomed",
    ]);
    expect(getReferenceSurfaceViewport("zoomed")?.label).toContain("200%");
  });

  test("reuses critical desktop/laptop/tablet/phone widths and adds zoomed (~200% of laptop)", () => {
    const criticalById = Object.fromEntries(
      CRITICAL_VIEWPORTS.map((viewport) => [viewport.id, viewport]),
    );

    expect(getReferenceSurfaceViewport("wide")?.width).toBe(
      criticalById.wide?.width,
    );
    expect(getReferenceSurfaceViewport("laptop")?.width).toBe(
      criticalById.laptop?.width,
    );
    expect(getReferenceSurfaceViewport("tablet")?.width).toBe(
      criticalById.tablet?.width,
    );
    expect(getReferenceSurfaceViewport("mobile")?.width).toBe(
      criticalById.mobile?.width,
    );

    expect(REFERENCE_ZOOMED_VIEWPORT.width).toBe(
      Math.floor((criticalById.laptop?.width ?? 0) / 2),
    );
    expect(REFERENCE_ZOOMED_VIEWPORT.height).toBe(
      Math.floor((criticalById.laptop?.height ?? 0) / 2),
    );
  });

  test("reuses overflow tolerance and intentional scroll selectors from the critical contract", () => {
    expect(PAGE_OVERFLOW_TOLERANCE_PX).toBe(1);
    expect(INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS).toContain(
      '[data-rich-content-scroll="code"]',
    );
    expect(INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS).toContain("pre");
    expect(INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS).toContain(
      ".overflow-x-auto",
    );
  });

  test("overflow matrix enumerates every reference route at every W19 viewport", () => {
    const cases = listReferenceOverflowMatrixCases();
    expect(cases).toHaveLength(
      REFERENCE_SURFACE_ROUTES.length * REFERENCE_SURFACE_VIEWPORTS.length,
    );
    expect(cases[0]?.route.id).toBe("references-api");
    expect(cases[0]?.viewport.id).toBe("wide");
    expect(cases.at(-1)?.route.id).toBe("authored-workstation");
    expect(cases.at(-1)?.viewport.id).toBe("zoomed");

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
});
