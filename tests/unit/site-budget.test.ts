import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { DOCS_ENTRY_ROUTE, SITE_BASE_PATH } from "../../src/lib/site";
import {
  SITE_BUDGET_ROUTE_TARGETS,
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
      { id: "homepage", label: "Homepage", route: "/" },
      { id: "docs-entry", label: "Docs entry", route: DOCS_ENTRY_ROUTE },
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
});
