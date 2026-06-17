import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type Browser, chromium } from "@playwright/test";
import {
  FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM,
  FACTORY_WORKFLOW_MERMAID_DIAGRAM,
} from "../../src/content/docs-diagrams";
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
  LANDING_VALUE_STATEMENT,
} from "../../src/lib/shell";
import { withBasePath } from "../../src/lib/site";
import { enMessages } from "../../src/localization/messages/en";
import {
  getPublicContentVerificationFixture,
  listPublicContentVerificationFixtures,
  listRepresentativeMissingPublicRoutePaths,
} from "../helpers/public-content-verification";
import {
  type StaticExportServer,
  ensureStaticExportBuilt,
  startStaticExportServer,
  waitForStaticExportServer,
} from "../helpers/static-export-server";
import { getTestPort } from "../helpers/test-port";

const GRAPH_FRAME_TOLERANCE_PX = 24;

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
        await page
          .getByRole("heading", {
            level: 2,
            name: enMessages.docs.examplesHeading,
          })
          .isVisible(),
      ).toBe(true);
      expect(await page.getByText("Guides", { exact: true }).isVisible()).toBe(
        true,
      );
      expect(await page.getByRole("complementary").isVisible()).toBe(true);
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

  test("canonical public starter pages load on their expected route prefixes", async () => {
    const page = await browser.newPage();
    const publicRoutes = listPublicContentVerificationFixtures();

    try {
      for (const route of publicRoutes) {
        const url = new URL(
          withBasePath(route.routePath),
          server.baseUrl,
        ).toString();
        await page.goto(url, { waitUntil: "domcontentloaded" });

        expect(
          await page
            .getByRole("heading", { level: 1, name: route.heading })
            .isVisible(),
        ).toBe(true);
        expect(await page.getByText(route.body).isVisible()).toBe(true);
        expect(await page.getByRole("banner").isVisible()).toBe(true);
        expect(await page.getByRole("main").isVisible()).toBe(true);
      }
    } finally {
      await page.close();
    }
  }, 30_000);

  test("public article pages remain readable at a mobile viewport", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const comparisonRoute = getPublicContentVerificationFixture("comparison");
    const comparisonUrl = new URL(
      withBasePath(comparisonRoute.routePath),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(comparisonUrl, { waitUntil: "domcontentloaded" });

      expect(
        await page
          .getByRole("heading", {
            level: 1,
            name: comparisonRoute.heading,
          })
          .isVisible(),
      ).toBe(true);
      expect(await page.getByText(comparisonRoute.body).isVisible()).toBe(true);
      expect(await page.getByRole("main").isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("public article pages preserve route-specific title and canonical metadata when served from static export", async () => {
    const page = await browser.newPage();
    const blogRoute = getPublicContentVerificationFixture("blog");
    const blogUrl = new URL(
      withBasePath(blogRoute.routePath),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(blogUrl, { waitUntil: "domcontentloaded" });

      expect(await page.title()).toBe(
        `Introducing You Agent Factory | ${PROJECT_NAME}`,
      );

      const canonicalHref = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonicalHref).toBe(withBasePath(blogRoute.routePath));
    } finally {
      await page.close();
    }
  }, 30_000);

  test("unknown public slugs render the intentional not-found page", async () => {
    const page = await browser.newPage();
    const [unknownReferencePath] =
      listRepresentativeMissingPublicRoutePaths().filter((path) =>
        path.startsWith("/references/"),
      );
    const unknownReferenceUrl = new URL(
      withBasePath(unknownReferencePath),
      server.baseUrl,
    ).toString();

    try {
      const response = await page.goto(unknownReferenceUrl, {
        waitUntil: "domcontentloaded",
      });

      expect(response?.status()).toBe(404);
      expect(
        await page
          .getByRole("heading", { level: 1, name: "Page not found" })
          .isVisible(),
      ).toBe(true);
      expect(
        await page
          .getByRole("navigation", { name: "Recovery navigation" })
          .isVisible(),
      ).toBe(true);
      expect(
        await page.getByText("Loop engineering", { exact: true }).isVisible(),
      ).toBe(false);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("docs diagram examples stay visible after desktop-to-mobile resize", async () => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const docsUrl = new URL(
      withBasePath(DOCS_ENTRY_ROUTE),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(docsUrl, { waitUntil: "domcontentloaded" });

      const mermaidFigure = page.getByRole("figure", {
        name: FACTORY_WORKFLOW_MERMAID_DIAGRAM.title,
      });
      const reactFlowFigure = page.getByRole("figure", {
        name: FACTORY_AGENT_GRAPH_REACT_FLOW_DIAGRAM.title,
      });

      await mermaidFigure.locator(".docs-diagram__graphic svg").waitFor({
        timeout: 10_000,
      });

      expect(
        await mermaidFigure.getByText("Mermaid source of truth").isVisible(),
      ).toBe(true);
      expect(
        await reactFlowFigure
          .getByText("React Flow source of truth")
          .isVisible(),
      ).toBe(true);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);

      const graphFrame = reactFlowFigure.locator(
        ".docs-diagram__graphic--react-flow",
      );
      const frameBox = await graphFrame.boundingBox();

      expect(frameBox).toBeTruthy();

      for (const nodeTitle of [
        "Authored content",
        "Factory executor",
        "Verification lane",
        "Docs surface",
      ]) {
        const node = graphFrame.getByText(nodeTitle, { exact: true });
        const nodeBox = await node.boundingBox();

        expect(await node.isVisible()).toBe(true);
        expect(nodeBox).toBeTruthy();

        if (!frameBox || !nodeBox) {
          continue;
        }

        expect(nodeBox.x).toBeGreaterThanOrEqual(
          frameBox.x - GRAPH_FRAME_TOLERANCE_PX,
        );
        expect(nodeBox.x + nodeBox.width).toBeLessThanOrEqual(
          frameBox.x + frameBox.width + GRAPH_FRAME_TOLERANCE_PX,
        );
        expect(nodeBox.y).toBeGreaterThanOrEqual(
          frameBox.y - GRAPH_FRAME_TOLERANCE_PX,
        );
        expect(nodeBox.y + nodeBox.height).toBeLessThanOrEqual(
          frameBox.y + frameBox.height + GRAPH_FRAME_TOLERANCE_PX,
        );
      }
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

      expect(await breadcrumbs.isVisible()).toBe(true);
      expect(await breadcrumbs.getByText("Guides").isVisible()).toBe(true);
      expect(await progression.isVisible()).toBe(true);
      expect(await progression.getByRole("link").count()).toBeGreaterThan(0);

      const docsNavToggle = page.getByRole("button", {
        name: "Toggle Sidebar",
      });
      await docsNavToggle.waitFor({ state: "visible", timeout: 10_000 });

      await docsNavToggle.click();

      const gettingStartedLink = page.getByRole("link", {
        name: "Getting started",
      });
      await gettingStartedLink.waitFor({ state: "visible", timeout: 10_000 });
      expect(await gettingStartedLink.isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  test("doc pages preserve title and canonical metadata when served from static export", async () => {
    const page = await browser.newPage();
    const gettingStartedUrl = new URL(
      withBasePath("/docs/getting-started"),
      server.baseUrl,
    ).toString();

    try {
      await page.goto(gettingStartedUrl, { waitUntil: "domcontentloaded" });

      expect(await page.title()).toBe(`Getting started | ${PROJECT_NAME}`);

      const canonicalHref = await page
        .locator('link[rel="canonical"]')
        .getAttribute("href");
      expect(canonicalHref).toBe(withBasePath("/docs/getting-started"));
    } finally {
      await page.close();
    }
  }, 30_000);
});
