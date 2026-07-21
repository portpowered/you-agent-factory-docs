/**
 * Always-on behavioral gate for docs sidebar row hover / rest / focus.
 *
 * Story repair-sidebar-active-muted-secondary-002: after the active wash moved
 * to muted secondary blue, hover must stay primary yellow + dark text on both
 * resting and active rows (desktop `#nd-sidebar` and mobile drawer). Happy-dom
 * cannot prove CSS :hover; Playwright loads `docs-chrome-sidebar.css` directly
 * — no Next production build or `bun run dev` required.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_CHROME_SIDEBAR_FACTORY_DARK,
  DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS,
  DOCS_CHROME_SIDEBAR_TOKENS,
} from "@/features/docs/styles/docs-chrome-sidebar";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";

const SIDEBAR_CHROME_CSS = readFileSync(
  join(process.cwd(), "src/features/docs/styles/docs-chrome-sidebar.css"),
  "utf8",
);

const PRIMARY_YELLOW_RGB = "rgb(245, 199, 111)";
const PRIMARY_FOREGROUND_RGB = "rgb(26, 34, 40)";
const WHITE_RGB = "rgb(247, 242, 232)";
const SECONDARY_BLUE_RGB = "rgb(80, 127, 140)";
const RING_RGB = "rgb(0, 200, 100)";

type ColorProbe = {
  color: string;
  backgroundColor: string;
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
};

function buildSidebarHoverFixtureHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --docs-chrome-primary-yellow: ${PRIMARY_YELLOW_RGB};
        --docs-chrome-secondary-blue: ${SECONDARY_BLUE_RGB};
        --docs-chrome-white: ${WHITE_RGB};
        --docs-chrome-muted-white: rgb(138, 174, 184);
        --primary-foreground: ${PRIMARY_FOREGROUND_RGB};
        --ring: ${RING_RGB};
      }
      * { box-sizing: border-box; transition: none !important; }
      body {
        margin: 0;
        background: rgb(5, 11, 16);
        color: ${WHITE_RGB};
        font-family: sans-serif;
      }
      a { text-decoration: none; }
      .${DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS} {
        display: flex;
        width: 100%;
        padding: 0.375rem 0.5rem;
        border-radius: 0.5rem;
      }
      ${SIDEBAR_CHROME_CSS}
    </style>
  </head>
  <body>
    <aside id="nd-sidebar">
      <a class="${DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS}" href="/docs/guides/getting-started" data-probe="desktop-rest">Getting started</a>
      <a class="${DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS}" href="/docs/concepts/harness" data-active="true" data-probe="desktop-active">Harness</a>
    </aside>
    <div data-mobile-docs-drawer>
      <a class="${DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS}" href="/docs/guides/getting-started" data-probe="mobile-rest">Getting started</a>
      <a class="${DOCS_CHROME_SIDEBAR_ROW_MARKER_CLASS}" href="/docs/concepts/harness" data-active="true" data-probe="mobile-active">Harness</a>
    </div>
  </body>
</html>`;
}

async function probe(
  page: {
    evaluate: <T>(fn: (sel: string) => T, sel: string) => Promise<T>;
  },
  selector: string,
): Promise<ColorProbe> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) {
      throw new Error(`fixture missing ${sel}`);
    }
    const style = getComputedStyle(el);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    };
  }, selector);
}

function expectYellowHover(probeResult: ColorProbe): void {
  expect(probeResult.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
  expect(probeResult.color).toBe(PRIMARY_FOREGROUND_RGB);
  expect(probeResult.backgroundColor).not.toBe(SECONDARY_BLUE_RGB);
}

describe("docs chrome sidebar hover non-regression (story 002)", () => {
  test("tokens still encode yellow hover + dark text distinct from secondary-blue active", () => {
    expect(DOCS_CHROME_SIDEBAR_TOKENS.hoverBackground).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.hoverForeground).toBe(
      "var(--primary-foreground)",
    );
    expect(DOCS_CHROME_SIDEBAR_TOKENS.focusRing).toBe("var(--ring)");
    expect(DOCS_CHROME_SIDEBAR_FACTORY_DARK.hoverBackground.toLowerCase()).toBe(
      "#f5c76f",
    );
    expect(DOCS_CHROME_SIDEBAR_FACTORY_DARK.hoverForeground.toLowerCase()).toBe(
      "#1a2228",
    );
  });

  test("Playwright fixture: rest, yellow hover on resting+active, and focus-visible ring", async () => {
    const browser = await launchPlaywrightBrowser();
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      });
      try {
        await page.setContent(buildSidebarHoverFixtureHtml(), {
          waitUntil: "load",
        });

        const desktopRest = await probe(page, '[data-probe="desktop-rest"]');
        expect(desktopRest.color).toBe(WHITE_RGB);
        expect(desktopRest.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);
        expect(desktopRest.backgroundColor).not.toBe(SECONDARY_BLUE_RGB);

        const mobileRest = await probe(page, '[data-probe="mobile-rest"]');
        expect(mobileRest.color).toBe(WHITE_RGB);
        expect(mobileRest.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="desktop-rest"]').hover();
        expectYellowHover(await probe(page, '[data-probe="desktop-rest"]'));

        await page.locator('[data-probe="desktop-active"]').hover();
        expectYellowHover(await probe(page, '[data-probe="desktop-active"]'));

        await page.locator('[data-probe="mobile-rest"]').hover();
        expectYellowHover(await probe(page, '[data-probe="mobile-rest"]'));

        await page.locator('[data-probe="mobile-active"]').hover();
        expectYellowHover(await probe(page, '[data-probe="mobile-active"]'));

        await page.locator('[data-probe="desktop-rest"]').focus();
        const focused = await probe(page, '[data-probe="desktop-rest"]');
        expect(focused.outlineStyle).toBe("solid");
        expect(focused.outlineWidth).toBe("2px");
        expect(focused.outlineColor).toBe(RING_RGB);
      } finally {
        await page.close();
      }
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
    }
  }, 120_000);
});
