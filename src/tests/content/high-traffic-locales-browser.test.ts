/**
 * Browser verification for the filled high-traffic install/run journey.
 *
 * Opt-in: requires VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh
 * production build. Walks the shared production landing → install →
 * run-your-first-factory → CLI for ja, zh-CN, and vi; asserts target-language
 * docs prose, copyable install/run commands, and language switching.
 *
 * Install owns the OS commands and the provider step; the run guide owns the
 * packaged-factory run. The retired `guides/getting-started` page used to own
 * both.
 */
import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import type { Page } from "playwright";
import { fixtureLandingPageData } from "@/features/landing-page/landing-page.data";
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
const INIT_PROVIDER_COMMAND = "you init --provider codex";
const INIT_PACKAGE_COMMAND = "you init --package @you/goal";
const RUN_COMMAND = 'you run --named @you/goal "Summarise this repository"';

const ENGLISH_INSTALL_TITLE = "Install you-agent-factory";
const ENGLISH_RUN_TITLE = "Run Your First Factory";

const RUN_GUIDE_ROUTE = "/docs/guides/run-your-first-factory";

describe("high-traffic locales browser journey", () => {
  test("served install/run journey shows localized prose, commands, and language switching for ja / zh-CN / vi", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const enRunGuide = await loadPageMessages(
      getDocsPageDir("guides", "run-your-first-factory"),
      "en",
      { route: RUN_GUIDE_ROUTE },
    );
    expect(enRunGuide.title).toBe(ENGLISH_RUN_TITLE);

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
        const install = await loadPageMessages(
          getDocsPageDir("documentation", "install"),
          locale,
          { route: `/${locale}/docs/documentation/install` },
        );
        const runGuide = await loadPageMessages(
          getDocsPageDir("guides", "run-your-first-factory"),
          locale,
          { route: `/${locale}${RUN_GUIDE_ROUTE}` },
        );
        const cli = await loadPageMessages(
          getDocsPageDir("documentation", "cli"),
          locale,
          { route: `/${locale}/docs/documentation/cli` },
        );

        expect(install.title).not.toBe(ENGLISH_INSTALL_TITLE);
        expect(runGuide.title).not.toBe(ENGLISH_RUN_TITLE);

        await page.goto(`${session.baseUrl}/${locale}`, {
          waitUntil: "domcontentloaded",
        });

        await page
          .getByRole("heading", {
            level: 1,
            name: fixtureLandingPageData.hero.title.replace("\n", " "),
            exact: true,
          })
          .waitFor({ state: "visible" });

        // Install owns the OS entrypoints and the provider step.
        await page.goto(
          `${session.baseUrl}/${locale}/docs/documentation/install`,
          { waitUntil: "domcontentloaded" },
        );
        await page
          .getByRole("heading", { level: 1, name: install.title })
          .waitFor({ state: "visible" });
        await expectArticleContains(page, install.description);
        await expectArticleContains(page, INSTALL_COMMAND);
        await expectArticleContains(page, INSTALL_PS1_COMMAND);
        await expectArticleContains(page, INIT_PROVIDER_COMMAND);
        await expectArticleContains(page, INIT_PACKAGE_COMMAND);
        expect(await articleContent(page)).not.toContain(ENGLISH_INSTALL_TITLE);

        // The run guide owns the packaged-factory run, not the install script.
        await page.goto(`${session.baseUrl}/${locale}${RUN_GUIDE_ROUTE}`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .getByRole("heading", { level: 1, name: runGuide.title })
          .waitFor({ state: "visible" });
        // openingSummary is metadata-only; the localized description is the
        // visible lead on the rendered guide.
        await expectArticleContains(page, runGuide.description);
        await expectArticleContains(page, RUN_COMMAND);
        const runArticle = await articleContent(page);
        expect(runArticle).not.toContain(INSTALL_COMMAND);
        expect(runArticle).not.toContain(INSTALL_PS1_COMMAND);
        expect(runArticle).not.toContain(ENGLISH_RUN_TITLE);

        await page.goto(`${session.baseUrl}/${locale}/docs/documentation/cli`, {
          waitUntil: "domcontentloaded",
        });
        await page
          .getByRole("heading", { level: 1, name: cli.title })
          .waitFor({ state: "visible" });
        await expectArticleContains(page, cli.description);
        await expectArticleContains(page, "you mcp serve");
      }

      // Language switching among filled surfaces must keep localized body
      // copy (not English titles) for the destination locale.
      const zhRunGuide = await loadPageMessages(
        getDocsPageDir("guides", "run-your-first-factory"),
        "zh-CN",
        { route: `/zh-CN${RUN_GUIDE_ROUTE}` },
      );
      const viRunGuide = await loadPageMessages(
        getDocsPageDir("guides", "run-your-first-factory"),
        "vi",
        { route: `/vi${RUN_GUIDE_ROUTE}` },
      );
      const jaRunGuide = await loadPageMessages(
        getDocsPageDir("guides", "run-your-first-factory"),
        "ja",
        { route: `/ja${RUN_GUIDE_ROUTE}` },
      );

      await page.goto(`${session.baseUrl}/ja${RUN_GUIDE_ROUTE}`, {
        waitUntil: "domcontentloaded",
      });
      await page
        .getByRole("heading", { level: 1, name: jaRunGuide.title })
        .waitFor({ state: "visible" });

      const languageOpenJa = (await loadUiMessages("ja")).language.open;
      await page.getByRole("button", { name: languageOpenJa }).click();
      await page.getByRole("menuitem", { name: /简体中文/ }).click();
      await page.waitForURL(
        /\/zh-CN\/docs\/guides\/run-your-first-factory\/?$/,
      );
      await page
        .getByRole("heading", { level: 1, name: zhRunGuide.title })
        .waitFor({ state: "visible" });
      expect(await articleContent(page)).not.toContain(ENGLISH_RUN_TITLE);

      const languageOpenZh = (await loadUiMessages("zh-CN")).language.open;
      await page.getByRole("button", { name: languageOpenZh }).click();
      await page.getByRole("menuitem", { name: /^Tiếng Việt$/i }).click();
      await page.waitForURL(/\/vi\/docs\/guides\/run-your-first-factory\/?$/);
      await page
        .getByRole("heading", { level: 1, name: viRunGuide.title })
        .waitFor({ state: "visible" });
      expect(await articleContent(page)).not.toContain(ENGLISH_RUN_TITLE);

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
