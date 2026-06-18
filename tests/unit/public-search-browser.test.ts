import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { type Browser, type Page, chromium } from "@playwright/test";
import { withBasePath } from "../../src/lib/site";
import {
  type StaticExportServer,
  ensureStaticExportBuilt,
  startStaticExportServer,
  waitForStaticExportServer,
} from "../helpers/static-export-server";
import { getTestPort } from "../helpers/test-port";

const keyboardArtifact = {
  version: 1,
  entries: [
    {
      id: "glossary/agent@en",
      canonicalId: "glossary/agent",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "glossary",
      url: "/glossary/agent",
      title: "Agent",
      description: "Definition of an AI agent in the factory documentation.",
      headings: ["What is an agent?"],
      body: "An agent is a model-guided worker that can act on tools and files.",
      tags: ["agent", "glossary"],
      section: "glossary",
      searchPriority: 9,
    },
    {
      id: "reference/agent-runner@en",
      canonicalId: "reference/agent-runner",
      locale: "en",
      canonicalLocale: "en",
      availableLocales: ["en"],
      kind: "reference",
      url: "/reference/agent-runner",
      title: "Agent runner reference",
      description: "Reference details for agent execution and result handling.",
      headings: ["Agent execution"],
      body: "Agent runner behavior and agent execution details for keyboard verification.",
      tags: ["agent", "reference"],
      section: "reference",
      searchPriority: 8,
    },
  ],
} as const;

describe("public search browser flow", () => {
  const port = getTestPort(3787, "PUBLIC_SEARCH_BROWSER_TEST_PORT");
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

  async function openDocsPage(): Promise<Page> {
    const page = await browser.newPage();
    await page.goto(new URL(withBasePath("/docs"), server.baseUrl).toString(), {
      waitUntil: "domcontentloaded",
    });
    return page;
  }

  async function focusSearchboxWithKeyboard(page: Page): Promise<void> {
    const searchbox = page.getByRole("searchbox", { name: "Search query" });

    for (let attempt = 0; attempt < 12; attempt += 1) {
      await page.keyboard.press("Tab");

      if (
        await searchbox.evaluate(
          (element) => element === document.activeElement,
        )
      ) {
        return;
      }
    }

    throw new Error(
      "Search input did not receive focus through keyboard navigation.",
    );
  }

  test("shows loading and success states for an artifact-backed query", async () => {
    const page = await openDocsPage();

    try {
      await page.route("**/search/public-search-index.json", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const response = await route.fetch();
        await route.fulfill({ response });
      });

      await page.getByRole("searchbox", { name: "Search query" }).fill("agent");
      await page.getByRole("button", { name: "Search" }).click();

      await page
        .getByRole("heading", { name: "Loading search results" })
        .waitFor({ state: "visible", timeout: 5_000 });
      await page
        .getByRole("heading", { name: "Results" })
        .waitFor({ state: "visible", timeout: 5_000 });
      await page
        .locator(".public-search__result-item")
        .first()
        .waitFor({ state: "visible", timeout: 5_000 });

      expect(
        await page.getByRole("heading", { name: "Results" }).isVisible(),
      ).toBe(true);
      expect(
        await page.locator(".public-search__result-item").first().isVisible(),
      ).toBe(true);
      expect(await page.getByText("Glossary").first().isVisible()).toBe(true);
    } finally {
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await page.close();
    }
  }, 30_000);

  test("shows visible kind and match context for glossary-style discovery", async () => {
    const page = await openDocsPage();

    try {
      await page
        .getByRole("searchbox", { name: "Search query" })
        .fill("glossary");
      await page.getByRole("button", { name: "Search" }).click();

      await page
        .getByRole("link", { name: /Agent \/glossary\/agent/ })
        .waitFor({ state: "visible", timeout: 5_000 });
      expect(await page.getByText("Glossary").first().isVisible()).toBe(true);
      expect(await page.getByText("Tag match").first().isVisible()).toBe(true);
      expect(await page.getByText("glossary").first().isVisible()).toBe(true);
    } finally {
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await page.close();
    }
  }, 30_000);

  test("shows an empty state when the artifact query has no matches", async () => {
    const page = await openDocsPage();

    try {
      await page
        .getByRole("searchbox", { name: "Search query" })
        .fill("query-with-no-matches");
      await page.getByRole("button", { name: "Search" }).click();

      await page
        .getByRole("heading", { name: "No matching results" })
        .waitFor({ state: "visible", timeout: 5_000 });
      expect(
        await page
          .getByRole("heading", { name: "No matching results" })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await page.close();
    }
  }, 30_000);

  test("shows an error state when the artifact request fails", async () => {
    const page = await openDocsPage();

    try {
      await page.route("**/search/public-search-index.json", async (route) => {
        await route.abort();
      });

      await page.getByRole("searchbox", { name: "Search query" }).fill("agent");
      await page.getByRole("button", { name: "Search" }).click();

      await page
        .getByRole("heading", { name: "Search unavailable" })
        .waitFor({ state: "visible", timeout: 5_000 });
      expect(
        await page
          .getByRole("heading", { name: "Search unavailable" })
          .isVisible(),
      ).toBe(true);
    } finally {
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await page.close();
    }
  }, 30_000);

  test("supports a keyboard-only path from query entry through result activation", async () => {
    const page = await openDocsPage();

    try {
      await page.route("**/search/public-search-index.json", async (route) => {
        await route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(keyboardArtifact),
        });
      });

      await focusSearchboxWithKeyboard(page);
      await page.keyboard.type("agent");
      await page.keyboard.press("Enter");

      await page
        .getByRole("heading", { name: "Results" })
        .waitFor({ state: "visible", timeout: 5_000 });

      await page.keyboard.press("ArrowDown");

      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("href") === "/glossary/agent",
      );

      const firstResult = page.getByRole("link", {
        name: /Agent \/glossary\/agent/,
      });
      const secondResult = page.getByRole("link", {
        name: /Agent runner reference \/reference\/agent-runner/,
      });

      expect(
        await firstResult.evaluate(
          (element) => element === document.activeElement,
        ),
      ).toBe(true);

      await page.keyboard.press("ArrowDown");

      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute("href") ===
          "/reference/agent-runner",
      );

      expect(
        await secondResult.evaluate(
          (element) => element === document.activeElement,
        ),
      ).toBe(true);

      await Promise.all([
        page.waitForURL("**/reference/agent-runner", { timeout: 5_000 }),
        page.keyboard.press("Enter"),
      ]);
    } finally {
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await page.close();
    }
  }, 30_000);
});
