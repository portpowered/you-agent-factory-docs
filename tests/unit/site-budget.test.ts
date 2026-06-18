import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { DOCS_ENTRY_ROUTE, SITE_BASE_PATH } from "../../src/lib/site";
import {
  SITE_BUDGET_GUIDANCE,
  SITE_BUDGET_ROUTE_TARGETS,
  SITE_BUDGET_STATIC_ASSET_TARGETS,
  assertSiteBudget,
  assertStaticAssetBudget,
  evaluateRouteBudget,
  evaluateStaticAssetBudget,
  measureBudgetRoute,
  measureStaticAssetBudget,
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
          maxHtmlBytes: 20_500,
          maxScriptTagCount: 17,
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
          maxHtmlBytes: 58_000,
          maxScriptTagCount: 32,
          maxStylesheetLinkCount: 2,
          maxImageCount: 0,
          requireMainLandmark: true,
          requireTitle: true,
          requireH1: true,
        },
      },
    ]);
  });

  test("defines the exported next-static javascript asset budget scope", () => {
    expect(SITE_BUDGET_STATIC_ASSET_TARGETS).toEqual([
      {
        id: "next-static-javascript",
        label: "Next static JavaScript",
        directory: "_next/static",
        fileExtension: ".js",
        budget: {
          maxTotalBytes: 4_405_000,
        },
      },
    ]);
  });

  test("documents the checked-in budget command scope and current limitations", () => {
    expect(SITE_BUDGET_GUIDANCE).toEqual({
      command: "make budget",
      protectedRoutes: ["/", DOCS_ENTRY_ROUTE],
      protectedAssetSurfaces: ["_next/static"],
      currentLimitations: [
        "Only the exported homepage and docs entry route are measured in this lane.",
        "The asset budget currently covers total emitted JavaScript bytes under out/_next/static only.",
        "Broader route coverage, richer bundle analysis, search-index budgets, and platform-level performance instrumentation remain out of scope for this phase.",
      ],
    });
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
  const exportRoot = join(process.cwd(), "out");
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

  test("accepts the current exported static assets against the checked-in budget", () => {
    const measurements = SITE_BUDGET_STATIC_ASSET_TARGETS.map((target) =>
      measureStaticAssetBudget(exportRoot, target),
    );

    expect(measurements).toHaveLength(1);
    expect(measurements[0].target).toEqual(SITE_BUDGET_STATIC_ASSET_TARGETS[0]);
    expect(measurements[0].assetCount).toBeGreaterThan(0);
    expect(measurements[0].largestAssetPath).toMatch(
      /^\/_next\/static\/.+\.js$/,
    );
    expect(measurements[0].totalBytes).toBeLessThanOrEqual(
      SITE_BUDGET_STATIC_ASSET_TARGETS[0].budget.maxTotalBytes,
    );

    expect(() => assertStaticAssetBudget(measurements)).not.toThrow();
  });
});

describe("site budget failures", () => {
  test("reports the failing route and budget dimensions when a route regresses", () => {
    const homepage = SITE_BUDGET_ROUTE_TARGETS[0];
    const failures = evaluateRouteBudget(
      {
        route: homepage,
        requestUrl: "http://127.0.0.1:3786/you-agent-factory-docs/",
        status: 200,
        htmlBytes: 20_900,
        scriptTagCount: 18,
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
        message: "expected htmlBytes<=20500, received 20900",
      },
      {
        route: homepage,
        dimension: "scriptTagCount",
        message: "expected scripts<=17, received 18",
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
          htmlBytes: 20_900,
          scriptTagCount: 18,
          stylesheetLinkCount: 1,
          imageCount: 0,
          mainLandmarkPresent: false,
          titlePresent: true,
          h1Text: null,
        },
      ]),
    ).toThrow(
      "Site budget check failed:\n- Homepage (/) htmlBytes: expected htmlBytes<=20500, received 20900\n- Homepage (/) scriptTagCount: expected scripts<=17, received 18\n- Homepage (/) mainLandmarkPresent: expected a <main> landmark\n- Homepage (/) h1Text: expected a non-empty <h1>",
    );
  });

  test("reports the failing asset budget with the measured payload surface", () => {
    const staticJs = SITE_BUDGET_STATIC_ASSET_TARGETS[0];
    const failures = evaluateStaticAssetBudget(
      {
        target: staticJs,
        assetCount: 16,
        totalBytes: 4_450_000,
        largestAssetPath: "/_next/static/chunks/framework-example.js",
        largestAssetBytes: 200_000,
      },
      staticJs.budget,
    );

    expect(failures).toEqual([
      {
        target: staticJs,
        dimension: "totalBytes",
        message:
          "expected totalBytes<=4405000, received 4450000; across 16 .js assets; largest=/_next/static/chunks/framework-example.js (200000 bytes)",
      },
    ]);

    expect(() =>
      assertStaticAssetBudget([
        {
          target: staticJs,
          assetCount: 16,
          totalBytes: 4_450_000,
          largestAssetPath: "/_next/static/chunks/framework-example.js",
          largestAssetBytes: 200_000,
        },
      ]),
    ).toThrow(
      "Static asset budget check failed:\n- Next static JavaScript (_next/static) totalBytes: expected totalBytes<=4405000, received 4450000; across 16 .js assets; largest=/_next/static/chunks/framework-example.js (200000 bytes)",
    );
  });
});
