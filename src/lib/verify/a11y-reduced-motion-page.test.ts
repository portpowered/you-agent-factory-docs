import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  evaluateReducedMotionChromeInBrowser,
  MOBILE_DRAWER_MOTION_CHROME,
  REDUCED_MOTION_DURATION_THRESHOLD_MS,
} from "./a11y-reduced-motion";
import {
  getCriticalRoute,
  getCriticalViewport,
} from "./a11y-responsive-contract";
import { openA11yResponsivePageProbe } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");
const drawerSelector = `[data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"]`;

describe("reduced-motion served-page probe", () => {
  test("mobile drawer motion is reduced when prefers-reduced-motion is set", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const home = getCriticalRoute("home");
    const mobile = getCriticalViewport("mobile");
    if (!home || !mobile) {
      throw new Error("Expected home route and mobile viewport in contract");
    }

    const session = await openA11yResponsivePageProbe({
      path: home.path,
      viewport: mobile,
      projectRoot: repoRoot,
    });

    try {
      await session.page.emulateMedia({ reducedMotion: "reduce" });
      await session.page.reload({ waitUntil: "load" });

      const menuButton = session.page.locator("header button[aria-expanded]");
      await menuButton.click();
      await session.page.waitForSelector(drawerSelector, { state: "visible" });

      const reduced = await session.page.evaluate(
        evaluateReducedMotionChromeInBrowser,
        {
          selector: drawerSelector,
          thresholdMs: REDUCED_MOTION_DURATION_THRESHOLD_MS,
        },
      );

      expect(reduced.found).toBe(true);
      expect(reduced.prefersReducedMotion).toBe(true);
      expect(reduced.isReduced).toBe(true);
      expect(reduced.transitionDurationMs).toBeLessThanOrEqual(
        REDUCED_MOTION_DURATION_THRESHOLD_MS,
      );
    } finally {
      await session.cleanup();
    }
  });

  test("mobile drawer keeps non-zero transition when reduced motion is off", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const home = getCriticalRoute("home");
    const mobile = getCriticalViewport("mobile");
    if (!home || !mobile) {
      throw new Error("Expected home route and mobile viewport in contract");
    }

    const session = await openA11yResponsivePageProbe({
      path: home.path,
      viewport: mobile,
      projectRoot: repoRoot,
    });

    try {
      await session.page.emulateMedia({ reducedMotion: "no-preference" });
      await session.page.reload({ waitUntil: "load" });

      const menuButton = session.page.locator("header button[aria-expanded]");
      await menuButton.click();
      await session.page.waitForSelector(drawerSelector, { state: "visible" });

      const fullMotion = await session.page.evaluate(
        evaluateReducedMotionChromeInBrowser,
        {
          selector: drawerSelector,
          thresholdMs: REDUCED_MOTION_DURATION_THRESHOLD_MS,
        },
      );

      expect(fullMotion.found).toBe(true);
      expect(fullMotion.prefersReducedMotion).toBe(false);
      // Without the preference, the drawer still uses duration-300.
      expect(fullMotion.transitionDurationMs).toBeGreaterThan(
        REDUCED_MOTION_DURATION_THRESHOLD_MS,
      );
      expect(fullMotion.isReduced).toBe(false);
    } finally {
      await session.cleanup();
    }
  });
});
