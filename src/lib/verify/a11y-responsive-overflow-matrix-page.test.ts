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

async function probePrimaryNavAtViewport(
  page: Page,
  viewportId: string,
): Promise<void> {
  if (viewportId === "mobile") {
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
        hasPrimaryNavigation: Boolean(primaryNav),
        primaryLinkCount: links.length,
      };
    });
    expect(drawer.hasMenuButton).toBe(true);
    expect(drawer.menuExpanded).toBe(true);
    expect(drawer.hasPrimaryNavigation).toBe(true);
    expect(drawer.primaryLinkCount).toBeGreaterThanOrEqual(3);
    return;
  }

  const inline = await page.evaluate(() => {
    const primaryNav = document.querySelector('nav[aria-label="Primary"]');
    const links = primaryNav
      ? Array.from(primaryNav.querySelectorAll("a[href]"))
      : [];
    return {
      hasPrimaryNavigation: Boolean(primaryNav),
      primaryLinkCount: links.length,
    };
  });
  expect(inline.hasPrimaryNavigation).toBe(true);
  expect(inline.primaryLinkCount).toBeGreaterThanOrEqual(3);
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

  test("primary navigation remains usable at mobile and tablet", async () => {
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
        const page = await session.openPath("/", viewport);
        await probePrimaryNavAtViewport(page, viewport.id);
      }
    } finally {
      await session.cleanup();
    }
  }, 300_000);
});
