import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import nextConfig from "../../next.config";
import {
  DOCS_ENTRY_ROUTE,
  SITE_BASE_PATH,
  withBasePath,
} from "../../src/lib/site";
import { enMessages } from "../../src/localization/messages/en";
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
      new RegExp(
        `href="(${docsBasePath}/?)"[^>]*>[\\s\\S]*?${enMessages.common.getStarted}`,
      ),
    );

    expect(docsCtaMatch?.[1]).toBeTruthy();

    const docsResponse = await fetchHttp(
      new URL(docsCtaMatch?.[1] ?? "", server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(docsResponse.status).toBe(200);
  }, 30_000);

  test("exposes the same primary navigation destinations on homepage and docs entry routes", async () => {
    const homepageResponse = await fetchHttp(server.baseUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    const homepageHtml = await homepageResponse.text();
    const docsHtml = await docsResponse.text();

    for (const html of [homepageHtml, docsHtml]) {
      expect(html).toContain(
        `aria-label="${enMessages.landing.primaryNavAriaLabel}"`,
      );
      expect(html).toContain(enMessages.common.githubCta);
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain('id="shared-shell-primary-nav"');
      expect(html).toContain('aria-controls="shared-shell-primary-nav"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain(enMessages.shell.openMenuLabel);
    }

    expect(homepageHtml).toContain(enMessages.common.getStarted);
    expect(homepageHtml).not.toContain(`>${enMessages.common.home}<`);
    expect(docsHtml).toContain(enMessages.common.home);
    expect(docsHtml).not.toContain(`>${enMessages.common.getStarted}<`);
  }, 30_000);
});
