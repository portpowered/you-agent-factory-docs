/**
 * Opt-in served-page W19 reference reduced-motion probe.
 * Runs when VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh `.next` exists
 * (same gate as the critical-route / reference overflow matrices).
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  evaluateReferenceReducedMotionInBrowser,
  MOBILE_DRAWER_MOTION_CHROME,
  REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS,
  referenceReducedMotionEvaluateArgs,
} from "./a11y-reference-reduced-motion-contract";
import { REFERENCE_SURFACE_ROUTES } from "./a11y-reference-surface-contract";
import { openReferenceSurfaceBrowserSession } from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

const REDUCED_MOTION_VIEWPORTS = [
  { id: "laptop" as const, width: 1024, height: 768 },
  { id: "mobile" as const, width: 390, height: 844 },
] as const;

const drawerSelector = `[data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"]`;

describe("reference-surface reduced-motion (served pages)", () => {
  test("API, events, and factory-schema honor reduced-motion hash focus and drawer chrome", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const routeId of REFERENCE_REDUCED_MOTION_HASH_ROUTE_IDS) {
        const route = REFERENCE_SURFACE_ROUTES.find(
          (entry) => entry.id === routeId,
        );
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

        const evaluateArgs = referenceReducedMotionEvaluateArgs(routeId);

        for (const viewport of REDUCED_MOTION_VIEWPORTS) {
          const page = await session.openPath(route.path, viewport);

          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.reload({ waitUntil: "load" });

          // Open docs mobile drawer on narrow layouts so motion chrome mounts.
          if (viewport.id === "mobile") {
            const menuButton = page.locator(evaluateArgs.drawerMenuSelector);
            if ((await menuButton.count()) > 0) {
              await menuButton.first().click();
              await page.waitForSelector(drawerSelector, {
                state: "visible",
                timeout: 5_000,
              });
            }
          }

          const probe = await page.evaluate(
            evaluateReferenceReducedMotionInBrowser,
            evaluateArgs,
          );

          expect(
            probe.ok,
            `${route.path} @ ${viewport.id}: ${probe.error}`,
          ).toBe(true);
          expect(probe.prefersReducedMotion).toBe(true);
          expect(probe.hashFocus?.found).toBe(true);
          expect(probe.hashFocus?.focused).toBe(true);
          expect(probe.hashFocus?.contentUnchanged).toBe(true);

          if (viewport.id === "mobile") {
            const drawer = probe.motionChrome.find(
              (entry) => entry.selector === drawerSelector,
            );
            expect(drawer?.found).toBe(true);
            expect(drawer?.isReduced).toBe(true);
          }
        }
      }
    } finally {
      await session.cleanup();
    }
  }, 600_000);
});
