import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  assertCriticalLayoutContract,
  CRITICAL_LAYOUT_CHROME_SELECTORS,
  evaluateCriticalLayoutSnapshotInBrowser,
  hashLayoutSnapshot,
} from "./a11y-layout-snapshot";
import {
  CRITICAL_ROUTES,
  getCriticalViewport,
  PAGE_OVERFLOW_TOLERANCE_PX,
} from "./a11y-responsive-contract";
import { openA11yResponsiveBrowserSession } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

describe("critical layout snapshot served-page probe", () => {
  test("critical routes at laptop pass layout contract with chrome boxes", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const laptop = getCriticalViewport("laptop");
    if (!laptop) {
      throw new Error("Expected laptop viewport in contract");
    }

    const session = await openA11yResponsiveBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      const hashes: string[] = [];
      for (const route of CRITICAL_ROUTES) {
        const page = await session.openPath(route.path, laptop);
        const snapshot = await page.evaluate(
          evaluateCriticalLayoutSnapshotInBrowser,
          {
            overflowTolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
            chromeSelectors: [...CRITICAL_LAYOUT_CHROME_SELECTORS],
          },
        );

        assertCriticalLayoutContract(snapshot, {
          minPrimaryNavLinks: 1,
        });
        expect(snapshot.hasUnintendedPageOverflow).toBe(false);
        // Real Chromium should report non-zero chrome geometry.
        expect(snapshot.chromeBoxes.length).toBeGreaterThan(0);
        expect(
          snapshot.chromeBoxes.every((box) => box.width > 0 || box.height > 0),
        ).toBe(true);

        const hash = hashLayoutSnapshot(snapshot);
        expect(hash).toMatch(/^[0-9a-f]{8}$/);
        hashes.push(hash);
      }

      // Distinct routes should not all collapse to one identical fingerprint
      // (guards against a no-op probe that always returns the same empty shape).
      expect(new Set(hashes).size).toBeGreaterThan(1);
    } finally {
      await session.cleanup();
    }
  });
});
