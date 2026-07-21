/**
 * Story 003 shared-feel gate: collection resource cards and docs Previous/Next
 * footer cards use the same primary-yellow fill + dark accent-ink text on
 * hover/focus-visible.
 *
 * Happy-dom cannot prove hover/focus computed styles. This suite locks token
 * parity in unit assertions, then uses one Playwright fixture that embeds both
 * chrome stylesheets — no Next production build or `bun run dev` required.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_RESOURCE_CARD_HOVER_TOKENS,
  DOCS_RESOURCE_CARD_LINK_MARKER_CLASS,
  searchInlineResultsListClassName,
} from "@/features/docs/components/list-decoration";
import { DOCS_PAGE_FOOTER_HOVER_TOKENS } from "@/features/docs/styles/docs-page-footer-chrome";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
  PLAYWRIGHT_FIXTURE_TEST_TIMEOUT_MS,
} from "@/lib/verify/launch-playwright-browser";

const RESOURCE_CARD_HOVER_CSS = readFileSync(
  join(process.cwd(), "src/features/docs/styles/docs-resource-card-hover.css"),
  "utf8",
);
const FOOTER_CHROME_CSS = readFileSync(
  join(process.cwd(), "src/features/docs/styles/docs-page-footer-chrome.css"),
  "utf8",
);

const PRIMARY_YELLOW_RGB = "rgb(245, 199, 111)";
const PRIMARY_FOREGROUND_RGB = "rgb(26, 34, 40)";
const FOREGROUND_RGB = "rgb(247, 242, 232)";
const MUTED_FOREGROUND_RGB = "rgb(160, 170, 180)";
const RING_RGB = "rgb(0, 200, 100)";

const FOOTER_CARD_CLASS =
  "flex flex-col gap-2 rounded-lg border bg-fd-card p-4 text-sm transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground";

type SharedHoverProbe = {
  backgroundColor: string;
  color: string;
  titleColor: string;
};

function buildSharedFeelFixtureHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --docs-chrome-primary-yellow: ${PRIMARY_YELLOW_RGB};
        --primary-foreground: ${PRIMARY_FOREGROUND_RGB};
        --color-fd-foreground: ${FOREGROUND_RGB};
        --color-fd-muted-foreground: ${MUTED_FOREGROUND_RGB};
        --color-fd-accent-foreground: rgb(255, 0, 0);
        --ring: ${RING_RGB};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: ${FOREGROUND_RGB};
        font-family: sans-serif;
        background: #111;
        padding: 1rem;
        display: grid;
        gap: 1.5rem;
      }
      .text-foreground { color: ${FOREGROUND_RGB}; }
      .text-muted-foreground { color: ${MUTED_FOREGROUND_RGB}; }
      .text-fd-muted-foreground { color: var(--color-fd-muted-foreground); }
      a.${DOCS_RESOURCE_CARD_LINK_MARKER_CLASS} {
        display: block;
        border: 1px solid rgb(80, 80, 80);
        background-color: rgba(40, 50, 60, 0.4);
        border-radius: 0.5rem;
        padding: 1rem;
        text-decoration: none;
        color: inherit;
      }
      a.${DOCS_RESOURCE_CARD_LINK_MARKER_CLASS}:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--ring);
      }
      @layer base {
        #nd-page a[class*="hover:text-fd-accent-foreground"] {
          color: inherit;
          text-decoration: none;
        }
      }
      ${RESOURCE_CARD_HOVER_CSS}
      ${FOOTER_CHROME_CSS}
    </style>
  </head>
  <body>
    <a
      class="${DOCS_RESOURCE_CARD_LINK_MARKER_CLASS} group"
      href="/browse"
      data-shared-surface="resource-card"
    >
      <span class="text-foreground" data-shared-title>Guides</span>
      <p class="text-muted-foreground" data-shared-body>
        Practical walkthroughs for factory workflows.
      </p>
    </a>
    <div id="nd-page">
      <a
        class="${FOOTER_CARD_CLASS}"
        href="/docs/next"
        data-shared-surface="footer-card"
      >
        <span data-shared-title>Next page title</span>
        <p class="text-fd-muted-foreground" data-shared-body>Next</p>
      </a>
    </div>
  </body>
</html>`;
}

async function probeSharedSurface(
  page: { evaluate: <T>(fn: (key: string) => T, key: string) => Promise<T> },
  surface: "resource-card" | "footer-card",
): Promise<SharedHoverProbe> {
  return page.evaluate((key) => {
    const card = document.querySelector(
      `[data-shared-surface='${key}']`,
    ) as HTMLElement | null;
    if (!card) {
      throw new Error(`fixture missing ${key}`);
    }
    const title = card.querySelector(
      "[data-shared-title]",
    ) as HTMLElement | null;
    if (!title) {
      throw new Error(`fixture missing title for ${key}`);
    }
    const style = getComputedStyle(card);
    return {
      backgroundColor: style.backgroundColor,
      color: style.color,
      titleColor: getComputedStyle(title).color,
    };
  }, surface);
}

describe("docs card + footer shared yellow/dark hover feel", () => {
  test("token exports share primary yellow fill and dark accent ink", () => {
    expect(DOCS_RESOURCE_CARD_HOVER_TOKENS.hoverBackground).toBe(
      DOCS_PAGE_FOOTER_HOVER_TOKENS.hoverBackground,
    );
    expect(DOCS_RESOURCE_CARD_HOVER_TOKENS.hoverForeground).toBe(
      DOCS_PAGE_FOOTER_HOVER_TOKENS.hoverForeground,
    );
    expect(DOCS_RESOURCE_CARD_HOVER_TOKENS.hoverBackground).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_RESOURCE_CARD_HOVER_TOKENS.hoverForeground).toBe(
      "var(--primary-foreground)",
    );
  });

  test("both chrome stylesheets encode the shared yellow + dark-text pairing", () => {
    for (const css of [RESOURCE_CARD_HOVER_CSS, FOOTER_CHROME_CSS]) {
      expect(css).toContain(
        "background-color: var(--docs-chrome-primary-yellow)",
      );
      expect(css).toContain("color: var(--primary-foreground)");
      expect(css).not.toContain("hover:border-ring");
      expect(css).not.toContain("color: inherit");
    }
  });

  test("search inline results list stays outside the shared card hover chrome", () => {
    expect(searchInlineResultsListClassName).not.toContain(
      DOCS_RESOURCE_CARD_LINK_MARKER_CLASS,
    );
    expect(searchInlineResultsListClassName).not.toContain("hover:border-ring");
    expect(searchInlineResultsListClassName).not.toContain(
      "--docs-chrome-primary-yellow",
    );
  });

  test(
    "Playwright fixture: resource card and footer card share yellow + dark text on hover/focus",
    async () => {
      const browser = await launchPlaywrightBrowser();
      try {
        const page = await browser.newPage({
          viewport: { width: 1024, height: 768 },
        });
        try {
          await page.setContent(buildSharedFeelFixtureHtml(), {
            waitUntil: "load",
          });

          const resourceCard = page.locator(
            "[data-shared-surface='resource-card']",
          );
          const footerCard = page.locator(
            "[data-shared-surface='footer-card']",
          );
          expect(await resourceCard.count()).toBe(1);
          expect(await footerCard.count()).toBe(1);

          const resourceRest = await probeSharedSurface(page, "resource-card");
          const footerRest = await probeSharedSurface(page, "footer-card");
          expect(resourceRest.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);
          expect(footerRest.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);
          expect(resourceRest.titleColor).toBe(FOREGROUND_RGB);

          await resourceCard.hover();
          const resourceHover = await probeSharedSurface(page, "resource-card");
          expect(resourceHover.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
          expect(resourceHover.color).toBe(PRIMARY_FOREGROUND_RGB);
          expect(resourceHover.titleColor).toBe(PRIMARY_FOREGROUND_RGB);

          await footerCard.hover();
          const footerHover = await probeSharedSurface(page, "footer-card");
          expect(footerHover.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
          expect(footerHover.color).toBe(PRIMARY_FOREGROUND_RGB);
          expect(footerHover.titleColor).toBe(PRIMARY_FOREGROUND_RGB);

          expect(resourceHover.backgroundColor).toBe(
            footerHover.backgroundColor,
          );
          expect(resourceHover.color).toBe(footerHover.color);
          expect(resourceHover.titleColor).toBe(footerHover.titleColor);

          await resourceCard.focus();
          const resourceFocus = await probeSharedSurface(page, "resource-card");
          expect(resourceFocus.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
          expect(resourceFocus.titleColor).toBe(PRIMARY_FOREGROUND_RGB);

          await footerCard.focus();
          const footerFocus = await probeSharedSurface(page, "footer-card");
          expect(footerFocus.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
          expect(footerFocus.titleColor).toBe(PRIMARY_FOREGROUND_RGB);
          expect(resourceFocus.backgroundColor).toBe(
            footerFocus.backgroundColor,
          );
          expect(resourceFocus.titleColor).toBe(footerFocus.titleColor);
        } finally {
          await page.close();
        }
      } finally {
        await closePlaywrightBrowserWithTimeout(browser);
      }
    },
    PLAYWRIGHT_FIXTURE_TEST_TIMEOUT_MS,
  );
});
