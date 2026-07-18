/**
 * Opt-in served-page W19 reference overflow matrix.
 * Runs when VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh `.next` exists
 * (same gate as the critical-route overflow matrix).
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  listReferenceOverflowMatrixCases,
  REFERENCE_SURFACE_ROUTES,
  REFERENCE_SURFACE_VIEWPORTS,
} from "./a11y-reference-surface-contract";
import {
  evaluateResponsiveOverflowInBrowser,
  openReferenceSurfaceBrowserSession,
  referenceSurfaceOverflowEvaluateArgs,
} from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

describe("reference-surface responsive overflow matrix (served pages)", () => {
  test("every representative route has no unintended page overflow at five layouts", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const cases = listReferenceOverflowMatrixCases();
    expect(cases).toHaveLength(
      REFERENCE_SURFACE_ROUTES.length * REFERENCE_SURFACE_VIEWPORTS.length,
    );

    const evaluateArgs = referenceSurfaceOverflowEvaluateArgs();
    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const { route, viewport } of cases) {
        const page = await session.openPath(route.path, viewport);
        const probe = await page.evaluate(evaluateResponsiveOverflowInBrowser, {
          selectors: [...evaluateArgs.selectors],
          tolerancePx: evaluateArgs.tolerancePx,
        });

        if (probe.hasUnintendedOverflow) {
          throw new Error(
            `${route.id} @ ${viewport.id} (${viewport.width}px) has page overflowPx=${probe.overflowPx} (client=${probe.clientWidth}, scroll=${probe.scrollWidth})`,
          );
        }
        expect(probe.hasUnintendedOverflow).toBe(false);
        expect(probe.allowsIntentionalScrollers).toBe(true);
      }
    } finally {
      await session.cleanup();
    }
  }, 600_000);
});
