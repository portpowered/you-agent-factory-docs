import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import nextConfig from "../../next.config";
import {
  FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM,
  FACTORY_WORKFLOW_MERMAID_DIAGRAM,
} from "../../src/content/docs-diagrams";
import { loadDocsShellNavigation } from "../../src/lib/content";
import { PROJECT_NAME, PROJECT_TAGLINE } from "../../src/lib/project";
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

function escapeHrefForHtmlMatch(href: string): string {
  return href.replace(/\//g, "\\/");
}

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
  }, 240_000);

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

  test("keeps the homepage shared-shell nav and serves the docs entry through the Fumadocs layout shell", async () => {
    const homepageResponse = await fetchHttp(server.baseUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    const homepageHtml = await homepageResponse.text();
    const docsHtml = await docsResponse.text();

    expect(homepageHtml).toContain(
      `aria-label="${enMessages.landing.primaryNavAriaLabel}"`,
    );
    expect(homepageHtml).toContain('id="shared-shell-primary-nav"');
    expect(homepageHtml).toContain('aria-controls="shared-shell-primary-nav"');
    expect(homepageHtml).toContain('aria-expanded="false"');
    expect(homepageHtml).toContain(enMessages.shell.openMenuLabel);
    expect(homepageHtml).toContain(enMessages.common.getStarted);
    expect(homepageHtml).not.toContain(`>${enMessages.common.home}<`);
    expect(homepageHtml).toContain(enMessages.common.githubCta);
    expect(homepageHtml).toContain('rel="noopener noreferrer"');
    expect(homepageHtml).toContain('target="_blank"');

    expect(docsHtml).toContain('id="nd-docs-layout"');
    expect(docsHtml).toContain('id="nd-sidebar"');
    expect(docsHtml).toContain(GITHUB_REPO_URL);
    expect(docsHtml).toContain(PROJECT_NAME);
    expect(docsHtml).toContain('aria-label="Breadcrumb"');
    expect(docsHtml).not.toContain('id="shared-shell-primary-nav"');
    expect(docsHtml).not.toContain(`>${enMessages.common.getStarted}<`);
  }, 30_000);

  test("renders generated docs navigation from canonical content records", async () => {
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const docsHtml = await docsResponse.text();
    const introductionPath = withBasePath("/docs/introduction").replace(
      /\//g,
      "\\/",
    );

    expect(docsHtml).toContain("Introduction");
    expect(docsHtml).toContain("Getting started");
    expect(docsHtml).toContain("Quickstart");
    expect(docsHtml).toContain("CLI overview");
    expect(docsHtml).toContain("Configuration");
    expect(docsHtml).toContain("Workflow concepts");
    expect(docsHtml).toContain("Human approval gates");
    expect(docsHtml).toContain("Installation");
    expect(docsHtml).toContain("Guides");
    expect(docsHtml).toContain("Setup");
    expect(new RegExp(`href="${introductionPath}/?"`).test(docsHtml)).toBe(
      true,
    );
    expect(docsHtml).not.toContain("Overview");
  }, 30_000);

  test("ships reviewer-visible Mermaid and React Flow examples on the docs entry route", async () => {
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const docsHtml = await docsResponse.text();

    expect(docsHtml).toContain(enMessages.docs.examplesHeading);
    expect(docsHtml).toContain(enMessages.docs.examplesText);
    expect(docsHtml).toContain(enMessages.docs.mermaidExampleLabel);
    expect(docsHtml).toContain(enMessages.docs.reactFlowExampleLabel);
    expect(docsHtml).toContain(FACTORY_WORKFLOW_MERMAID_DIAGRAM.title);
    expect(docsHtml).toContain(
      "Rendering Mermaid diagram from checked-in source",
    );
    expect(docsHtml).toContain("Mermaid source of truth");
    expect(docsHtml).toContain("flowchart LR");
    expect(docsHtml).toContain(FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title);
    expect(docsHtml).toContain("React Flow source of truth");
    expect(docsHtml).toContain("Factory executor");
    expect(docsHtml).toContain("Verification lane");
    expect(docsHtml).toContain("rendered diagram");
    expect(docsHtml).toContain("react-flow__viewport");
  }, 30_000);

  test("follows a generated docs navigation link to a served doc page", async () => {
    const docsResponse = await fetchHttp(
      new URL(withBasePath(DOCS_ENTRY_ROUTE), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const docsHtml = await docsResponse.text();
    const introductionPath = withBasePath("/docs/introduction").replace(
      /\//g,
      "\\/",
    );
    const introductionMatch = docsHtml.match(
      new RegExp(`href="(${introductionPath}/?)"`),
    );

    expect(introductionMatch?.[1]).toBeTruthy();

    const docPageResponse = await fetchHttp(
      new URL(introductionMatch?.[1] ?? "", server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(docPageResponse.status).toBe(200);

    const docPageHtml = await docPageResponse.text();
    expect(docPageHtml).toContain("Introduction");
    expect(docPageHtml).toContain(
      "You Agent Factory is an open-source, engineering-native platform for turning recurring development work into reusable, inspectable AI agent workflows.",
    );
    expect(docPageHtml).toContain(
      "This path is for engineers and technical teams who already work from repositories, files, command-line tools, and review processes, and want a clearer way to structure recurring AI-assisted development work.",
    );
    expect(docPageHtml).toContain(
      `aria-label="${enMessages.docs.breadcrumbAriaLabel}"`,
    );
    expect(docPageHtml).toContain(enMessages.docs.shellTitle);
    expect(docPageHtml).toContain("Setup");
    expect(docPageHtml).toContain('aria-current="page"');
    expect(docPageHtml).toContain(
      `aria-label="${enMessages.docs.progressionAriaLabel}"`,
    );
    expect(docPageHtml).toContain(enMessages.docs.nextPagePrefix);
    expect(docPageHtml).toContain("Installation");
    expect(docPageHtml).toContain('rel="next"');
    expect(docPageHtml).toContain(
      `aria-label="${enMessages.docs.pageOutlineAriaLabel}"`,
    );
    expect(docPageHtml).toContain(
      'href="#what-you-agent-factory-helps-you-do"',
    );
    expect(docPageHtml).toContain('id="what-you-agent-factory-helps-you-do"');
    expect(docPageHtml).toContain("What You Agent Factory helps you do");
    expect(docPageHtml).toContain("Who this setup path is for");
    expect(docPageHtml).toContain("Why continue into setup");
    expect(docPageHtml).toContain("Continue through setup");
  }, 30_000);

  test("serves the coder reviewer pattern route from generated guides navigation", async () => {
    const guidesPage = loadDocsShellNavigation()
      .sections.find((section) => section.id === "guides")
      ?.pages.find((page) => page.canonicalId === "doc/coder-reviewer-pattern");

    expect(guidesPage).toEqual(
      expect.objectContaining({
        canonicalId: "doc/coder-reviewer-pattern",
        label: "Coder / Reviewer pattern",
        href: "/docs/coder-reviewer-pattern",
      }),
    );

    const response = await fetchHttp(
      new URL(withBasePath(guidesPage?.href ?? ""), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain("Coder / Reviewer pattern");
    expect(html).toContain("Who the two roles are");
    expect(html).toContain("Where approval gates matter");
    expect(html).toContain("Realistic limits and failure modes");
    expect(html).toContain("approval is treated as a real gate");
    expect(html).toContain("The most common failure mode is shallow review");
    expect(html).toContain(
      `aria-label="${enMessages.docs.breadcrumbAriaLabel}"`,
    );
    expect(html).toContain(
      `aria-label="${enMessages.docs.pageOutlineAriaLabel}"`,
    );
    expect(html).toContain('aria-current="page"');
  }, 30_000);

  test("serves the generated setup-path routes projected by docs navigation", async () => {
    const setupPages = loadDocsShellNavigation()
      .sections.find((section) => section.id === "setup")
      ?.pages.filter((page) =>
        new Set(["doc/introduction", "doc/installation", "doc/quickstart"]).has(
          page.canonicalId,
        ),
      );

    expect(setupPages?.map((page) => page.canonicalId)).toEqual([
      "doc/introduction",
      "doc/installation",
      "doc/quickstart",
    ]);

    for (const page of setupPages ?? []) {
      const response = await fetchHttp(
        new URL(withBasePath(page.href), server.baseUrl),
        { signal: AbortSignal.timeout(10_000) },
      );

      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain(page.label);
      expect(html).toContain(enMessages.docs.shellTitle);
      expect(html).toContain('aria-current="page"');
    }
  }, 30_000);

  test("renders the installation page with repository-supported setup and validation guidance", async () => {
    const installationResponse = await fetchHttp(
      new URL(withBasePath("/docs/installation"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(installationResponse.status).toBe(200);

    const installationHtml = await installationResponse.text();

    expect(installationHtml).toContain("Installation");
    expect(installationHtml).toContain(
      "Start with Bun 1.1 or newer available on your machine because the repository uses Bun for dependency installation, scripts, and test execution.",
    );
    expect(installationHtml).toContain(
      "Run `make setup` from the repository root to install or refresh dependencies.",
    );
    expect(installationHtml).toContain(
      "Run `make check`, `make test`, and `make build` after setup to verify that the local install matches pull request validation.",
    );
    expect(installationHtml).toContain(
      "Treat the install as successful when `make check`, `make test`, and `make build` finish without failures from the repository root.",
    );
    expect(installationHtml).toContain(
      `aria-label="${enMessages.docs.pageOutlineAriaLabel}"`,
    );
    expect(installationHtml).toContain('href="#prerequisites"');
    expect(installationHtml).toContain('id="install-the-repository"');
    expect(installationHtml).toContain("Validate the install");
    expect(installationHtml).toContain("What success looks like");
    expect(installationHtml).toContain("Continue into quickstart");
  }, 30_000);

  test("follows generated previous-next progression from installation into quickstart", async () => {
    const installationResponse = await fetchHttp(
      new URL(withBasePath("/docs/installation"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(installationResponse.status).toBe(200);

    const installationHtml = await installationResponse.text();
    const quickstartPath = withBasePath("/docs/quickstart").replace(
      /\//g,
      "\\/",
    );

    expect(
      new RegExp(
        `<a[^>]*href="(${quickstartPath}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${quickstartPath}/?)"`,
      ).test(installationHtml),
    ).toBe(true);
    expect(installationHtml).toContain(enMessages.docs.nextPagePrefix);
    expect(installationHtml).toContain("Quickstart");
  }, 30_000);

  test("renders the quickstart page with a concrete first local workflow outcome", async () => {
    const quickstartResponse = await fetchHttp(
      new URL(withBasePath("/docs/quickstart"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(quickstartResponse.status).toBe(200);

    const quickstartHtml = await quickstartResponse.text();

    expect(quickstartHtml).toContain("Quickstart");
    expect(quickstartHtml).toContain(
      "Run the docs site locally after installation so the first setup path ends in one concrete, reviewer-verifiable outcome.",
    );
    expect(quickstartHtml).toContain(
      "Complete the Installation step first so the repository dependencies are installed and `make check`, `make test`, and `make build` already pass from the repository root.",
    );
    expect(quickstartHtml).toContain(
      "Run `bun run dev` from the repository root.",
    );
    expect(quickstartHtml).toContain(
      "Treat the quickstart as successful when the local docs shell renders the setup sequence and you can move through Introduction, Installation, and Quickstart from the generated sidebar or previous-next navigation.",
    );
    expect(quickstartHtml).toContain(
      `aria-label="${enMessages.docs.pageOutlineAriaLabel}"`,
    );
    expect(quickstartHtml).toContain('href="#start-the-local-docs-site"');
    expect(quickstartHtml).toContain("Verify the first outcome");
    expect(quickstartHtml).toContain("Continue into deeper guides");
    expect(quickstartHtml).toContain("Getting started");
    expect(quickstartHtml).toContain("Core concepts");
  }, 30_000);

  test("renders page-outline navigation only when a page provides sufficient headings", async () => {
    const configurationResponse = await fetchHttp(
      new URL(withBasePath("/docs/configuration"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(configurationResponse.status).toBe(200);

    const configurationHtml = await configurationResponse.text();

    expect(configurationHtml).toContain(
      `aria-label="${enMessages.docs.pageOutlineAriaLabel}"`,
    );
  }, 30_000);

  test("follows generated previous-next progression across docs pages", async () => {
    const introductionResponse = await fetchHttp(
      new URL(withBasePath("/docs/introduction"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const introductionHtml = await introductionResponse.text();
    const installationPath = withBasePath("/docs/installation").replace(
      /\//g,
      "\\/",
    );

    expect(
      new RegExp(
        `<a[^>]*href="(${installationPath}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${installationPath}/?)"`,
      ).test(introductionHtml),
    ).toBe(true);

    const nextHrefMatch = introductionHtml.match(
      new RegExp(
        `<a[^>]*href="(${installationPath}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${installationPath}/?)"`,
      ),
    );
    const nextHref = nextHrefMatch?.[1] ?? nextHrefMatch?.[2];

    expect(nextHref).toBeTruthy();

    const installationResponse = await fetchHttp(
      new URL(nextHref ?? "", server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );

    expect(installationResponse.status).toBe(200);

    const installationHtml = await installationResponse.text();
    const introductionPath = withBasePath("/docs/introduction").replace(
      /\//g,
      "\\/",
    );

    expect(installationHtml).toContain("Installation");
    expect(
      new RegExp(
        `<a[^>]*href="(${introductionPath}/?)"[^>]*rel="prev"|<a[^>]*rel="prev"[^>]*href="(${introductionPath}/?)"`,
      ).test(installationHtml),
    ).toBe(true);
    expect(installationHtml).toContain(enMessages.docs.previousPagePrefix);
    expect(installationHtml).toContain("Introduction");

    const gettingStartedResponse = await fetchHttp(
      new URL(withBasePath("/docs/getting-started"), server.baseUrl),
      { signal: AbortSignal.timeout(10_000) },
    );
    const gettingStartedHtml = await gettingStartedResponse.text();
    const cliPath = withBasePath("/docs/cli").replace(/\//g, "\\/");

    expect(
      new RegExp(
        `<a[^>]*href="(${cliPath}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${cliPath}/?)"`,
      ).test(gettingStartedHtml),
    ).toBe(true);

    const cliResponse = await fetchHttp(
      new URL(withBasePath("/docs/cli"), server.baseUrl),
      {
        signal: AbortSignal.timeout(10_000),
      },
    );
    expect(cliResponse.status).toBe(200);

    const cliHtml = await cliResponse.text();
    const gettingStartedPath = withBasePath("/docs/getting-started").replace(
      /\//g,
      "\\/",
    );
    const configurationPath = withBasePath("/docs/configuration").replace(
      /\//g,
      "\\/",
    );

    expect(cliHtml).toContain("CLI overview");
    expect(
      new RegExp(
        `<a[^>]*href="(${gettingStartedPath}/?)"[^>]*rel="prev"|<a[^>]*rel="prev"[^>]*href="(${gettingStartedPath}/?)"`,
      ).test(cliHtml),
    ).toBe(true);
    expect(
      new RegExp(
        `<a[^>]*href="(${configurationPath}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${configurationPath}/?)"`,
      ).test(cliHtml),
    ).toBe(true);
    expect(cliHtml).toContain(enMessages.docs.previousPagePrefix);
    expect(cliHtml).toContain("Getting started");
    expect(cliHtml).toContain(enMessages.docs.nextPagePrefix);
    expect(cliHtml).toContain("Configuration");
  }, 30_000);

  test("serves the post-setup concept routes through canonical docs paths", async () => {
    const routeChecks = [
      {
        path: "/docs/cli",
        title: "CLI overview",
        body: "Typical commands and outcomes",
        previousLabel: "Getting started",
        previousHref: "/docs/getting-started",
        nextLabel: "Configuration",
        nextHref: "/docs/configuration",
      },
      {
        path: "/docs/configuration",
        title: "Configuration",
        body: "How configuration changes execution",
        previousLabel: "CLI overview",
        previousHref: "/docs/cli",
        nextLabel: "Workflow concepts",
        nextHref: "/docs/concepts",
      },
      {
        path: "/docs/concepts",
        title: "Workflow concepts",
        body: "How the CLI and configuration connect",
        previousLabel: "Configuration",
        previousHref: "/docs/configuration",
        nextLabel: "Human approval gates",
        nextHref: "/docs/human-approval-gates",
      },
      {
        path: "/docs/human-approval-gates",
        title: "Human approval gates",
        body: "What this guide is for",
        previousLabel: "Workflow concepts",
        previousHref: "/docs/concepts",
        nextLabel: "Coder / Reviewer pattern",
        nextHref: "/docs/coder-reviewer-pattern",
      },
    ] as const;

    for (const routeCheck of routeChecks) {
      const response = await fetchHttp(
        new URL(withBasePath(routeCheck.path), server.baseUrl),
        { signal: AbortSignal.timeout(10_000) },
      );

      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain(routeCheck.title);
      expect(html).toContain(routeCheck.body);
      expect(html).toContain(
        `aria-label="${enMessages.docs.progressionAriaLabel}"`,
      );
      expect(
        new RegExp(
          `<a[^>]*href="(${escapeHrefForHtmlMatch(withBasePath(routeCheck.previousHref))}/?)"[^>]*rel="prev"|<a[^>]*rel="prev"[^>]*href="(${escapeHrefForHtmlMatch(withBasePath(routeCheck.previousHref))}/?)"`,
        ).test(html),
      ).toBe(true);
      expect(
        new RegExp(
          `<a[^>]*href="(${escapeHrefForHtmlMatch(withBasePath(routeCheck.nextHref))}/?)"[^>]*rel="next"|<a[^>]*rel="next"[^>]*href="(${escapeHrefForHtmlMatch(withBasePath(routeCheck.nextHref))}/?)"`,
        ).test(html),
      ).toBe(true);
      expect(html).toContain(routeCheck.previousLabel);
      expect(html).toContain(routeCheck.nextLabel);
    }
  }, 30_000);
});
