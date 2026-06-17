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
        await page.getByRole("navigation", { name: "Guides" }).isVisible(),
      ).toBe(true);
      expect(await page.getByRole("banner").isVisible()).toBe(true);
      expect(await page.getByRole("main").isVisible()).toBe(true);
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
      await page.getByRole("link", { name: HOME_CTA_LABEL }).click();

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
    const introductionUrl = new URL(
      withBasePath("/docs/introduction"),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(introductionUrl, { waitUntil: "domcontentloaded" });
      await page
        .locator('.shared-shell[data-shell-viewport="mobile"]')
        .waitFor({ timeout: 10_000 });

      const breadcrumbs = page.getByRole("navigation", {
        name: enMessages.docs.breadcrumbAriaLabel,
      });
      const progression = page.getByRole("navigation", {
        name: enMessages.docs.progressionAriaLabel,
      });
      const docsAsidePanel = page.locator("#shared-shell-docs-aside");
      const setupAsideNav = docsAsidePanel.getByRole("navigation", {
        name: "Setup",
      });

      expect(await breadcrumbs.isVisible()).toBe(true);
      expect(await breadcrumbs.getByText("Setup").isVisible()).toBe(true);
      expect(
        await page
          .getByRole("heading", {
            level: 2,
            name: "Who this setup path is for",
          })
          .isVisible(),
      ).toBe(true);
      expect(
        await progression
          .getByRole("link", {
            name: `${enMessages.docs.nextPagePrefix} Installation`,
          })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("link", { name: "Installation" })
          .first()
          .isVisible(),
      ).toBe(true);

      const docsNavToggle = page.getByRole("button", {
        name: sharedShellConfig.responsive.docsNavigationDisclosure.openLabel,
      });
      expect(await docsNavToggle.getAttribute("aria-expanded")).toBe("false");
      expect(await docsAsidePanel.getAttribute("hidden")).not.toBeNull();
      expect(await setupAsideNav.isVisible()).toBe(false);

      await docsNavToggle.click();

      expect(await setupAsideNav.isVisible()).toBe(true);
      expect(
        await docsAsidePanel
          .getByRole("navigation", { name: "Guides" })
          .isVisible(),
      ).toBe(true);
      expect(
        await setupAsideNav
          .getByRole("link", { name: "Quickstart" })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("installation page presents the supported prerequisite, setup, and validation path", async () => {
    const page = await browser.newPage();
    const installationUrl = new URL(
      withBasePath("/docs/installation"),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(installationUrl, { waitUntil: "domcontentloaded" });

      expect(
        await page
          .getByRole("heading", { level: 1, name: "Installation" })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("heading", { level: 2, name: "Prerequisites" })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByText(
            "Start with Bun 1.1 or newer available on your machine because the repository uses Bun for dependency installation, scripts, and test execution.",
          )
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByText(
            "Run `make setup` from the repository root to install or refresh dependencies.",
          )
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByText(
            "Run `make quality-gate` after setup to verify that the local install is usable.",
          )
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("navigation", {
            name: enMessages.docs.pageOutlineAriaLabel,
          })
          .getByRole("link", { name: "Validate the install" })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("navigation", {
            name: enMessages.docs.progressionAriaLabel,
          })
          .getByRole("link", {
            name: `${enMessages.docs.nextPagePrefix} Quickstart`,
          })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);
});
