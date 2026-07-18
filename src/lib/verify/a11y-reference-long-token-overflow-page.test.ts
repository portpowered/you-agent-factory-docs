/**
 * Opt-in served-page W19 reference long-token overflow probe at narrow phone
 * and zoomed layouts. Runs when VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a
 * fresh `.next` exists (same gate as the critical-route / reference overflow
 * matrices).
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  evaluateReferenceLongTokenOverflowInBrowser,
  listReferenceLongTokenOverflowViewports,
  referenceLongTokenOverflowEvaluateArgs,
} from "./a11y-reference-long-token-overflow-contract";
import { REFERENCE_SURFACE_ROUTES } from "./a11y-reference-surface-contract";
import { openReferenceSurfaceBrowserSession } from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

const LONG_TOKEN_ROUTE_IDS = [
  "references-api",
  "references-events",
  "references-factory-schema",
] as const;

describe("reference-surface long-token overflow (served pages)", () => {
  test("API, events, and factory-schema contain long tokens at mobile and zoomed", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const routeId of LONG_TOKEN_ROUTE_IDS) {
        const route = REFERENCE_SURFACE_ROUTES.find(
          (entry) => entry.id === routeId,
        );
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

        const evaluateArgs = referenceLongTokenOverflowEvaluateArgs(routeId);

        for (const viewport of listReferenceLongTokenOverflowViewports()) {
          const page = await session.openPath(route.path, {
            width: viewport.width,
            height: viewport.height,
          });

          const probe = await page.evaluate(
            evaluateReferenceLongTokenOverflowInBrowser,
            evaluateArgs,
          );

          expect(
            probe.ok,
            `${route.path} @ ${viewport.id}: ${probe.error}`,
          ).toBe(true);
          expect(probe.hasUnintendedPageOverflow).toBe(false);

          const required = probe.tokens.filter((entry) => entry.required);
          expect(required.length).toBeGreaterThan(0);
          for (const token of required) {
            expect(
              token.found,
              `${route.path} @ ${viewport.id}: missing ${token.id}`,
            ).toBe(true);
            expect(
              token.allHitsContained,
              `${route.path} @ ${viewport.id}: uncontained ${token.id}`,
            ).toBe(true);
          }
        }
      }
    } finally {
      await session.cleanup();
    }
  }, 600_000);
});
