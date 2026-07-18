/**
 * Opt-in served-page W19 reference copy announcement probe.
 * Runs when VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh `.next` exists
 * (same gate as the critical-route / reference overflow matrices).
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  evaluateReferenceCopyAnnouncementsInBrowser,
  referenceCopyAnnouncementEvaluateArgs,
} from "./a11y-reference-copy-announcement-contract";
import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";
import { openReferenceSurfaceBrowserSession } from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

/** Routes with required deep-link copy chrome for story 007. */
const COPY_ANNOUNCEMENT_ROUTE_IDS: readonly ReferenceSurfaceRouteId[] = [
  "references-api",
  "references-events",
  "references-factory-schema",
] as const;

const COPY_ANNOUNCEMENT_VIEWPORTS = [
  { id: "laptop" as const, width: 1024, height: 768 },
  { id: "mobile" as const, width: 390, height: 844 },
] as const;

describe("reference-surface copy status announcements (served pages)", () => {
  test("API, events, and factory-schema copy controls announce via polite live regions", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const routeId of COPY_ANNOUNCEMENT_ROUTE_IDS) {
        const route = REFERENCE_SURFACE_ROUTES.find(
          (entry) => entry.id === routeId,
        );
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

        const evaluateArgs = referenceCopyAnnouncementEvaluateArgs(routeId);

        for (const viewport of COPY_ANNOUNCEMENT_VIEWPORTS) {
          const page = await session.openPath(route.path, viewport);

          // Grant clipboard write so useCopyButton can resolve.
          await page.context().grantPermissions(["clipboard-write"], {
            origin: new URL(page.url()).origin,
          });

          const probe = await page.evaluate(
            evaluateReferenceCopyAnnouncementsInBrowser,
            evaluateArgs,
          );

          expect(
            probe.ok,
            `${route.path} @ ${viewport.id}: ${probe.error}`,
          ).toBe(true);
          expect(probe.error).toBeNull();

          const required = probe.probes.filter((entry) => entry.required);
          expect(required.length).toBeGreaterThan(0);
          for (const entry of required) {
            expect(entry.controlFound).toBe(true);
            expect(entry.announcedAfterCopy).toBe(true);
            expect(entry.announcementPersistsWithoutHover).toBe(true);
            expect(entry.statusAriaLive).toBe("polite");
          }
        }
      }
    } finally {
      await session.cleanup();
    }
  });
});
