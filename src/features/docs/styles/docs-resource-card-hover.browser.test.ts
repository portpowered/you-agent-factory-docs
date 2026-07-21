/**
 * Always-on behavioral gate for collection resource-card hover chrome.
 *
 * Happy-dom cannot prove hover/focus computed styles. This suite uses Playwright
 * against a minimal fixture that embeds docs-resource-card-hover.css and child
 * text-* utilities — no Next production build or `bun run dev` required.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_RESOURCE_CARD_HOVER_TOKENS,
  DOCS_RESOURCE_CARD_LINK_MARKER_CLASS,
} from "@/features/docs/components/list-decoration";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";

const RESOURCE_CARD_HOVER_CSS = readFileSync(
  join(process.cwd(), "src/features/docs/styles/docs-resource-card-hover.css"),
  "utf8",
);

const PRIMARY_YELLOW_RGB = "rgb(245, 199, 111)";
const PRIMARY_FOREGROUND_RGB = "rgb(26, 34, 40)";
const FOREGROUND_RGB = "rgb(247, 242, 232)";
const MUTED_FOREGROUND_RGB = "rgb(160, 170, 180)";
const RING_RGB = "rgb(0, 200, 100)";
const CARD_REST_BG_RGB = "rgba(40, 50, 60, 0.4)";

type ResourceCardProbe = {
  color: string;
  backgroundColor: string;
  borderColor: string;
  boxShadow: string;
  titleColor: string;
  bodyColor: string;
};

function buildResourceCardFixtureHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --docs-chrome-primary-yellow: ${PRIMARY_YELLOW_RGB};
        --primary-foreground: ${PRIMARY_FOREGROUND_RGB};
        --ring: ${RING_RGB};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: ${FOREGROUND_RGB};
        font-family: sans-serif;
        background: #111;
        padding: 1rem;
      }
      .text-foreground { color: ${FOREGROUND_RGB}; }
      .text-muted-foreground { color: ${MUTED_FOREGROUND_RGB}; }
      .text-primary { color: ${PRIMARY_YELLOW_RGB}; }
      a.${DOCS_RESOURCE_CARD_LINK_MARKER_CLASS} {
        display: block;
        border: 1px solid rgb(80, 80, 80);
        background-color: ${CARD_REST_BG_RGB};
        border-radius: 0.5rem;
        padding: 1rem;
        text-decoration: none;
        color: inherit;
      }
      a.${DOCS_RESOURCE_CARD_LINK_MARKER_CLASS}:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--ring);
      }
      ${RESOURCE_CARD_HOVER_CSS}
    </style>
  </head>
  <body>
    <a
      class="${DOCS_RESOURCE_CARD_LINK_MARKER_CLASS} group"
      href="/browse"
      data-resource-card="sample"
    >
      <span class="text-foreground" data-card-title>Guides</span>
      <p class="text-muted-foreground" data-card-body>
        Practical walkthroughs for factory workflows.
      </p>
      <svg class="text-primary" data-card-icon width="16" height="16" aria-hidden="true">
        <rect width="16" height="16" fill="currentColor" />
      </svg>
    </a>
  </body>
</html>`;
}

async function probeResourceCard(page: {
  evaluate: <T>(fn: () => T) => Promise<T>;
}): Promise<ResourceCardProbe> {
  return page.evaluate(() => {
    const card = document.querySelector(
      "[data-resource-card='sample']",
    ) as HTMLElement | null;
    if (!card) {
      throw new Error("fixture missing resource card");
    }
    const title = card.querySelector("[data-card-title]") as HTMLElement | null;
    const body = card.querySelector("[data-card-body]") as HTMLElement | null;
    if (!title || !body) {
      throw new Error("fixture missing title/body");
    }
    const style = getComputedStyle(card);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      titleColor: getComputedStyle(title).color,
      bodyColor: getComputedStyle(body).color,
    };
  });
}

describe("docs resource card hover behavioral (always-on)", () => {
  test("hover tokens lock primary yellow fill and dark accent ink", () => {
    expect(DOCS_RESOURCE_CARD_HOVER_TOKENS.hoverBackground).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_RESOURCE_CARD_HOVER_TOKENS.hoverForeground).toBe(
      "var(--primary-foreground)",
    );
  });

  test("Playwright fixture: hover and focus-visible show yellow highlight with dark text", async () => {
    const browser = await launchPlaywrightBrowser();
    try {
      const page = await browser.newPage({
        viewport: { width: 1024, height: 768 },
      });
      try {
        await page.setContent(buildResourceCardFixtureHtml(), {
          waitUntil: "load",
        });

        const card = page.locator("[data-resource-card='sample']");
        expect(await card.count()).toBe(1);

        const resting = await probeResourceCard(page);
        expect(resting.titleColor).toBe(FOREGROUND_RGB);
        expect(resting.bodyColor).toBe(MUTED_FOREGROUND_RGB);
        expect(resting.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);

        await card.hover();
        const hovered = await probeResourceCard(page);
        expect(hovered.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
        expect(hovered.borderColor).toBe(PRIMARY_YELLOW_RGB);
        expect(hovered.color).toBe(PRIMARY_FOREGROUND_RGB);
        expect(hovered.titleColor).toBe(PRIMARY_FOREGROUND_RGB);
        expect(hovered.bodyColor).toBe(PRIMARY_FOREGROUND_RGB);

        await card.focus();
        const focused = await probeResourceCard(page);
        expect(focused.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
        expect(focused.borderColor).toBe(PRIMARY_YELLOW_RGB);
        expect(focused.color).toBe(PRIMARY_FOREGROUND_RGB);
        expect(focused.titleColor).toBe(PRIMARY_FOREGROUND_RGB);
        expect(focused.bodyColor).toBe(PRIMARY_FOREGROUND_RGB);
        expect(focused.boxShadow).toContain(RING_RGB);
      } finally {
        await page.close();
      }
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
    }
  }, 120_000);
});
