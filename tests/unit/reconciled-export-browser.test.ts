import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type Browser, type Page, chromium } from "@playwright/test";
import {
  DOCS_ENTRY_ROUTE,
  PROJECT_NAME,
  PROJECT_TAGLINE,
} from "../../src/lib/project";
import {
  DOCS_CTA_LABEL,
  DOCS_SHELL_FRAMING_TEXT,
  DOCS_SHELL_TITLE,
  GITHUB_CTA_LABEL,
  GITHUB_REPO_URL,
  HOME_CTA_LABEL,
  LANDING_VALUE_STATEMENT,
  sharedShellConfig,
} from "../../src/lib/shell";
import { withBasePath } from "../../src/lib/site";
import { enMessages } from "../../src/localization/messages/en";
import {
  type StaticExportServer,
  ensureStaticExportBuilt,
  startStaticExportServer,
  waitForStaticExportServer,
} from "../helpers/static-export-server";
import { getTestPort } from "../helpers/test-port";

describe("reconciled baseline browser export", () => {
  const port = getTestPort(3786, "RECONCILED_EXPORT_BROWSER_TEST_PORT");
  let server: StaticExportServer;
  let browser: Browser;

  beforeAll(async () => {
    await ensureStaticExportBuilt();
    server = startStaticExportServer(port);
    await waitForStaticExportServer(server.baseUrl);
    browser = await chromium.launch();
  }, 120_000);

  afterAll(async () => {
    await browser?.close();
    server?.stop();
  }, 30_000);

  test("homepage shell renders project identity, value statement, and CTAs", async () => {
    const page = await browser.newPage();

    try {
      await page.goto(server.baseUrl, { waitUntil: "domcontentloaded" });

      expect(
        await page
          .getByRole("heading", { level: 1, name: PROJECT_TAGLINE })
          .isVisible(),
      ).toBe(true);
      expect(await page.getByText(LANDING_VALUE_STATEMENT).isVisible()).toBe(
        true,
      );

      const hero = page.getByRole("region", { name: PROJECT_TAGLINE });
      const heroDocsCta = hero.getByRole("link", { name: DOCS_CTA_LABEL });
      const heroGithubCta = hero.getByRole("link", { name: GITHUB_CTA_LABEL });

      expect(await heroDocsCta.isVisible()).toBe(true);
      expect(await heroGithubCta.isVisible()).toBe(true);
      expect(await heroDocsCta.getAttribute("href")).toMatch(
        new RegExp(`^${withBasePath(DOCS_ENTRY_ROUTE)}/?$`),
      );
      expect(await heroGithubCta.getAttribute("href")).toBe(GITHUB_REPO_URL);
      expect(await page.getByRole("banner").isVisible()).toBe(true);
      expect(await page.getByRole("main").isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("docs shell renders navigation, framing copy, and landmarks", async () => {
    const page = await browser.newPage();
    const docsUrl = new URL(
      withBasePath(DOCS_ENTRY_ROUTE),
      server.baseUrl,
    ).toString();
    const docsSidebar = page.locator("#nd-sidebar");

    try {
      await page.goto(docsUrl, { waitUntil: "domcontentloaded" });

      expect(
        await page
          .getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE })
          .isVisible(),
      ).toBe(true);
      expect(await page.getByText(DOCS_SHELL_FRAMING_TEXT).isVisible()).toBe(
        true,
      );
      expect(
        await docsSidebar.getByText("Guides", { exact: true }).isVisible(),
      ).toBe(true);
      expect(await page.getByRole("main").isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("configuration overview renders clearly inside the docs shell", async () => {
    const page = await browser.newPage();
    const configurationUrl = new URL(
      withBasePath("/docs/configuration"),
      server.baseUrl,
    ).toString();
    const docsSidebar = page.locator("#nd-sidebar");

    try {
      await page.goto(configurationUrl, { waitUntil: "domcontentloaded" });

      expect(
        await page
          .getByRole("heading", {
            level: 1,
            name: "Configuration",
          })
          .isVisible(),
      ).toBe(true);
      expect(
        await docsSidebar.getByText("Guides", { exact: true }).isVisible(),
      ).toBe(true);
      expect(
        await docsSidebar
          .getByRole("link", { name: "Configuration" })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByText(
            "Configuration is the contract between the CLI command you run and the workflow behavior the factory will execute.",
          )
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("heading", {
            level: 2,
            name: "How configuration changes execution",
          })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("workflow concepts render clearly inside the docs shell", async () => {
    const page = await browser.newPage();
    const workflowConceptsUrl = new URL(
      withBasePath("/docs/concepts"),
      server.baseUrl,
    ).toString();
    const docsSidebar = page.locator("#nd-sidebar");

    try {
      await page.goto(workflowConceptsUrl, { waitUntil: "domcontentloaded" });

      expect(
        await page
          .getByRole("heading", {
            level: 1,
            name: "Workflow concepts",
          })
          .isVisible(),
      ).toBe(true);
      expect(
        await docsSidebar.getByText("Guides", { exact: true }).isVisible(),
      ).toBe(true);
      expect(
        await docsSidebar
          .getByRole("link", { name: "Workflow concepts" })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByText(
            "Workflow concepts explain how the CLI, configuration, approvals, and outputs fit together once you move beyond the first setup path.",
          )
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("heading", {
            level: 2,
            name: "How the CLI and configuration connect",
          })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("human approval gates are reachable from the docs shell navigation", async () => {
    const page = await browser.newPage();
    const docsUrl = new URL(
      withBasePath(DOCS_ENTRY_ROUTE),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(docsUrl, { waitUntil: "domcontentloaded" });

      const docsSidebar = page.locator("#nd-sidebar");
      const humanApprovalGatesLink = docsSidebar.getByRole("link", {
        name: "Human approval gates",
      });

      await humanApprovalGatesLink.waitFor({ state: "visible" });
      expect(await humanApprovalGatesLink.isVisible()).toBe(true);
      await humanApprovalGatesLink.click();
      await page.waitForURL(
        new RegExp(
          `${withBasePath("/docs/human-approval-gates").replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      expect(
        await page
          .getByRole("heading", {
            level: 1,
            name: "Human approval gates",
          })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByText(
            "Use this page when you need the generated docs shell to point readers to one canonical guide about approval checkpoints in You Agent Factory workflows.",
          )
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("heading", {
            level: 2,
            name: "When a workflow should pause for review",
          })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByText(
            "An approval gate should interrupt execution at a meaningful risk boundary, not at every trivial handoff.",
          )
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("docs shell exposes the post-setup concepts path coherently", async () => {
    const page = await browser.newPage();
    const cliUrl = new URL(
      withBasePath("/docs/cli"),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(cliUrl, { waitUntil: "domcontentloaded" });

      const docsSidebar = page.locator("#nd-sidebar");
      expect(
        await docsSidebar.getByText("Guides", { exact: true }).isVisible(),
      ).toBe(true);
      expect(
        await docsSidebar
          .getByRole("link", { name: "CLI overview" })
          .isVisible(),
      ).toBe(true);
      expect(
        await docsSidebar
          .getByRole("link", { name: "Configuration" })
          .isVisible(),
      ).toBe(true);
      expect(
        await docsSidebar
          .getByRole("link", { name: "Workflow concepts" })
          .isVisible(),
      ).toBe(true);

      const progression = page.getByRole("navigation", {
        name: enMessages.docs.progressionAriaLabel,
      });
      const nextConfigurationLink = progression.getByRole("link", {
        name: `${enMessages.docs.nextPagePrefix} Configuration`,
      });

      await nextConfigurationLink.waitFor({ state: "visible" });
      expect(await nextConfigurationLink.isVisible()).toBe(true);
      await nextConfigurationLink.click();
      await page.waitForURL(
        new RegExp(
          `${withBasePath("/docs/configuration").replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      const nextWorkflowConceptsLink = page
        .getByRole("navigation", {
          name: enMessages.docs.progressionAriaLabel,
        })
        .getByRole("link", {
          name: `${enMessages.docs.nextPagePrefix} Workflow concepts`,
        });
      await nextWorkflowConceptsLink.waitFor({ state: "visible" });
      expect(await nextWorkflowConceptsLink.isVisible()).toBe(true);
      await nextWorkflowConceptsLink.click();
      await page.waitForURL(
        new RegExp(
          `${withBasePath("/docs/concepts").replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      const nextHumanApprovalGatesLink = page
        .getByRole("navigation", {
          name: enMessages.docs.progressionAriaLabel,
        })
        .getByRole("link", {
          name: `${enMessages.docs.nextPagePrefix} Human approval gates`,
        });
      await nextHumanApprovalGatesLink.waitFor({ state: "visible" });
      expect(await nextHumanApprovalGatesLink.isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("homepage docs CTA navigates to the docs shell entry route", async () => {
    const page = await browser.newPage();

    try {
      await page.goto(server.baseUrl, { waitUntil: "domcontentloaded" });
      await page
        .getByRole("region", { name: PROJECT_TAGLINE })
        .getByRole("link", { name: DOCS_CTA_LABEL })
        .click();

      await page.waitForURL(
        new RegExp(
          `${withBasePath(DOCS_ENTRY_ROUTE).replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      expect(
        await page
          .getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("docs home navigation returns to the homepage with base-path-aware links", async () => {
    const page = await browser.newPage();
    const docsUrl = new URL(
      withBasePath(DOCS_ENTRY_ROUTE),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(docsUrl, { waitUntil: "domcontentloaded" });
      await page.getByRole("link", { name: PROJECT_NAME }).click();

      await page.waitForURL(
        new RegExp(
          `${server.baseUrl.replace(/\/$/, "").replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      expect(
        await page
          .getByRole("heading", { level: 1, name: PROJECT_TAGLINE })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("homepage and docs shell remain navigable at a mobile viewport", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });

    try {
      await page.goto(server.baseUrl, { waitUntil: "domcontentloaded" });
      expect(
        await page
          .getByRole("heading", { level: 1, name: PROJECT_TAGLINE })
          .isVisible(),
      ).toBe(true);

      await page
        .getByRole("region", { name: PROJECT_TAGLINE })
        .getByRole("link", { name: DOCS_CTA_LABEL })
        .click();
      await page.waitForURL(
        new RegExp(
          `${withBasePath(DOCS_ENTRY_ROUTE).replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      expect(
        await page
          .getByRole("heading", { level: 1, name: DOCS_SHELL_TITLE })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("docs navigation depth remains usable at a mobile viewport", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const gettingStartedUrl = new URL(
      withBasePath("/docs/getting-started"),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(gettingStartedUrl, { waitUntil: "domcontentloaded" });

      const breadcrumbs = page.getByRole("navigation", {
        name: enMessages.docs.breadcrumbAriaLabel,
      });
      const progression = page.getByRole("navigation", {
        name: enMessages.docs.progressionAriaLabel,
      });
      const docsAsidePanel = page.locator("#nd-sidebar");

      expect(await breadcrumbs.isVisible()).toBe(true);
      expect(await breadcrumbs.getByText("Guides").isVisible()).toBe(true);
      expect(
        await progression
          .getByRole("link", {
            name: `${enMessages.docs.nextPagePrefix} CLI overview`,
          })
          .isVisible(),
      ).toBe(true);

      const docsNavToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });

      await docsNavToggle.click();

      expect(await docsNavToggle.getAttribute("data-open")).toBe("true");
      expect(
        await page
          .getByRole("link", { name: "CLI overview" })
          .last()
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("link", { name: "CLI overview" })
          .last()
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);
});
