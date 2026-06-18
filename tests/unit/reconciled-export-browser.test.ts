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

const publicKnowledgePages = [
  {
    path: "/glossary/agent",
    title: "Agent",
    excerpt:
      "An agent in You Agent Factory is a named worker inside a workflow.",
  },
  {
    path: "/comparisons/vs-n8n",
    title: "You Agent Factory vs n8n",
    excerpt:
      "You Agent Factory and n8n both help teams automate repeatable work",
  },
  {
    path: "/references/loop-engineering",
    title: "Loop engineering",
    excerpt:
      "Loop engineering is the practice of designing the feedback cycle around an agent workflow",
  },
] as const;
describe("reconciled baseline browser export", () => {
  let port: number;
  let server: StaticExportServer;
  let browser: Browser;

  beforeAll(async () => {
    port = await getTestPort(3786, "RECONCILED_EXPORT_BROWSER_TEST_PORT");
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

      expect(await nextConfigurationLink.isVisible()).toBe(true);
      await nextConfigurationLink.click();
      await page.waitForURL(
        new RegExp(
          `${withBasePath("/docs/configuration").replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      expect(
        await page
          .getByRole("navigation", {
            name: enMessages.docs.progressionAriaLabel,
          })
          .getByRole("link", {
            name: `${enMessages.docs.nextPagePrefix} FAQ`,
          })
          .isVisible(),
      ).toBe(true);
      await page
        .getByRole("navigation", {
          name: enMessages.docs.progressionAriaLabel,
        })
        .getByRole("link", {
          name: `${enMessages.docs.nextPagePrefix} FAQ`,
        })
        .click();
      await page.waitForURL(
        new RegExp(
          `${withBasePath("/docs/faq").replace(/\//g, "\\/")}/?$`,
        ),
        { timeout: 10_000 },
      );

      expect(
        await page
          .getByRole("navigation", {
            name: enMessages.docs.progressionAriaLabel,
          })
          .getByRole("link", {
            name: `${enMessages.docs.nextPagePrefix} Workflow concepts`,
          })
          .isVisible(),
      ).toBe(true);
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

  test("public knowledge routes render substantive starter content in the browser", async () => {
    const page = await browser.newPage();

    try {
      for (const knowledgePage of publicKnowledgePages) {
        await page.goto(
          new URL(withBasePath(knowledgePage.path), server.baseUrl).toString(),
          {
            waitUntil: "domcontentloaded",
          },
        );

        expect(
          await page
            .getByRole("heading", { level: 1, name: knowledgePage.title })
            .isVisible(),
        ).toBe(true);
        expect(await page.getByText(knowledgePage.excerpt).isVisible()).toBe(
          true,
        );
        expect(
          await page
            .getByRole("navigation", {
              name: enMessages.docs.breadcrumbAriaLabel,
            })
            .isVisible(),
        ).toBe(true);
      }
    } finally {
      await page.close();
    }
  }, 30_000);

  test("FAQ stays reachable through the generated guides navigation inside the docs shell", async () => {
    const page = await browser.newPage();
    const conceptsUrl = new URL(
      withBasePath("/docs/concepts"),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(conceptsUrl, { waitUntil: "domcontentloaded" });

      const faqLink = page.getByRole("link", { name: "FAQ" }).first();
      expect(await faqLink.isVisible()).toBe(true);

      await faqLink.click();
      await page.waitForURL(
        new RegExp(`${withBasePath("/docs/faq").replace(/\//g, "\\/")}/?$`),
        { timeout: 10_000 },
      );

      expect(
        await page.getByRole("heading", { level: 1, name: "FAQ" }).isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("navigation", {
            name: enMessages.docs.breadcrumbAriaLabel,
          })
          .getByText("Guides")
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("navigation", {
            name: enMessages.docs.progressionAriaLabel,
          })
          .getByRole("link", {
            name: `${enMessages.docs.previousPagePrefix} Configuration`,
          })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);
});
