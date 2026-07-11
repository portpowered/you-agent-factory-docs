/**
 * Always-on left-edge geometry gate for the shared content-column contract.
 *
 * Happy-dom cannot prove CSS grid track alignment. This suite uses Playwright
 * against a minimal fixture that mirrors the docs header shell vs
 * `#nd-docs-layout` / `#nd-page` tracks — no Next production build required —
 * so default `make a11y` / CI cannot pass with the historical ~32px gap drift.
 */

import { describe, expect, test } from "bun:test";
import { DOCS_HEADER_SHELL_CLASS } from "@/components/layout/docs-header";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "./launch-playwright-browser";

/** Subpixel / rounding tolerance matching the served-page probe. */
const LEFT_EDGE_TOLERANCE_PX = 2;

/**
 * Historical drift: two `gap-4` (16px) gutters between header cols 1→2 and
 * 2→3. Fixture uses fixed track sizes so empty `fr` columns cannot collapse
 * the gap math.
 */
const HEADER_COLUMN_GAP_PX = 16;
const HEADER_GAP_DRIFT_PX = HEADER_COLUMN_GAP_PX * 2;

const DESKTOP_VIEWPORTS = [
  { id: "tablet", width: 768, height: 1024 },
  { id: "laptop", width: 1024, height: 768 },
  { id: "wide", width: 1440, height: 900 },
] as const;

/**
 * Fixture uses fixed 5-column tracks (left gutter / sidebar / main / toc /
 * right gutter) matching the docs header vs `#nd-docs-layout` column count.
 * `headerGapPx` toggles the gutters that previously offset the primary-nav
 * column ~32px right of `#nd-page`.
 */
function buildTrackAlignmentFixtureHtml(headerGapPx: number): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; }
      .tracks {
        display: grid;
        width: 100%;
        grid-template-columns: 40px 268px minmax(0, 1fr) 0px 40px;
      }
      .header-shell { gap: ${headerGapPx}px; }
      .body-layout { gap: 0; }
      .tracks > .gutter-start { grid-column: 1; }
      .tracks > .sidebar { grid-column: 2; }
      .tracks > .main { grid-column: 3; width: 100%; }
      .tracks > .toc { grid-column: 4; }
      .tracks > .gutter-end { grid-column: 5; }
    </style>
  </head>
  <body>
    <header>
      <div class="tracks header-shell" data-docs-header-shell="">
        <div class="gutter-start"></div>
        <div class="sidebar">Brand</div>
        <div class="main" data-header-nav-column="">Nav</div>
        <div class="toc"></div>
        <div class="gutter-end"></div>
      </div>
    </header>
    <main>
      <div class="tracks body-layout" id="nd-docs-layout">
        <div class="gutter-start"></div>
        <div class="sidebar">Side</div>
        <article class="main" id="nd-page">Page</article>
        <div class="toc"></div>
        <div class="gutter-end"></div>
      </div>
    </main>
  </body>
</html>`;
}

async function measureNavVsPageDelta(page: {
  evaluate: <T>(fn: () => T) => Promise<T>;
}): Promise<number> {
  return page.evaluate(() => {
    const nav = document.querySelector(
      "[data-header-nav-column]",
    ) as HTMLElement | null;
    const content = document.querySelector("#nd-page") as HTMLElement | null;
    if (!nav || !content) {
      throw new Error("fixture missing nav column or #nd-page");
    }
    return Math.abs(
      Math.round(nav.getBoundingClientRect().left) -
        Math.round(content.getBoundingClientRect().left),
    );
  });
}

describe("content-column left-edge geometry (always-on)", () => {
  test("docs header shell zeros desktop column gap to match #nd-docs-layout", () => {
    expect(DOCS_HEADER_SHELL_CLASS).toContain("gap-4");
    expect(DOCS_HEADER_SHELL_CLASS).toContain("md:gap-0");
    expect(DOCS_HEADER_SHELL_CLASS).not.toMatch(/(?:^|\s)-m[trblxy]?-/);
  });

  test("Playwright fixture: zero header gap keeps nav track aligned with #nd-page at md+", async () => {
    const browser = await launchPlaywrightBrowser();
    try {
      for (const viewport of DESKTOP_VIEWPORTS) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
        });
        try {
          await page.setContent(buildTrackAlignmentFixtureHtml(0), {
            waitUntil: "load",
          });
          const alignedDelta = await measureNavVsPageDelta(page);
          expect(alignedDelta).toBeLessThanOrEqual(LEFT_EDGE_TOLERANCE_PX);

          await page.setContent(
            buildTrackAlignmentFixtureHtml(HEADER_COLUMN_GAP_PX),
            { waitUntil: "load" },
          );
          const gappedDelta = await measureNavVsPageDelta(page);
          // Two 16px gutters between cols 1→2 and 2→3 → ~32px drift.
          expect(gappedDelta).toBeGreaterThan(LEFT_EDGE_TOLERANCE_PX);
          expect(gappedDelta).toBeGreaterThanOrEqual(HEADER_GAP_DRIFT_PX - 2);
          expect(gappedDelta).toBeLessThanOrEqual(HEADER_GAP_DRIFT_PX + 2);
        } finally {
          await page.close();
        }
      }
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
    }
  }, 120_000);
});
