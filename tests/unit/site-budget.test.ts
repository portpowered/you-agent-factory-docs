import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { DOCS_ENTRY_ROUTE, SITE_BASE_PATH } from "../../src/lib/site";
import {
  SITE_BUDGET_ROUTE_TARGETS,
  assertSiteBudget,
  evaluateRouteBudget,
  measureBudgetRoute,
  resolveBudgetRouteUrl,
} from "../../src/lib/site-budget";
import { fetchHttp } from "../helpers/http";
import {
  buildStaticExport,
  startStaticExportServer,
  waitForStaticExportServer,
} from "../helpers/static-export-server";

describe("site budget route coverage", () => {
  test("defines the exported homepage and docs entry route as the audit scope", () => {
    expect(SITE_BUDGET_ROUTE_TARGETS).toEqual([
      {
        id: "homepage",
        label: "Homepage",
        route: "/",
        budget: {
          maxHtmlBytes: 8_500,
          maxScriptTagCount: 13,
          maxStylesheetLinkCount: 1,
          maxImageCount: 0,
          requireMainLandmark: true,
          requireTitle: true,
          requireH1: true,
        },
      },
      {
        id: "docs-entry",
        label: "Docs entry",
        route: DOCS_ENTRY_ROUTE,
        budget: {
          maxHtmlBytes: 9_000,
          maxScriptTagCount: 13,
          maxStylesheetLinkCount: 1,
          maxImageCount: 0,
          requireMainLandmark: true,
          requireTitle: true,
          requireH1: true,
        },
      },
    ]);
  });

  test("resolves budget URLs under the GitHub Pages export base path", () => {
    const baseUrl = `http://127.0.0.1:3786${SITE_BASE_PATH}/`;

    expect(resolveBudgetRouteUrl(baseUrl, "/")).toBe(
      `http://127.0.0.1:3786${SITE_BASE_PATH}/`,
    );
    expect(resolveBudgetRouteUrl(baseUrl, DOCS_ENTRY_ROUTE)).toBe(
      `http://127.0.0.1:3786${SITE_BASE_PATH}/docs/`,
    );
  });
});

describe("site budget measurements", () => {
  const port = 3787;
  let server: ReturnType<typeof startStaticExportServer>;

  beforeAll(async () => {
    buildStaticExport();
    server = startStaticExportServer(port);
    await waitForStaticExportServer(server.baseUrl);
  }, 120_000);

  afterAll(() => {
    server.stop();
  });

  test("measures the served homepage and docs entry route from the static export", async () => {
    const measurements = await Promise.all(
      SITE_BUDGET_ROUTE_TARGETS.map((route) =>
        measureBudgetRoute(fetchHttp, server.baseUrl, route),
      ),
    );

    expect(
      measurements.map((measurement) => ({
        id: measurement.route.id,
        requestUrl: measurement.requestUrl,
        status: measurement.status,
        titlePresent: measurement.titlePresent,
        mainLandmarkPresent: measurement.mainLandmarkPresent,
        hasHeading: Boolean(measurement.h1Text),
      })),
    ).toEqual([
      {
        id: "homepage",
        requestUrl: `http://127.0.0.1:${port}${SITE_BASE_PATH}/`,
        status: 200,
        titlePresent: true,
        mainLandmarkPresent: true,
        hasHeading: true,
      },
      {
        id: "docs-entry",
        requestUrl: `http://127.0.0.1:${port}${SITE_BASE_PATH}/docs/`,
        status: 200,
        titlePresent: true,
        mainLandmarkPresent: true,
        hasHeading: true,
      },
    ]);
  }, 30_000);

  test("accepts the current exported routes against the checked-in budgets", async () => {
    const measurements = await Promise.all(
      SITE_BUDGET_ROUTE_TARGETS.map((route) =>
        measureBudgetRoute(fetchHttp, server.baseUrl, route),
      ),
    );

    expect(() => assertSiteBudget(measurements)).not.toThrow();
  }, 30_000);
});

describe("site budget failures", () => {
  test("reports the failing route and budget dimensions when a route regresses", () => {
    const homepage = SITE_BUDGET_ROUTE_TARGETS[0];
    const failures = evaluateRouteBudget(
      {
        route: homepage,
        requestUrl: "http://127.0.0.1:3786/you-agent-factory-docs/",
        status: 200,
        htmlBytes: 8_900,
        scriptTagCount: 15,
        stylesheetLinkCount: 1,
        imageCount: 0,
        mainLandmarkPresent: false,
        titlePresent: true,
        h1Text: null,
      },
      homepage.budget,
    );

    expect(failures).toEqual([
      {
        route: homepage,
        dimension: "htmlBytes",
        message: "expected htmlBytes<=8500, received 8900",
      },
      {
        route: homepage,
        dimension: "scriptTagCount",
        message: "expected scripts<=13, received 15",
      },
      {
        route: homepage,
        dimension: "mainLandmarkPresent",
        message: "expected a <main> landmark",
      },
      {
        route: homepage,
        dimension: "h1Text",
        message: "expected a non-empty <h1>",
      },
    ]);

    expect(() =>
      assertSiteBudget([
        {
          route: homepage,
          requestUrl: "http://127.0.0.1:3786/you-agent-factory-docs/",
          status: 200,
          htmlBytes: 8_900,
          scriptTagCount: 15,
          stylesheetLinkCount: 1,
          imageCount: 0,
          mainLandmarkPresent: false,
          titlePresent: true,
          h1Text: null,
        },
      ]),
    ).toThrow(
      "Site budget check failed:\n- Homepage (/) htmlBytes: expected htmlBytes<=8500, received 8900\n- Homepage (/) scriptTagCount: expected scripts<=13, received 15\n- Homepage (/) mainLandmarkPresent: expected a <main> landmark\n- Homepage (/) h1Text: expected a non-empty <h1>",
    );
  });
});
