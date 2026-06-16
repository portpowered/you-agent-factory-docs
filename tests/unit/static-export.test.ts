import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import nextConfig from "../../next.config";
import { PROJECT_TAGLINE } from "../../src/lib/project";
import {
  DOCS_CTA_LABEL,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  LANDING_EXAMPLE_WORKFLOWS_TITLE,
  LANDING_FINAL_CTA_TITLE,
  LANDING_HOW_IT_WORKS_TITLE,
  LANDING_PROBLEM_TITLE,
  LANDING_SOLUTION_TITLE,
  LANDING_WHY_TITLE,
} from "../../src/lib/shell";
import {
  DOCS_ENTRY_ROUTE,
  SITE_BASE_PATH,
  withBasePath,
} from "../../src/lib/site";
import { fetchHttp } from "../helpers/http";
import {
  buildStaticExport,
  startStaticExportServer,
  waitForStaticExportServer,
} from "../helpers/static-export-server";

describe("static export configuration", () => {
  test("configures Next.js for fully static GitHub Pages export", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.basePath).toBe(SITE_BASE_PATH);
    expect(nextConfig.assetPrefix).toBe(`${SITE_BASE_PATH}/`);
    expect(nextConfig.trailingSlash).toBe(true);
    expect(nextConfig.images?.unoptimized).toBe(true);
  });
});

describe("served static export navigation", () => {
  const port = 3785;
  let server: ReturnType<typeof startStaticExportServer>;

  beforeAll(async () => {
    buildStaticExport();
    server = startStaticExportServer(port);
    await waitForStaticExportServer(server.baseUrl);
  }, 120_000);

  afterAll(() => {
    server.stop();
  });

  test("serves homepage and docs entry routes under the configured base path", async () => {
    const homepageResponse = await fetchHttp(server.baseUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(homepageResponse.status).toBe(200);
    expect(docsResponse.status).toBe(200);
  });

  test("follows the homepage docs CTA to the docs shell entry route", async () => {
    const homepageResponse = await fetchHttp(server.baseUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    const homepageHtml = await homepageResponse.text();
    const docsBasePath = withBasePath(DOCS_ENTRY_ROUTE).replace(/\//g, "\\/");
    const docsCtaMatch = homepageHtml.match(
      new RegExp(`href="(${docsBasePath}/?)"[^>]*>[\\s\\S]*?${DOCS_CTA_LABEL}`),
    );

    expect(docsCtaMatch?.[1]).toBeTruthy();

    const docsResponse = await fetchHttp(
      new URL(docsCtaMatch?.[1] ?? "", server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(docsResponse.status).toBe(200);
  }, 30_000);

  test("exports the complete first-visit homepage story with primary CTA destinations", async () => {
    const homepageResponse = await fetchHttp(server.baseUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    const homepageHtml = await homepageResponse.text();

    for (const sectionTitle of [
      PROJECT_TAGLINE,
      LANDING_PROBLEM_TITLE,
      LANDING_SOLUTION_TITLE,
      LANDING_EXAMPLE_WORKFLOWS_TITLE,
      LANDING_HOW_IT_WORKS_TITLE,
      LANDING_WHY_TITLE,
      LANDING_FINAL_CTA_TITLE,
    ]) {
      expect(homepageHtml).toContain(sectionTitle);
    }

    const docsBasePath = withBasePath(DOCS_ENTRY_ROUTE);
    expect(homepageHtml).toContain(`href="${docsBasePath}/"`);
    expect(homepageHtml).toContain(DOCS_CTA_LABEL);
    expect(homepageHtml).toContain(`href="${GITHUB_REPO_URL}"`);
    expect(homepageHtml).toContain(GITHUB_CTA_LABEL);
  }, 30_000);
});
