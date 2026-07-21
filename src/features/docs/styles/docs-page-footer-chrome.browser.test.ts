/**
 * Always-on behavioral gate for docs Previous/Next footer chrome.
 *
 * Happy-dom cannot prove hover/focus computed styles. This suite uses Playwright
 * against a minimal `#nd-page` fixture that embeds the shared chrome CSS and
 * simulates Fumadocs/Tailwind hover text + tall padding utilities — no Next
 * production build or `bun run dev` required.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_PAGE_FOOTER_HOVER_TOKENS,
  docsPageFooterCompactGap,
  docsPageFooterCompactPadding,
} from "@/features/docs/styles/docs-page-footer-chrome";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";

const FOOTER_CHROME_CSS = readFileSync(
  join(process.cwd(), "src/features/docs/styles/docs-page-footer-chrome.css"),
  "utf8",
);

/** Distinctive accent-foreground so Fumadocs recoloring is observable in rgb(). */
const ACCENT_FOREGROUND_RGB = "rgb(255, 0, 0)";
const FOREGROUND_RGB = "rgb(20, 20, 20)";
const MUTED_FOREGROUND_RGB = "rgb(100, 100, 100)";
const PRIMARY_YELLOW_RGB = "rgb(245, 199, 111)";
const PRIMARY_FOREGROUND_RGB = "rgb(26, 34, 40)";
const RING_RGB = "rgb(0, 200, 100)";

const FUMADOCS_TALL_PADDING_PX = 16; // p-4 = 1rem
const FUMADOCS_TALL_GAP_PX = 8; // gap-2 = 0.5rem
const COMPACT_PADDING_Y_PX = 8; // 0.5rem
const COMPACT_PADDING_X_PX = 12; // 0.75rem
const COMPACT_GAP_PX = 4; // 0.25rem

const FOOTER_CARD_CLASS =
  "flex flex-col gap-2 rounded-lg border bg-fd-card p-4 text-sm transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground";

/** Mirrors FamilyDocsFooterNeighbors card classes (live docs surface). */
const FAMILY_FOOTER_CARD_CLASS =
  "flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-muted/80";

type FooterCardProbe = {
  color: string;
  backgroundColor: string;
  outlineWidth: string;
  boxShadow: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  gap: string;
  sublabelColor: string;
};

function buildFooterChromeFixtureHtml(includeChromeCss: boolean): string {
  const competingUtilities = `
@layer utilities {
  /* Simulate Tailwind hover:text-fd-accent-foreground without overriding bg. */
  a[class*="hover:text-fd-accent-foreground"]:hover,
  a[class*="hover:text-fd-accent-foreground"]:focus-visible {
    color: var(--color-fd-accent-foreground);
  }
  a[class*="p-4"] {
    padding: 1rem;
  }
  a[class*="gap-2"] {
    gap: 0.5rem;
  }
}
`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --color-fd-foreground: ${FOREGROUND_RGB};
        --color-fd-accent: rgb(0, 100, 200);
        --color-fd-accent-foreground: ${ACCENT_FOREGROUND_RGB};
        --color-fd-muted-foreground: ${MUTED_FOREGROUND_RGB};
        --docs-chrome-primary-yellow: ${PRIMARY_YELLOW_RGB};
        --primary-foreground: ${PRIMARY_FOREGROUND_RGB};
        --ring: ${RING_RGB};
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--color-fd-foreground);
        font-family: sans-serif;
      }
      .text-fd-muted-foreground {
        color: var(--color-fd-muted-foreground);
      }
      @layer base {
        /* Fumadocs footer cards inherit page foreground at rest (not UA link blue). */
        #nd-page a[class*="hover:text-fd-accent-foreground"] {
          color: inherit;
          text-decoration: none;
        }
      }
      ${competingUtilities}
      ${includeChromeCss ? FOOTER_CHROME_CSS : ""}
    </style>
  </head>
  <body>
    <article id="nd-page">
      <nav aria-label="page neighbors" style="display:grid;gap:1rem;padding:1rem;">
        <a
          class="${FOOTER_CARD_CLASS}"
          href="/docs/prev"
          data-footer-card="previous"
        >
          <p class="text-fd-muted-foreground truncate">Previous Page</p>
          Previous Title
        </a>
        <a
          class="${FOOTER_CARD_CLASS}"
          href="/docs/next"
          data-footer-card="next"
        >
          <p class="text-fd-muted-foreground truncate">Next Page</p>
          Next Title
        </a>
      </nav>
      <nav
        aria-label="Page navigation"
        data-testid="family-docs-footer-neighbors"
        style="display:grid;gap:1rem;padding:1rem;grid-template-columns:1fr 1fr;"
      >
        <a
          class="${FAMILY_FOOTER_CARD_CLASS}"
          href="/docs/family-prev"
          data-footer-card="family-previous"
        >
          <div class="inline-flex items-center gap-1.5 font-medium">
            <span aria-hidden="true">←</span>
            <p>Family Previous Title</p>
          </div>
          <p class="truncate text-muted-foreground">Previous page</p>
        </a>
        <a
          class="${FAMILY_FOOTER_CARD_CLASS} text-end"
          href="/docs/family-next"
          data-footer-card="family-next"
        >
          <div class="inline-flex items-center gap-1.5 font-medium flex-row-reverse">
            <span aria-hidden="true">→</span>
            <p>Family Next Title</p>
          </div>
          <p class="truncate text-muted-foreground">Next page</p>
        </a>
      </nav>
    </article>
  </body>
</html>`;
}

async function probeFooterCard(
  page: {
    evaluate: <T>(fn: (cardKey: string) => T, cardKey: string) => Promise<T>;
  },
  cardKey: "previous" | "next" | "family-previous" | "family-next",
): Promise<FooterCardProbe> {
  return page.evaluate((key) => {
    const card = document.querySelector(
      `[data-footer-card="${key}"]`,
    ) as HTMLElement | null;
    if (!card) {
      throw new Error(`fixture missing footer card ${key}`);
    }
    const sublabel = card.querySelector(
      "p.text-fd-muted-foreground, p.text-muted-foreground, p.truncate",
    ) as HTMLElement | null;
    if (!sublabel) {
      throw new Error(`fixture missing muted sublabel on ${key}`);
    }
    const style = getComputedStyle(card);
    const sublabelStyle = getComputedStyle(sublabel);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
      paddingTop: style.paddingTop,
      paddingRight: style.paddingRight,
      paddingBottom: style.paddingBottom,
      paddingLeft: style.paddingLeft,
      gap: style.gap || style.rowGap,
      sublabelColor: sublabelStyle.color,
    };
  }, cardKey);
}

function parsePx(value: string): number {
  return Number.parseFloat(value);
}

function expectCompactSizing(probe: FooterCardProbe): void {
  expect(parsePx(probe.paddingTop)).toBe(COMPACT_PADDING_Y_PX);
  expect(parsePx(probe.paddingBottom)).toBe(COMPACT_PADDING_Y_PX);
  expect(parsePx(probe.paddingLeft)).toBe(COMPACT_PADDING_X_PX);
  expect(parsePx(probe.paddingRight)).toBe(COMPACT_PADDING_X_PX);
  expect(parsePx(probe.gap)).toBe(COMPACT_GAP_PX);
  expect(parsePx(probe.paddingTop)).toBeLessThan(FUMADOCS_TALL_PADDING_PX);
  expect(parsePx(probe.gap)).toBeLessThan(FUMADOCS_TALL_GAP_PX);
}

function expectTallSizing(probe: FooterCardProbe): void {
  expect(parsePx(probe.paddingTop)).toBe(FUMADOCS_TALL_PADDING_PX);
  expect(parsePx(probe.paddingLeft)).toBe(FUMADOCS_TALL_PADDING_PX);
  expect(parsePx(probe.gap)).toBe(FUMADOCS_TALL_GAP_PX);
}

describe("docs page footer chrome behavioral (always-on)", () => {
  test("compact token exports stay aligned with rem→px fixture expectations", () => {
    expect(docsPageFooterCompactPadding).toBe("0.5rem 0.75rem");
    expect(docsPageFooterCompactGap).toBe("0.25rem");
    expect(DOCS_PAGE_FOOTER_HOVER_TOKENS.hoverBackground).toBe(
      "var(--docs-chrome-primary-yellow)",
    );
    expect(DOCS_PAGE_FOOTER_HOVER_TOKENS.hoverForeground).toBe(
      "var(--primary-foreground)",
    );
  });

  test("Playwright fixture: hover/focus show yellow highlight with dark text and compact sizing", async () => {
    const browser = await launchPlaywrightBrowser();
    try {
      const page = await browser.newPage({
        viewport: { width: 1024, height: 768 },
      });
      try {
        await page.setContent(buildFooterChromeFixtureHtml(true), {
          waitUntil: "load",
        });

        for (const cardKey of ["previous", "next"] as const) {
          const card = page.locator(`[data-footer-card="${cardKey}"]`);
          expect(await card.count()).toBe(1);

          const resting = await probeFooterCard(page, cardKey);
          expect(resting.color).toBe(FOREGROUND_RGB);
          expect(resting.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);
          expectCompactSizing(resting);

          await card.hover();
          const hovered = await probeFooterCard(page, cardKey);
          expect(hovered.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
          expect(hovered.color).toBe(PRIMARY_FOREGROUND_RGB);
          expect(hovered.color).not.toBe(ACCENT_FOREGROUND_RGB);
          expect(hovered.sublabelColor).toBe(PRIMARY_FOREGROUND_RGB);
          expectCompactSizing(hovered);

          await card.focus();
          const focused = await probeFooterCard(page, cardKey);
          expect(focused.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
          expect(focused.color).toBe(PRIMARY_FOREGROUND_RGB);
          expect(focused.color).not.toBe(ACCENT_FOREGROUND_RGB);
          expect(focused.sublabelColor).toBe(PRIMARY_FOREGROUND_RGB);
          expect(parsePx(focused.outlineWidth)).toBeGreaterThanOrEqual(2);
          expect(focused.boxShadow).toContain(RING_RGB);
          expectCompactSizing(focused);
        }

        // Live docs pages use FamilyDocsFooterNeighbors — density must land there.
        for (const cardKey of ["family-previous", "family-next"] as const) {
          const resting = await probeFooterCard(page, cardKey);
          expectCompactSizing(resting);
        }
      } finally {
        await page.close();
      }
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
    }
  }, 120_000);

  test("Playwright fixture without chrome CSS: tall padding and accent title recolor still reproduce", async () => {
    const browser = await launchPlaywrightBrowser();
    try {
      const page = await browser.newPage({
        viewport: { width: 1024, height: 768 },
      });
      try {
        await page.setContent(buildFooterChromeFixtureHtml(false), {
          waitUntil: "load",
        });

        const card = page.locator('[data-footer-card="next"]');
        const resting = await probeFooterCard(page, "next");
        expectTallSizing(resting);

        await card.hover();
        const hovered = await probeFooterCard(page, "next");
        expect(hovered.color).toBe(ACCENT_FOREGROUND_RGB);
        expectTallSizing(hovered);

        const familyResting = await probeFooterCard(page, "family-next");
        expectTallSizing(familyResting);
      } finally {
        await page.close();
      }
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
    }
  }, 120_000);
});
