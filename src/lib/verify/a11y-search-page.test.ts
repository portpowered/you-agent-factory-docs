import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { expectNoSeriousAxeOnPlaywrightPage } from "./a11y-playwright-axe";
import {
  getCriticalRoute,
  getCriticalViewport,
} from "./a11y-responsive-contract";
import { openA11yResponsivePageProbe } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

describe("search served-page accessibility", () => {
  test("served /search exposes landmarks, labeled search input, and no serious axe violations", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const search = getCriticalRoute("search");
    const laptop = getCriticalViewport("laptop");
    if (!search || !laptop) {
      throw new Error("Expected search route and laptop viewport in contract");
    }

    const session = await openA11yResponsivePageProbe({
      path: search.path,
      viewport: laptop,
      projectRoot: repoRoot,
    });

    try {
      const structure = await session.page.evaluate(() => {
        const banner = document.querySelector('header, [role="banner"]');
        const primaryNav = document.querySelector('nav[aria-label="Primary"]');
        const main = document.querySelector('main, [role="main"]');
        const h1s = Array.from(document.querySelectorAll("h1")).map((el) =>
          (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        );
        const searchInput = document.querySelector(
          "#search-page-input, input[type='search'], input[data-search]",
        ) as HTMLInputElement | null;
        const trigger = document.querySelector(
          'button[aria-label="Open search"], button[data-search]',
        ) as HTMLButtonElement | null;
        return {
          hasBanner: Boolean(banner),
          hasPrimaryNavigation: Boolean(primaryNav),
          hasMain: Boolean(main),
          h1Count: h1s.length,
          h1Texts: h1s,
          searchInputLabel:
            searchInput?.getAttribute("aria-label") ??
            (searchInput?.labels?.[0]?.textContent ?? "").trim() ??
            "",
          hasSearchInput: Boolean(searchInput),
          hasSearchTrigger: Boolean(trigger),
          triggerLabel: trigger?.getAttribute("aria-label") ?? "",
        };
      });

      expect(structure.hasBanner).toBe(true);
      expect(structure.hasPrimaryNavigation).toBe(true);
      expect(structure.hasMain).toBe(true);
      expect(structure.h1Count).toBeGreaterThanOrEqual(1);
      expect(structure.hasSearchInput).toBe(true);
      expect(structure.searchInputLabel.length).toBeGreaterThan(0);
      expect(structure.hasSearchTrigger).toBe(true);
      expect(structure.triggerLabel.length).toBeGreaterThan(0);

      const trigger = session.page.getByRole("button", {
        name: "Open search",
      });
      await trigger.focus();
      await trigger.click();
      const dialog = session.page.getByRole("dialog", { name: "Search" });
      // DocsSearchDialog is lazy-loaded; allow the chunk + Suspense resolve.
      await dialog.waitFor({ state: "visible", timeout: 30_000 });
      const searchInput = dialog.getByLabel(/Search you-agent-factory/i);
      await searchInput.waitFor({ state: "visible", timeout: 5_000 });
      const focusInDialog = await session.page.evaluate(() => {
        const node = document.querySelector('[role="dialog"]');
        return Boolean(node?.contains(document.activeElement));
      });
      if (!focusInDialog) {
        await searchInput.focus();
      }
      await session.page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden", timeout: 10_000 });
      const activeLabel = await session.page.evaluate(
        () => document.activeElement?.getAttribute("aria-label") ?? "",
      );
      expect(activeLabel).toBe("Open search");

      await expectNoSeriousAxeOnPlaywrightPage(session.page);
    } finally {
      await session.cleanup();
    }
  }, 180_000);
});
