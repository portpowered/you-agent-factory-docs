import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import type { Page } from "playwright";
import {
  CRITICAL_ROUTES,
  CRITICAL_VIEWPORTS,
  getCriticalViewport,
  INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS,
  listCriticalOverflowMatrixCases,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "./a11y-responsive-contract";
import { openA11yResponsiveBrowserSession } from "./a11y-responsive-page-session";
import { evaluateResponsiveOverflowInBrowser } from "./a11y-responsive-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

async function probeSiteNavAtViewport(
  page: Page,
  viewportId: string,
  path: string,
): Promise<void> {
  const isLandingHome = path === "/";

  if (viewportId === "mobile" && !isLandingHome) {
    const menuButton = page.locator("header button[aria-expanded]").first();
    expect(await menuButton.count()).toBeGreaterThan(0);
    await menuButton.click();
    const drawer = await page.evaluate(() => {
      const button = document.querySelector(
        "header button[aria-expanded]",
      ) as HTMLButtonElement | null;
      const primaryNav = document.querySelector('nav[aria-label="Primary"]');
      const links = primaryNav
        ? Array.from(primaryNav.querySelectorAll("a[href]"))
        : [];
      return {
        hasMenuButton: Boolean(button),
        menuExpanded: button?.getAttribute("aria-expanded") === "true",
        hasSiteNavigation: Boolean(primaryNav),
        linkCount: links.length,
      };
    });
    expect(drawer.hasMenuButton).toBe(true);
    expect(drawer.menuExpanded).toBe(true);
    expect(drawer.hasSiteNavigation).toBe(true);
    expect(drawer.linkCount).toBeGreaterThanOrEqual(3);
    return;
  }

  // Production `/` LandingHeader keeps inline Landing nav (no docs drawer).
  // Docs routes keep Primary inline at tablet+.
  const inline = await page.evaluate((landingHome) => {
    const nav = document.querySelector(
      landingHome ? 'nav[aria-label="Landing"]' : 'nav[aria-label="Primary"]',
    );
    const links = nav ? Array.from(nav.querySelectorAll("a[href]")) : [];
    return {
      hasSiteNavigation: Boolean(nav),
      linkCount: links.length,
    };
  }, isLandingHome);
  expect(inline.hasSiteNavigation).toBe(true);
  expect(inline.linkCount).toBeGreaterThanOrEqual(3);
}

describe("critical-route responsive overflow matrix (served pages)", () => {
  test("every critical route has no unintended page overflow at mobile/tablet/laptop/wide", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const cases = listCriticalOverflowMatrixCases();
    expect(cases).toHaveLength(
      CRITICAL_ROUTES.length * CRITICAL_VIEWPORTS.length,
    );

    const session = await openA11yResponsiveBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const { route, viewport } of cases) {
        const page = await session.openPath(route.path, viewport);
        const probe = await page.evaluate(evaluateResponsiveOverflowInBrowser, {
          selectors: [...INTENTIONAL_HORIZONTAL_SCROLL_SELECTORS],
          tolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
        });

        if (probe.hasUnintendedOverflow) {
          throw new Error(
            `${route.id} @ ${viewport.id} (${viewport.width}px) has page overflowPx=${probe.overflowPx} (client=${probe.clientWidth}, scroll=${probe.scrollWidth})`,
          );
        }
        expect(probe.hasUnintendedOverflow).toBe(false);
        expect(probe.allowsIntentionalScrollers).toBe(true);

        if (route.id === "harness-support" && viewport.width <= 768) {
          const matrix = probe.intentional.find(
            (hit) => hit.matchedBy === "[data-harness-support-matrix]",
          );
          expect(matrix?.canScrollHorizontally).toBe(true);
        }
      }
    } finally {
      await session.cleanup();
    }
  }, 600_000);

  test("site navigation remains usable at mobile and tablet", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const mobile = getCriticalViewport("mobile");
    const tablet = getCriticalViewport("tablet");
    if (!mobile || !tablet) {
      throw new Error("Expected mobile and tablet viewports in contract");
    }

    const session = await openA11yResponsiveBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const viewport of [mobile, tablet]) {
        // Landing `/` (inline Landing nav) + docs browse (Primary / drawer).
        for (const path of ["/", "/browse"] as const) {
          const page = await session.openPath(path, viewport);
          await probeSiteNavAtViewport(page, viewport.id, path);
        }
      }
    } finally {
      await session.cleanup();
    }
  }, 300_000);
});
