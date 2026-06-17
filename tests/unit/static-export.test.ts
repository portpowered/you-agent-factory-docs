import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import nextConfig from "../../next.config";
import { PROJECT_TAGLINE } from "../../src/lib/project";
import { GITHUB_REPO_URL } from "../../src/lib/shared-shell-config";
import {
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
import { enMessages } from "../../src/localization/messages/en";
import { fetchHttp } from "../helpers/http";
import {
  ensureStaticExportBuilt,
  startStaticExportServer,
  waitForStaticExportServer,
} from "../helpers/static-export-server";
import { getTestPort } from "../helpers/test-port";

const publicKnowledgePages = [
  {
    path: "/glossary/agent",
    title: "Agent",
    excerpt: "named worker inside a workflow",
  },
  {
    path: "/comparisons/vs-n8n",
    title: "You Agent Factory vs n8n",
    excerpt:
      "automate repeatable work, but they optimize for different operating models",
  },
  {
    path: "/references/loop-engineering",
    title: "Loop engineering",
    excerpt: "designing the feedback cycle around an agent workflow",
  },
] as const;

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
  const port = getTestPort(3785, "STATIC_EXPORT_TEST_PORT");
  let server: ReturnType<typeof startStaticExportServer>;

  beforeAll(async () => {
    await ensureStaticExportBuilt();
    server = startStaticExportServer(port);
    await waitForStaticExportServer(server.baseUrl);
  }, 120_000);

  afterAll(() => {
    server?.stop();
  });

  test("serves homepage, docs entry, and code presentation example routes under the configured base path", async () => {
    const homepageResponse = await fetchHttp(server.baseUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const exampleResponse = await fetchHttp(
      new URL(withBasePath("/docs/examples/code-presentation"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(homepageResponse.status).toBe(200);
    expect(docsResponse.status).toBe(200);
    expect(exampleResponse.status).toBe(200);

    const exampleHtml = await exampleResponse.text();
    expect(exampleHtml).toContain("Code presentation primitives");
    expect(exampleHtml).toContain("Code block");
    expect(exampleHtml).toContain("Code tabs");
    expect(exampleHtml).toContain("Callouts");
    expect(exampleHtml).toContain("File tree");
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
    expect(homepageHtml).toContain(enMessages.common.getStarted);
    expect(homepageHtml).toContain(`href="${GITHUB_REPO_URL}"`);
    expect(homepageHtml).toContain(enMessages.common.githubCta);
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

  test("renders generated docs navigation from canonical content records", async () => {
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const docsHtml = await docsResponse.text();
    const gettingStartedPath = withBasePath("/docs/getting-started").replace(
      /\//g,
      "\\/",
    );

    expect(docsHtml).toContain("Getting started");
    expect(docsHtml).toContain("Core concepts");
    expect(docsHtml).toContain("Installation");
    expect(docsHtml).toContain("Configuration");
    expect(docsHtml).toContain("Guides");
    expect(docsHtml).toContain("Setup");
    expect(new RegExp(`href="${gettingStartedPath}/?"`).test(docsHtml)).toBe(
      true,
    );
    expect(docsHtml).not.toContain("Overview");
  }, 30_000);

  test("follows a generated docs navigation link to a served doc page", async () => {
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const docsHtml = await docsResponse.text();
    const gettingStartedPath = withBasePath("/docs/getting-started").replace(
      /\//g,
      "\\/",
    );
    const gettingStartedMatch = docsHtml.match(
      new RegExp(`href="(${gettingStartedPath}/?)"`),
    );

    expect(gettingStartedMatch?.[1]).toBeTruthy();

    const docPageResponse = await fetchHttp(
      new URL(gettingStartedMatch?.[1] ?? "", server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(docPageResponse.status).toBe(200);

    const docPageHtml = await docPageResponse.text();
    expect(docPageHtml).toContain("Getting started");
    expect(docPageHtml).toContain(
      "Starter documentation content that proves the canonical content model.",
    );
    expect(docPageHtml).toContain(
      `aria-label="${enMessages.docs.breadcrumbAriaLabel}"`,
    );
    expect(docPageHtml).toContain(enMessages.docs.shellTitle);
    expect(docPageHtml).toContain("Guides");
    expect(docPageHtml).toContain('aria-current="page"');
    expect(docPageHtml).toContain(
      `aria-label="${enMessages.docs.progressionAriaLabel}"`,
    );
    expect(docPageHtml).toContain(enMessages.docs.nextPagePrefix);
    expect(docPageHtml).toContain("Core concepts");
    expect(docPageHtml).toContain('rel="next"');
    expect(docPageHtml).toContain(
      `aria-label="${enMessages.docs.pageOutlineAriaLabel}"`,
    );
    expect(docPageHtml).toContain('href="#prerequisites"');
    expect(docPageHtml).toContain('id="prerequisites"');
    expect(docPageHtml).toContain("Prerequisites");
    expect(docPageHtml).toContain("Next steps");
  }, 30_000);

  test("serves doc pages without page-outline navigation when headings are insufficient", async () => {
    const installationResponse = await fetchHttp(
      new URL(withBasePath("/docs/installation"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(installationResponse.status).toBe(200);

    const installationHtml = await installationResponse.text();

    expect(installationHtml).toContain("Installation");
    expect(installationHtml).not.toContain(
      `aria-label="${enMessages.docs.pageOutlineAriaLabel}"`,
    );
  }, 30_000);

  test("serves glossary, comparison, and reference starter pages on their public routes", async () => {
    for (const knowledgePage of publicKnowledgePages) {
      const response = await fetchHttp(
        new URL(withBasePath(knowledgePage.path), server.baseUrl),
        { signal: AbortSignal.timeout(10_000) },
      );

      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain(knowledgePage.title);
      expect(html).toContain(knowledgePage.excerpt);
      expect(html).toContain(
        `aria-label="${enMessages.docs.breadcrumbAriaLabel}"`,
      );
      expect(html).toContain('href="/you-agent-factory-docs/docs/"');
    }
  }, 30_000);

  test("follows generated previous-next progression across docs pages", async () => {
    const gettingStartedResponse = await fetchHttp(
      new URL(withBasePath("/docs/getting-started"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const gettingStartedHtml = await gettingStartedResponse.text();
    const conceptsPath = withBasePath("/docs/concepts").replace(/\//g, "\\/");

    expect(
      new RegExp(
        `<a[^>]*href="(${conceptsPath}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${conceptsPath}/?)"`,
      ).test(gettingStartedHtml),
    ).toBe(true);

    const nextHrefMatch = gettingStartedHtml.match(
      new RegExp(
        `<a[^>]*href="(${conceptsPath}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${conceptsPath}/?)"`,
      ),
    );
    const nextHref = nextHrefMatch?.[1] ?? nextHrefMatch?.[2];

    expect(nextHref).toBeTruthy();

    const conceptsResponse = await fetchHttp(
      new URL(nextHref ?? "", server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(conceptsResponse.status).toBe(200);

    const conceptsHtml = await conceptsResponse.text();
    const gettingStartedPath = withBasePath("/docs/getting-started").replace(
      /\//g,
      "\\/",
    );

    expect(conceptsHtml).toContain("Core concepts");
    expect(
      new RegExp(
        `<a[^>]*href="(${gettingStartedPath}/?)"[^>]*rel="prev"|<a[^>]*rel="prev"[^>]*href="(${gettingStartedPath}/?)"`,
      ).test(conceptsHtml),
    ).toBe(true);
    expect(conceptsHtml).toContain(enMessages.docs.previousPagePrefix);
    expect(conceptsHtml).toContain("Getting started");
  }, 30_000);
});
