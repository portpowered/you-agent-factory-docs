/**
 * Behavioral gate for API accent chrome under `[data-api-reference-theme]`.
 *
 * Happy-dom cannot prove CSS cascade remaps for Fumadocs tab/chip utilities.
 * This suite uses Playwright against a minimal fixture that embeds
 * `references-api-accents.css` — no Next production build or `bun run dev`.
 *
 * Proves selected tabs → secondary blue, quiet tabs → muted secondary, and
 * MethodLabel Tailwind colors → secondary (not primary yellow).
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FACTORY_DARK_FOUNDATION } from "@/lib/theme/host-semantic-theme-tokens";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";
import {
  API_ACCENT_CHROME_FACTORY_DARK_RGB,
  API_ACCENT_CHROME_QUIET_COLOR,
  API_ACCENT_CHROME_SELECTED_COLOR,
  API_ACCENT_METHOD_LABEL_COLOR_CLASSES,
  API_ACCENT_TAB_QUIET_SELECTOR,
  API_ACCENT_TAB_SELECTED_SELECTOR,
} from "./api-accent-chrome";
import { API_THEME_ROOT_ATTR } from "./theme-tokens";

const ROOT = process.cwd();
const ACCENT_CSS = readFileSync(
  join(ROOT, "src/features/docs/styles/references-api-accents.css"),
  "utf8",
);

const SECONDARY_BLUE_RGB = API_ACCENT_CHROME_FACTORY_DARK_RGB.selected;
const MUTED_SECONDARY_RGB = API_ACCENT_CHROME_FACTORY_DARK_RGB.quiet;
const PRIMARY_YELLOW_RGB = API_ACCENT_CHROME_FACTORY_DARK_RGB.primaryYellow;

function buildAccentFixtureHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --secondary: ${FACTORY_DARK_FOUNDATION.secondaryAccent};
        --muted-foreground: ${FACTORY_DARK_FOUNDATION.secondaryAccentInk};
        --primary: ${FACTORY_DARK_FOUNDATION.accent};
        --color-fd-primary: var(--primary);
        --color-fd-muted-foreground: var(--muted-foreground);
      }
      /* Simulate Fumadocs tab utilities that the accent CSS remaps. */
      [role="tab"] {
        color: var(--color-fd-muted-foreground);
        border-bottom: 2px solid transparent;
      }
      [role="tab"][data-state="active"] {
        color: var(--color-fd-primary);
        border-color: var(--color-fd-primary);
      }
      [role="tab"][data-state="active"] > .underline {
        background-color: var(--color-fd-primary);
        height: 1px;
      }
      .text-green-600 { color: #16a34a; }
      .text-blue-600 { color: #2563eb; }
      .text-yellow-600 { color: #ca8a04; }
      .text-red-600 { color: #dc2626; }
      ${ACCENT_CSS}
    </style>
  </head>
  <body>
    <div ${API_THEME_ROOT_ATTR}="">
      <div role="tablist">
        <button role="tab" data-state="active" data-probe="lang-selected" class="group">
          curl
          <div class="underline absolute"></div>
        </button>
        <button role="tab" data-state="inactive" data-probe="lang-quiet">
          js
        </button>
        <button role="tab" data-state="active" data-probe="status-selected">
          200
        </button>
        <button role="tab" data-state="inactive" data-probe="status-quiet">
          400
        </button>
      </div>
      <span class="text-green-600" data-probe="method-get">GET</span>
      <span class="text-blue-600" data-probe="method-post">POST</span>
      <span class="text-yellow-600" data-probe="method-put">PUT</span>
      <span class="text-red-600" data-probe="method-delete">DELETE</span>
    </div>
    <!-- Outside theme root: primary yellow must remain primary (no leak). -->
    <button role="tab" data-state="active" data-probe="outside-selected"
      style="color: var(--color-fd-primary); border-color: var(--color-fd-primary);">
      outside
    </button>
  </body>
</html>`;
}

describe("API accent chrome computed styles", () => {
  test("contract selectors and colors stay secondary / muted-secondary", () => {
    expect(API_ACCENT_TAB_SELECTED_SELECTOR).toContain(
      `[${API_THEME_ROOT_ATTR}]`,
    );
    expect(API_ACCENT_TAB_QUIET_SELECTOR).toContain(
      '[role="tab"]:not([data-state="active"])',
    );
    expect(API_ACCENT_CHROME_SELECTED_COLOR).toBe("var(--secondary)");
    expect(API_ACCENT_CHROME_QUIET_COLOR).toBe("var(--muted-foreground)");
    expect(FACTORY_DARK_FOUNDATION.secondaryAccent).toBe("#507f8c");
    expect(FACTORY_DARK_FOUNDATION.accent).toBe("#f5c76f");
    expect(API_ACCENT_CHROME_FACTORY_DARK_RGB.selected).not.toBe(
      API_ACCENT_CHROME_FACTORY_DARK_RGB.primaryYellow,
    );
    expect(API_ACCENT_METHOD_LABEL_COLOR_CLASSES).toContain("text-yellow-600");
    expect(API_ACCENT_METHOD_LABEL_COLOR_CLASSES).toContain("text-green-600");
  });

  test("fixture tabs, status chips, and method labels resolve secondary — not primary yellow", async () => {
    const browser = await launchPlaywrightBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(buildAccentFixtureHtml(), {
        waitUntil: "load",
      });

      const colors = await page.evaluate(() => {
        const read = (probe: string) => {
          const el = document.querySelector(`[data-probe="${probe}"]`);
          if (!el) return null;
          const style = getComputedStyle(el);
          return {
            color: style.color,
            borderColor: style.borderColor,
          };
        };
        const underline = document.querySelector(
          '[data-probe="lang-selected"] > .underline',
        );
        return {
          langSelected: read("lang-selected"),
          langQuiet: read("lang-quiet"),
          statusSelected: read("status-selected"),
          statusQuiet: read("status-quiet"),
          methodGet: read("method-get"),
          methodPost: read("method-post"),
          methodPut: read("method-put"),
          methodDelete: read("method-delete"),
          outsideSelected: read("outside-selected"),
          underlineBg: underline
            ? getComputedStyle(underline).backgroundColor
            : null,
        };
      });

      expect(colors.langSelected?.color).toBe(SECONDARY_BLUE_RGB);
      expect(colors.langSelected?.borderColor).toContain(SECONDARY_BLUE_RGB);
      expect(colors.langQuiet?.color).toBe(MUTED_SECONDARY_RGB);

      expect(colors.statusSelected?.color).toBe(SECONDARY_BLUE_RGB);
      expect(colors.statusQuiet?.color).toBe(MUTED_SECONDARY_RGB);

      expect(colors.methodGet?.color).toBe(SECONDARY_BLUE_RGB);
      expect(colors.methodPost?.color).toBe(SECONDARY_BLUE_RGB);
      expect(colors.methodPut?.color).toBe(SECONDARY_BLUE_RGB);
      expect(colors.methodDelete?.color).toBe(SECONDARY_BLUE_RGB);

      expect(colors.underlineBg).toBe(SECONDARY_BLUE_RGB);

      // Remaps must not leak outside the theme root.
      expect(colors.outsideSelected?.color).toBe(PRIMARY_YELLOW_RGB);

      // None of the in-theme accents may resolve to primary yellow.
      for (const probe of [
        colors.langSelected,
        colors.langQuiet,
        colors.statusSelected,
        colors.statusQuiet,
        colors.methodGet,
        colors.methodPost,
        colors.methodPut,
        colors.methodDelete,
      ]) {
        expect(probe?.color).not.toBe(PRIMARY_YELLOW_RGB);
      }
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
    }
  });
});
