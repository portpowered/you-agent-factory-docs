import { describe, expect, test } from "bun:test";
import {
  CRITICAL_ROUTE_IDS,
  CRITICAL_ROUTES,
  CRITICAL_VIEWPORT_IDS,
  CRITICAL_VIEWPORTS,
  getCriticalRoute,
  getCriticalViewport,
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  listCriticalRoutePaths,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "./a11y-responsive-contract";

describe("a11y-responsive critical-route contract", () => {
  test("enumerates home, browse, search, docs article, harness-support, blog index, and blog post", () => {
    const byId = Object.fromEntries(
      CRITICAL_ROUTES.map((route) => [route.id, route.path]),
    );

    expect(byId.home).toBe("/");
    expect(byId.browse).toBe("/browse");
    expect(byId.search).toBe("/search");
    expect(byId["docs-article"]).toMatch(/^\/docs\//);
    expect(byId["harness-support"]).toBe("/docs/documentation/harness-support");
    expect(byId["blog-index"]).toBe("/blog");
    expect(byId["blog-post"]).toMatch(/^\/blog\//);

    expect(CRITICAL_ROUTE_IDS).toEqual([
      "home",
      "browse",
      "search",
      "docs-article",
      "harness-support",
      "blog-index",
      "blog-post",
    ]);
    expect(listCriticalRoutePaths()).toEqual(
      CRITICAL_ROUTES.map((route) => route.path),
    );
  });

  test("getCriticalRoute resolves known ids", () => {
    expect(getCriticalRoute("harness-support")?.path).toBe(
      "/docs/documentation/harness-support",
    );
    expect(getCriticalRoute("home")?.label).toBe("Home");
  });
});

describe("a11y-responsive viewport contract", () => {
  test("includes mobile, tablet, laptop, and wide CSS-pixel widths", () => {
    const byId = Object.fromEntries(
      CRITICAL_VIEWPORTS.map((viewport) => [viewport.id, viewport]),
    );

    expect(byId.mobile.width).toBe(390);
    expect(byId.tablet.width).toBe(768);
    expect(byId.laptop.width).toBe(1024);
    expect(byId.wide.width).toBe(1440);

    expect(CRITICAL_VIEWPORT_IDS).toEqual([
      "mobile",
      "tablet",
      "laptop",
      "wide",
    ]);
    expect(getCriticalViewport("tablet")?.height).toBe(1024);
  });

  test("defines overflow tolerance and intentional scroll selectors", () => {
    expect(PAGE_OVERFLOW_TOLERANCE_PX).toBe(1);
    expect(INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS).toContain(
      "[data-harness-support-matrix]",
    );
    expect(INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS).toContain("pre");
    expect(INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS).toContain(
      ".overflow-x-auto",
    );
  });
});
