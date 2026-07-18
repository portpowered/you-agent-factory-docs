/**
 * Opt-in served-page W19 reference keyboard navigation probe.
 * Runs when VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh `.next` exists
 * (same gate as the critical-route / reference overflow matrices).
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";
import {
  evaluateReferenceKeyboardChromeInBrowser,
  openReferenceSurfaceBrowserSession,
  referenceKeyboardEvaluateArgs,
} from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

/** Routes with required interactive reference chrome for story 004. */
const KEYBOARD_ROUTE_IDS: readonly ReferenceSurfaceRouteId[] = [
  "references-api",
  "references-events",
  "references-factory-schema",
] as const;

const KEYBOARD_VIEWPORTS = [
  { id: "laptop" as const, width: 1024, height: 768 },
  { id: "mobile" as const, width: 390, height: 844 },
] as const;

describe("reference-surface keyboard navigation (served pages)", () => {
  test("API, events, and factory-schema chrome is keyboard-focusable with focus rings", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const routeId of KEYBOARD_ROUTE_IDS) {
        const route = REFERENCE_SURFACE_ROUTES.find(
          (entry) => entry.id === routeId,
        );
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

        const evaluateArgs = referenceKeyboardEvaluateArgs(routeId);

        for (const viewport of KEYBOARD_VIEWPORTS) {
          const page = await session.openPath(route.path, viewport);

          // Focus each required control and confirm document.activeElement.
          for (const control of evaluateArgs.controls.filter(
            (c) => c.required,
          )) {
            const focused = await page.evaluate((selector) => {
              const element = document.querySelector(selector);
              if (!(element instanceof HTMLElement)) {
                return { ok: false, reason: "missing" as const };
              }
              if (element.hasAttribute("disabled")) {
                return { ok: true, reason: "disabled" as const };
              }
              element.focus();
              return {
                ok: document.activeElement === element,
                reason:
                  document.activeElement === element
                    ? ("focused" as const)
                    : ("not-focused" as const),
              };
            }, control.selector);

            if (!focused.ok) {
              throw new Error(
                `${route.id} @ ${viewport.id}: could not keyboard-focus "${control.label}" (${control.selector}); reason=${focused.reason}`,
              );
            }
          }

          // Operate mobile navigator via keyboard on narrow layouts.
          if (routeId === "references-api" && viewport.id === "mobile") {
            const mobile = page.locator("[data-api-mobile-navigator]");
            expect(await mobile.count()).toBeGreaterThan(0);
            const summary = mobile.locator("summary");
            await summary.focus();
            await page.keyboard.press("Enter");
            const isOpen = await mobile.evaluate(
              (el) => (el as HTMLDetailsElement).open,
            );
            if (!isOpen) {
              await summary.click();
            }
            expect(
              await mobile.evaluate((el) => (el as HTMLDetailsElement).open),
            ).toBe(true);
          }

          const probe = await page.evaluate(
            evaluateReferenceKeyboardChromeInBrowser,
            {
              controls: evaluateArgs.controls.map((control) => ({
                id: control.id,
                selector: control.selector,
                label: control.label,
                required: control.required,
              })),
            },
          );

          if (!probe.ok) {
            throw new Error(
              `${route.id} @ ${viewport.id}: ${probe.error ?? "keyboard chrome failed"}`,
            );
          }
          expect(probe.ok).toBe(true);
        }
      }
    } finally {
      await session.cleanup();
    }
  }, 600_000);
});
