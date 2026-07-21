/**
 * Browser verification for the filled high-traffic install/run journey
 * (fill-high-traffic-locales-008).
 *
 * Opt-in: requires VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh
 * production build. Walks home → getting-started → install/CLI for ja,
 * zh-CN, and vi; asserts target-language prose, copyable install/run
 * commands, and language switching among filled surfaces.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import type { Page } from "playwright";
import { getDocsPageDir } from "@/lib/content/content-paths";
import { loadPageMessages } from "@/lib/content/page-messages-load";
import type { NonDefaultLocale } from "@/lib/content/shipped-localized-docs";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";
import {
  acquireVerifyServerSession,
  shouldRunVerifyProductionIntegrationTests,
} from "@/lib/verify/server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

const NON_DEFAULT_LOCALES = [
  "ja",
  "zh-CN",
  "vi",
] as const satisfies readonly NonDefaultLocale[];

const INSTALL_COMMAND =
  "curl -fsSL https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh | sh";
const INSTALL_PS1_COMMAND =
  "irm https://github.com/portpowered/you-agent-factory/releases/latest/download/install.ps1 | iex";
const CLAUDE_INIT_COMMAND = "you init --executor claude";
const RUN_COMMAND = "you run --named @goal/blah";

const ENGLISH_HOME_SUBTITLE = "Docs for the agent factory CLI";
const ENGLISH_GETTING_STARTED_TITLE = "Getting Started";

describe("high-traffic locales browser journey", () => {
  test("served install/run journey shows localized prose, commands, and language switching for ja / zh-CN / vi", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const enHome = await loadUiMessages("en");
    const enGettingStarted = await loadPageMessages(
      getDocsPageDir("guides", "getting-started"),
      "en",
      { route: "/docs/guides/getting-started" },
    );
    expect(enHome.home.subtitle).toBe(ENGLISH_HOME_SUBTITLE);
    expect(enGettingStarted.title).toBe(ENGLISH_GETTING_STARTED_TITLE);

    const session = await acquireVerifyServerSession({
      projectRoot: repoRoot,
    });
    const browser = await launchPlaywrightBrowser();

    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      });
      page.setDefaultTimeout(60_000);

      for (const locale of NON_DEFAULT_LOCALES) {
        const home = (await loadUiMessages(locale)).home;
        const gettingStarted = await loadPageMessages(
          getDocsPageDir("guides", "getting-started"),
          locale,
          { route: `/${locale}/docs/guides/getting-started` },
        );
        const install = await loadPageMessages(
          getDocsPageDir("documentation", "install"),
          locale,
          { route: `/${locale}/docs/documentation/install` },
        );
        const cli = await loadPageMessages(
          getDocsPageDir("documentation", "cli"),
          locale,
          { route: `/${locale}/docs/documentation/cli` },
        );

        expect(home.subtitle).not.toBe(ENGLISH_HOME_SUBTITLE);
        expect(gettingStarted.title).not.toBe(ENGLISH_GETTING_STARTED_TITLE);

        await page.goto(`${session.baseUrl}/${locale}`, {
          waitUntil: "domcontentloaded",
        });

        await page
          .getByRole("heading", { level: 1, name: home.title, exact: true })
          .waitFor({ state: "visible" });
        // home.intro is metadata-only; assert visible body prose instead.
        // Scope to article so docs sidebar chrome (English tree titles) does
        // not false-fail "no English stub body" checks.
        await expectArticleContains(page, home.subtitle);
        await page
          .getByRole("heading", {
            level: 2,
            name: home.installSectionTitle,
            exact: true,
          })
          .waitFor({ state: "visible" });
        await page
          .getByRole("heading", {
            level: 2,
            name: home.runSectionTitle,
            exact: true,
          })
          .waitFor({ state: "visible" });
        await page
          .getByRole("heading", {
            level: 2,
            name: home.whySectionTitle,
            exact: true,
          })
          .waitFor({ state: "visible" });
        await expectArticleContains(page, home.whyBody);
        await expectArticleContains(page, INSTALL_COMMAND);
        await expectArticleContains(page, RUN_COMMAND);
        expect(await articleContent(page)).not.toContain(ENGLISH_HOME_SUBTITLE);

        await page.goto(
          `${session.baseUrl}/${locale}/docs/guides/getting-started`,
          { waitUntil: "domcontentloaded" },
        );
        await page
          .getByRole("heading", { level: 1, name: gettingStarted.title })
          .waitFor({ state: "visible" });
        if (gettingStarted.openingSummary) {
          await expectArticleContains(page, gettingStarted.openingSummary);
        }
        // PS-200: Getting Started owns the full install teaching path.
        await expectArticleContains(page, INSTALL_COMMAND);
        await expectArticleContains(page, INSTALL_PS1_COMMAND);
        await expectArticleContains(page, CLAUDE_INIT_COMMAND);
        await expectArticleContains(page, RUN_COMMAND);
        expect(await articleContent(page)).not.toContain(
          ENGLISH_GETTING_STARTED_TITLE,
        );

        await page.goto(
          `${session.baseUrl}/${locale}/docs/documentation/install`,
          { waitUntil: "domcontentloaded" },
        );
        await page
          .getByRole("heading", { level: 1, name: install.title })
          .waitFor({ state: "visible" });
        // PS-200: install is a thin stub pointing at Getting Started (commands live there).
        const installPathBody = String(
          install.sections?.installPath?.body ?? "",
        );
        const gettingStartedLabel = String(install.links?.gettingStarted ?? "");
        expect(installPathBody.length).toBeGreaterThan(0);
        expect(gettingStartedLabel.length).toBeGreaterThan(0);
        await expectArticleContains(page, installPathBody);
        const gettingStartedHref = await page
          .getByRole("link", { name: gettingStartedLabel })
          .getAttribute("href");
        expect(gettingStartedHref).toMatch(/\/docs\/guides\/getting-started$/);
        const installArticle = await articleContent(page);
        expect(installArticle).not.toContain(INSTALL_COMMAND);
        expect(installArticle).not.toContain(INSTALL_PS1_COMMAND);
        expect(installArticle).not.toContain(CLAUDE_INIT_COMMAND);

        await page.goto(`${session.baseUrl}/${locale}/docs/documentation/cli`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .getByRole("heading", { level: 1, name: cli.title })
          .waitFor({ state: "visible" });
        await expectArticleContains(page, cli.description);
        await expectArticleContains(page, INSTALL_COMMAND);
      }

      // Language switching among filled surfaces must keep localized body
      // copy (not English stub titles) for the destination locale.
      const zhGettingStarted = await loadPageMessages(
        getDocsPageDir("guides", "getting-started"),
        "zh-CN",
        { route: "/zh-CN/docs/guides/getting-started" },
      );
      const viGettingStarted = await loadPageMessages(
        getDocsPageDir("guides", "getting-started"),
        "vi",
        { route: "/vi/docs/guides/getting-started" },
      );

      await page.goto(`${session.baseUrl}/ja/docs/guides/getting-started`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .getByRole("heading", { level: 1, name: "はじめに" })
        .waitFor({ state: "visible" });

      const languageOpenJa = (await loadUiMessages("ja")).language.open;
      await page.getByRole("button", { name: languageOpenJa }).click();
      await page.getByRole("menuitem", { name: /简体中文/ }).click();
      await page.waitForURL("**/zh-CN/docs/guides/getting-started");
      await page
        .getByRole("heading", {
          level: 1,
          name: zhGettingStarted.title,
        })
        .waitFor({ state: "visible" });
      expect(await articleContent(page)).not.toContain(
        ENGLISH_GETTING_STARTED_TITLE,
      );

      const languageOpenZh = (await loadUiMessages("zh-CN")).language.open;
      await page.getByRole("button", { name: languageOpenZh }).click();
      await page.getByRole("menuitem", { name: /^Tiếng Việt$/i }).click();
      await page.waitForURL("**/vi/docs/guides/getting-started");
      await page
        .getByRole("heading", {
          level: 1,
          name: viGettingStarted.title,
        })
        .waitFor({ state: "visible" });
      expect(await articleContent(page)).not.toContain(
        ENGLISH_GETTING_STARTED_TITLE,
      );

      await page.close();
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
      await session.cleanup();
    }
  }, 300_000);
});

async function articleContent(page: Page): Promise<string> {
  const article = page.locator("article").first();
  if ((await article.count()) > 0) {
    return article.innerText();
  }
  return page.locator("main").innerText();
}

async function expectArticleContains(page: Page, text: string): Promise<void> {
  if (!text.trim()) {
    return;
  }
  expect(await articleContent(page)).toContain(text);
}
