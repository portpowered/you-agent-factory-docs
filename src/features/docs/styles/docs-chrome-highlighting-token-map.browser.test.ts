/**
 * Always-on behavioral gate for the locked docs chrome highlighting token map.
 *
 * Happy-dom cannot prove CSS :hover computed styles. This suite uses Playwright
 * against a minimal docs-shell fixture that embeds the shared chrome CSS for
 * all five surfaces — no Next production build or `bun run dev` required.
 *
 * Surfaces probed together:
 * 1. search / globe / GitHub (surrounding background → primary yellow fill)
 * 2. TOC current / non-current (secondary blue / muted white → yellow overlay)
 * 3. sidebar row (white text; selected = muted secondary-blue wash; hover =
 *    wide primary-yellow background + dark text)
 * 4. header text / icons (white → primary yellow overlay)
 * 5. breadcrumb (muted white → primary yellow overlay)
 *
 * Out-of-scope fence: TOC / search / header brand accents stay on their locked
 * roles — this lane only retargets sidebar selected tint.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DOCS_CHROME_TOKEN_MAP_FACTORY_DARK_PROOFS,
  DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS,
} from "@/features/docs/styles/docs-chrome-highlighting-token-map-contract";
import {
  closePlaywrightBrowserWithTimeout,
  launchPlaywrightBrowser,
} from "@/lib/verify/launch-playwright-browser";

const ROOT = process.cwd();

const TOC_CHROME_CSS = readFileSync(
  join(ROOT, "src/features/docs/styles/docs-chrome-toc.css"),
  "utf8",
);
const SIDEBAR_CHROME_CSS = readFileSync(
  join(ROOT, "src/features/docs/styles/docs-chrome-sidebar.css"),
  "utf8",
);
const HEADER_BREADCRUMB_CHROME_CSS = readFileSync(
  join(ROOT, "src/features/docs/styles/docs-chrome-header-breadcrumb.css"),
  "utf8",
);

const proofs = DOCS_CHROME_TOKEN_MAP_FACTORY_DARK_PROOFS;

/** rgb() strings matching factory-dark chrome hex proofs. */
const SURROUNDING_RGB = "rgb(5, 11, 16)";
const PRIMARY_YELLOW_RGB = "rgb(245, 199, 111)";
const SECONDARY_BLUE_RGB = "rgb(80, 127, 140)";
const WHITE_RGB = "rgb(247, 242, 232)";
const MUTED_WHITE_RGB = "rgb(138, 174, 184)";
const PRIMARY_FOREGROUND_RGB = "rgb(26, 34, 40)";
const RING_RGB = "rgb(0, 200, 100)";

/**
 * Search / globe / GitHub rules mirrored from globals.css (token ownership).
 * Kept inline so the fixture does not depend on the full Next CSS pipeline.
 */
const SEARCH_GLOBE_GITHUB_CSS = `
button[data-search] {
  background-color: var(--docs-chrome-surrounding-background) !important;
  border: 1px solid transparent;
  color: var(--docs-chrome-white);
}

@media (hover: hover) {
  button[data-search]:hover,
  button[data-search]:active {
    background-color: var(--docs-chrome-primary-yellow) !important;
    border-color: var(--docs-chrome-primary-yellow) !important;
    color: var(--primary-foreground) !important;
  }
}

@layer utilities {
  button.header-action-icon,
  a.header-action-icon {
    border-style: solid;
    border-width: 1px;
    background-color: var(--docs-chrome-surrounding-background) !important;
    color: var(--docs-chrome-white);
  }

  @media (hover: hover) {
    button.header-action-icon:hover,
    a.header-action-icon:hover,
    button.header-action-icon:active,
    a.header-action-icon:active {
      background-color: var(--docs-chrome-primary-yellow) !important;
      border-color: var(--docs-chrome-primary-yellow) !important;
      color: var(--primary-foreground) !important;
    }
  }
}
`;

function buildFiveSurfaceFixtureHtml(): string {
  const selectedWashToken =
    DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow
      .selectedActiveBackgroundToken;
  if (!selectedWashToken) {
    throw new Error(
      "sidebar selected wash token missing from token-map contract",
    );
  }
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --background: ${SURROUNDING_RGB};
        --primary: ${PRIMARY_YELLOW_RGB};
        --secondary: ${SECONDARY_BLUE_RGB};
        --foreground: ${WHITE_RGB};
        --muted-foreground: ${MUTED_WHITE_RGB};
        --primary-foreground: ${PRIMARY_FOREGROUND_RGB};
        --ring: ${RING_RGB};
        --docs-chrome-surrounding-background: var(--background);
        --docs-chrome-primary-yellow: var(--primary);
        --docs-chrome-secondary-blue: var(--secondary);
        --docs-chrome-white: var(--foreground);
        --docs-chrome-muted-white: var(--muted-foreground);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--docs-chrome-surrounding-background);
        color: var(--docs-chrome-white);
        font-family: sans-serif;
      }
      a { text-decoration: none; }
      button, a.header-action-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2rem;
        min-height: 2rem;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
      }
      .docs-chrome-sidebar-row {
        display: flex;
        width: 100%;
        padding: 0.375rem 0.5rem;
        border-radius: 0.5rem;
      }
      /* Disable transitions so hover hex assertions are stable. */
      * { transition: none !important; }
      ${SEARCH_GLOBE_GITHUB_CSS}
      ${TOC_CHROME_CSS}
      ${SIDEBAR_CHROME_CSS}
      ${HEADER_BREADCRUMB_CHROME_CSS}
    </style>
  </head>
  <body>
    <header>
      <a class="docs-chrome-header-text" href="/" data-probe="header-text">you-agent-factory</a>
      <a class="docs-chrome-header-text" href="/docs/guides" data-probe="header-nav">Guides</a>
      <button type="button" class="docs-chrome-header-icon" data-probe="header-icon" aria-label="Open menu">☰</button>
      <button type="button" data-search data-probe="search">Search</button>
      <button type="button" class="header-action-icon" data-probe="globe" aria-label="Language">🌐</button>
      <a class="header-action-icon" href="https://github.com/example" data-probe="github" aria-label="GitHub">GH</a>
    </header>

    <nav aria-label="breadcrumb">
      <a class="docs-chrome-breadcrumb-link" href="/docs" data-probe="breadcrumb-link">Docs</a>
      <span class="docs-chrome-breadcrumb-page" data-probe="breadcrumb-page">Getting started</span>
    </nav>

    <aside id="nd-sidebar">
      <a class="docs-chrome-sidebar-row" href="/docs/guides/getting-started" data-probe="sidebar-row">Getting started</a>
      <a class="docs-chrome-sidebar-row" href="/docs/concepts/harness" data-active="true" data-probe="sidebar-active">Harness</a>
    </aside>
    <!-- Reference wash: browsers report color-mix as oklch(... / 0.18); compare equality. -->
    <div data-probe="sidebar-active-ref" style="background-color: ${selectedWashToken}; width:1px;height:1px;"></div>

    <nav id="nd-toc" aria-label="On this page">
      <a href="#overview" data-active="true" data-probe="toc-current">Overview</a>
      <a href="#install" data-probe="toc-non-current">Install</a>
      <div class="bg-fd-primary" data-probe="toc-thumb" style="width:2px;height:1rem;"></div>
    </nav>
  </body>
</html>`;
}

type ColorProbe = {
  color: string;
  backgroundColor: string;
};

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
    };
  }, selector);
}

describe("docs chrome highlighting token-map behavioral (five surfaces)", () => {
  test("contract proofs stay aligned with rgb fixture expectations", () => {
    expect(proofs.surroundingChromeBackground.toLowerCase()).toBe("#050b10");
    expect(proofs.primaryYellow.toLowerCase()).toBe("#f5c76f");
    expect(proofs.secondaryBlue.toLowerCase()).toBe("#507f8c");
    expect(proofs.white.toLowerCase()).toBe("#f7f2e8");
    expect(proofs.mutedWhite.toLowerCase()).toBe("#8aaeb8");

    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow.hoverActiveKind,
    ).toBe("background");
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow.selectedActiveRole,
    ).toBe("secondaryBlue");
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow.selectedActiveProof,
    ).toBe("#507f8c");
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow
        .selectedActiveBackgroundToken,
    ).toContain("--docs-chrome-secondary-blue");
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow
        .selectedActiveBackgroundToken,
    ).not.toContain("--docs-chrome-primary-yellow");
  });

  test("Playwright fixture: all five surfaces match locked rest, selected, and hover token map", async () => {
    const browser = await launchPlaywrightBrowser();
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 900 },
      });
      try {
        await page.setContent(buildFiveSurfaceFixtureHtml(), {
          waitUntil: "load",
        });

        // --- Resting states (TOC / search / header fence: unchanged accents) ---
        const searchRest = await probe(page, '[data-probe="search"]');
        expect(searchRest.backgroundColor).toBe(SURROUNDING_RGB);

        const globeRest = await probe(page, '[data-probe="globe"]');
        expect(globeRest.backgroundColor).toBe(SURROUNDING_RGB);

        const githubRest = await probe(page, '[data-probe="github"]');
        expect(githubRest.backgroundColor).toBe(SURROUNDING_RGB);

        const tocCurrentRest = await probe(page, '[data-probe="toc-current"]');
        expect(tocCurrentRest.color).toBe(SECONDARY_BLUE_RGB);

        const tocNonCurrentRest = await probe(
          page,
          '[data-probe="toc-non-current"]',
        );
        expect(tocNonCurrentRest.color).toBe(MUTED_WHITE_RGB);

        const tocThumbRest = await probe(page, '[data-probe="toc-thumb"]');
        expect(tocThumbRest.backgroundColor).toBe(SECONDARY_BLUE_RGB);

        const sidebarRest = await probe(page, '[data-probe="sidebar-row"]');
        expect(sidebarRest.color).toBe(WHITE_RGB);
        expect(sidebarRest.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);
        expect(sidebarRest.backgroundColor).not.toBe(SECONDARY_BLUE_RGB);

        // Selected/active: muted secondary-blue wash (not yellow). Compare to
        // reference color-mix — browsers report oklch(... / 0.18).
        const sidebarActive = await probe(
          page,
          '[data-probe="sidebar-active"]',
        );
        const sidebarActiveRef = await probe(
          page,
          '[data-probe="sidebar-active-ref"]',
        );
        expect(sidebarActive.color).toBe(WHITE_RGB);
        expect(sidebarActive.backgroundColor).toBe(
          sidebarActiveRef.backgroundColor,
        );
        expect(sidebarActive.backgroundColor).not.toBe(PRIMARY_YELLOW_RGB);
        expect(sidebarActive.backgroundColor).not.toBe("transparent");
        expect(sidebarActive.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

        const headerTextRest = await probe(page, '[data-probe="header-text"]');
        expect(headerTextRest.color).toBe(WHITE_RGB);

        const headerIconRest = await probe(page, '[data-probe="header-icon"]');
        expect(headerIconRest.color).toBe(WHITE_RGB);

        const breadcrumbRest = await probe(
          page,
          '[data-probe="breadcrumb-link"]',
        );
        expect(breadcrumbRest.color).toBe(MUTED_WHITE_RGB);

        const breadcrumbPageRest = await probe(
          page,
          '[data-probe="breadcrumb-page"]',
        );
        expect(breadcrumbPageRest.color).toBe(MUTED_WHITE_RGB);

        // --- Hover overlays (sidebar hover stays yellow + dark text) ---
        await page.locator('[data-probe="search"]').hover();
        const searchHover = await probe(page, '[data-probe="search"]');
        expect(searchHover.backgroundColor).toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="globe"]').hover();
        const globeHover = await probe(page, '[data-probe="globe"]');
        expect(globeHover.backgroundColor).toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="github"]').hover();
        const githubHover = await probe(page, '[data-probe="github"]');
        expect(githubHover.backgroundColor).toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="toc-current"]').hover();
        const tocCurrentHover = await probe(page, '[data-probe="toc-current"]');
        expect(tocCurrentHover.color).toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="toc-non-current"]').hover();
        const tocNonCurrentHover = await probe(
          page,
          '[data-probe="toc-non-current"]',
        );
        expect(tocNonCurrentHover.color).toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="sidebar-row"]').hover();
        const sidebarHover = await probe(page, '[data-probe="sidebar-row"]');
        expect(sidebarHover.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
        expect(sidebarHover.color).toBe(PRIMARY_FOREGROUND_RGB);

        await page.locator('[data-probe="sidebar-active"]').hover();
        const sidebarActiveHover = await probe(
          page,
          '[data-probe="sidebar-active"]',
        );
        expect(sidebarActiveHover.backgroundColor).toBe(PRIMARY_YELLOW_RGB);
        expect(sidebarActiveHover.color).toBe(PRIMARY_FOREGROUND_RGB);
        expect(sidebarActiveHover.backgroundColor).not.toBe(SECONDARY_BLUE_RGB);

        await page.locator('[data-probe="header-text"]').hover();
        const headerTextHover = await probe(page, '[data-probe="header-text"]');
        expect(headerTextHover.color).toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="header-icon"]').hover();
        const headerIconHover = await probe(page, '[data-probe="header-icon"]');
        expect(headerIconHover.color).toBe(PRIMARY_YELLOW_RGB);

        await page.locator('[data-probe="breadcrumb-link"]').hover();
        const breadcrumbHover = await probe(
          page,
          '[data-probe="breadcrumb-link"]',
        );
        expect(breadcrumbHover.color).toBe(PRIMARY_YELLOW_RGB);
      } finally {
        await page.close();
      }
    } finally {
      await closePlaywrightBrowserWithTimeout(browser);
    }
  }, 120_000);
});
