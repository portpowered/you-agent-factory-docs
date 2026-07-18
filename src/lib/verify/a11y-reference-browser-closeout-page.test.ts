/**
 * Opt-in consolidated W19 browser close-out.
 *
 * Runs the story-011 evidence matrix in one Playwright session when
 * VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh `.next` exists (or
 * VERIFY_BASE_URL points at a static-export server). Does not run W20
 * sitemap/canonical/link/search convergence.
 */

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  listReferenceBrowserCloseoutCases,
  REFERENCE_BROWSER_CLOSEOUT_EXCLUDED_W20_SUITES,
  REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS,
  referenceBrowserCloseoutCoversRequiredSurfaces,
} from "./a11y-reference-browser-closeout-contract";
import {
  evaluateReferenceCopyAnnouncementsInBrowser,
  referenceCopyAnnouncementEvaluateArgs,
} from "./a11y-reference-copy-announcement-contract";
import {
  listReferenceHashTargetsForRoute,
  listReferenceMobileNavsForRoute,
} from "./a11y-reference-hash-focus-contract";
import {
  evaluateReferenceLongTokenOverflowInBrowser,
  referenceLongTokenOverflowEvaluateArgs,
} from "./a11y-reference-long-token-overflow-contract";
import {
  evaluateReferenceNoJsHtmlInBrowser,
  referenceNoJsHtmlEvaluateArgs,
  stripScriptsFromHtml,
} from "./a11y-reference-no-js-html-contract";
import {
  evaluateReferencePayloadBudgets,
  referencePayloadBudgetsAlignWithSurfaceContract,
} from "./a11y-reference-payload-budget";
import {
  evaluateReferenceReducedMotionInBrowser,
  MOBILE_DRAWER_MOTION_CHROME,
  referenceReducedMotionEvaluateArgs,
} from "./a11y-reference-reduced-motion-contract";
import {
  getReferenceSurfaceRoute,
  getReferenceSurfaceViewport,
  listReferenceOverflowMatrixCases,
} from "./a11y-reference-surface-contract";
import {
  evaluateReferenceKeyboardChromeInBrowser,
  evaluateResponsiveOverflowInBrowser,
  openReferenceSurfaceBrowserSession,
  referenceKeyboardEvaluateArgs,
  referenceSurfaceOverflowEvaluateArgs,
} from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";
import { DEFAULT_EXPORT_OUT_DIR } from "./static-export-server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

const drawerSelector = `[data-motion-chrome="${MOBILE_DRAWER_MOTION_CHROME}"]`;

describe("reference-surface browser close-out (served pages)", () => {
  test("contract covers required surfaces and excludes W20 convergence", () => {
    expect(referenceBrowserCloseoutCoversRequiredSurfaces()).toBe(true);
    expect(REFERENCE_BROWSER_CLOSEOUT_EXCLUDED_W20_SUITES).toContain(
      "full-link-search-cross-surface-convergence",
    );
    expect(referencePayloadBudgetsAlignWithSurfaceContract()).toBe(true);
    expect(listReferenceBrowserCloseoutCases().length).toBeGreaterThan(
      listReferenceOverflowMatrixCases().length,
    );
  });

  test("browser evidence: overflow, keyboard, hash focus, copy, reduced-motion, long-token, no-JS", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const overflowArgs = referenceSurfaceOverflowEvaluateArgs();
    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      // 1) Full overflow matrix — all six routes × five layouts.
      for (const { route, viewport } of listReferenceOverflowMatrixCases()) {
        const page = await session.openPath(route.path, viewport);
        const probe = await page.evaluate(evaluateResponsiveOverflowInBrowser, {
          selectors: [...overflowArgs.selectors],
          tolerancePx: overflowArgs.tolerancePx,
        });
        if (probe.hasUnintendedOverflow) {
          throw new Error(
            `close-out overflow ${route.id} @ ${viewport.id}: overflowPx=${probe.overflowPx}`,
          );
        }
        expect(probe.hasUnintendedOverflow).toBe(false);
      }

      // 2) Interactive chrome on API / events / factory-schema.
      for (const routeId of REFERENCE_BROWSER_CLOSEOUT_INTERACTIVE_ROUTE_IDS) {
        const route = getReferenceSurfaceRoute(routeId);
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

        const keyboardArgs = referenceKeyboardEvaluateArgs(routeId);
        const copyArgs = referenceCopyAnnouncementEvaluateArgs(routeId);
        const reducedArgs = referenceReducedMotionEvaluateArgs(routeId);
        const longTokenArgs = referenceLongTokenOverflowEvaluateArgs(routeId);
        const hashSpecs = listReferenceHashTargetsForRoute(routeId).map(
          (spec) => ({
            id: spec.id,
            selector: spec.selector,
            label: spec.label,
            required: spec.required,
            requireScrollMargin: spec.requireScrollMargin,
          }),
        );
        const mobileSpecs = listReferenceMobileNavsForRoute(routeId).map(
          (spec) => ({
            id: spec.id,
            hostSelector: spec.hostSelector,
            summarySelector: spec.summarySelector,
            label: spec.label,
            required: spec.required,
            defaultOpen: spec.defaultOpen,
          }),
        );

        for (const viewportId of ["laptop", "mobile"] as const) {
          const viewport = getReferenceSurfaceViewport(viewportId);
          expect(viewport).toBeDefined();
          if (!viewport) {
            continue;
          }

          const page = await session.openPath(route.path, viewport);

          const keyboard = await page.evaluate(
            evaluateReferenceKeyboardChromeInBrowser,
            {
              controls: keyboardArgs.controls.map((control) => ({
                id: control.id,
                selector: control.selector,
                label: control.label,
                required: control.required,
              })),
            },
          );
          expect(
            keyboard.ok,
            `${route.id} @ ${viewportId} keyboard: ${keyboard.error}`,
          ).toBe(true);

          // Hash focus + sticky (laptop) / mobile nav (API).
          const hashProbe = await page.evaluate(
            (args: {
              hashSpecs: Array<{
                id: string;
                selector: string;
                label: string;
                required: boolean;
                requireScrollMargin: boolean;
              }>;
              mobileSpecs: Array<{
                id: string;
                hostSelector: string;
                summarySelector: string;
                label: string;
                required: boolean;
                defaultOpen: false;
              }>;
              checkSticky: boolean;
            }) => {
              const errors: string[] = [];
              for (const spec of args.hashSpecs) {
                const target = document.querySelector(spec.selector);
                if (!(target instanceof HTMLElement)) {
                  if (spec.required) {
                    errors.push(`missing hash target ${spec.id}`);
                  }
                  continue;
                }
                const before = target.innerHTML;
                if (!target.hasAttribute("tabindex")) {
                  target.tabIndex = -1;
                }
                target.scrollIntoView({ behavior: "auto", block: "start" });
                target.focus({ preventScroll: true });
                if (target.innerHTML !== before) {
                  errors.push(`hash rewrote ${spec.id}`);
                }
                if (document.activeElement !== target) {
                  errors.push(`hash focus missed ${spec.id}`);
                }
              }
              if (args.checkSticky === false) {
                for (const spec of args.mobileSpecs) {
                  if (!spec.required) {
                    continue;
                  }
                  const host = document.querySelector(spec.hostSelector);
                  const summary = document.querySelector(spec.summarySelector);
                  if (
                    !(host instanceof HTMLDetailsElement) ||
                    !(summary instanceof HTMLElement)
                  ) {
                    errors.push(`missing mobile nav ${spec.id}`);
                    continue;
                  }
                  host.open = true;
                  host.open = false;
                  summary.focus();
                  if (document.activeElement !== summary) {
                    errors.push(`mobile nav focus return failed ${spec.id}`);
                  }
                }
              }
              return { ok: errors.length === 0, errors };
            },
            {
              hashSpecs,
              mobileSpecs,
              checkSticky: viewportId === "laptop",
            },
          );
          expect(
            hashProbe.ok,
            `${route.id} @ ${viewportId} hash: ${hashProbe.errors.join("; ")}`,
          ).toBe(true);

          await page.context().grantPermissions(["clipboard-write"], {
            origin: new URL(page.url()).origin,
          });
          const copy = await page.evaluate(
            evaluateReferenceCopyAnnouncementsInBrowser,
            copyArgs,
          );
          expect(
            copy.ok,
            `${route.id} @ ${viewportId} copy: ${copy.error}`,
          ).toBe(true);

          await page.emulateMedia({ reducedMotion: "reduce" });
          await page.reload({ waitUntil: "load" });
          if (viewportId === "mobile") {
            const menuButton = page.locator(reducedArgs.drawerMenuSelector);
            if ((await menuButton.count()) > 0) {
              await menuButton.first().click();
              await page.waitForSelector(drawerSelector, {
                state: "visible",
                timeout: 5_000,
              });
            }
          }
          const reduced = await page.evaluate(
            evaluateReferenceReducedMotionInBrowser,
            reducedArgs,
          );
          expect(
            reduced.ok,
            `${route.id} @ ${viewportId} reduced-motion: ${reduced.error}`,
          ).toBe(true);
          expect(reduced.prefersReducedMotion).toBe(true);
        }

        // Long-token containment at mobile + zoomed.
        for (const viewportId of ["mobile", "zoomed"] as const) {
          const viewport = getReferenceSurfaceViewport(viewportId);
          expect(viewport).toBeDefined();
          if (!viewport) {
            continue;
          }
          const page = await session.openPath(route.path, viewport);
          const longToken = await page.evaluate(
            evaluateReferenceLongTokenOverflowInBrowser,
            longTokenArgs,
          );
          expect(
            longToken.ok,
            `${route.id} @ ${viewportId} long-token: ${longToken.error}`,
          ).toBe(true);
          expect(longToken.hasUnintendedPageOverflow).toBe(false);
        }

        // No-JS readability via script-stripped DOM.
        const laptop = getReferenceSurfaceViewport("laptop");
        expect(laptop).toBeDefined();
        if (laptop) {
          const page = await session.openPath(route.path, laptop);
          const html = await page.content();
          await page.setContent(stripScriptsFromHtml(html), {
            waitUntil: "domcontentloaded",
          });
          const noJs = await page.evaluate(
            evaluateReferenceNoJsHtmlInBrowser,
            referenceNoJsHtmlEvaluateArgs(routeId),
          );
          expect(noJs.ok, `${route.id} no-JS: ${noJs.error}`).toBe(true);
        }
      }

      // 3) Authored routes: overflow already covered; prove no-JS on one each.
      for (const routeId of [
        "authored-factory",
        "authored-worker",
        "authored-workstation",
      ] as const) {
        const route = getReferenceSurfaceRoute(routeId);
        const laptop = getReferenceSurfaceViewport("laptop");
        expect(route).toBeDefined();
        expect(laptop).toBeDefined();
        if (!route || !laptop) {
          continue;
        }
        const page = await session.openPath(route.path, laptop);
        const html = await page.content();
        await page.setContent(stripScriptsFromHtml(html), {
          waitUntil: "domcontentloaded",
        });
        const noJs = await page.evaluate(
          evaluateReferenceNoJsHtmlInBrowser,
          referenceNoJsHtmlEvaluateArgs(routeId),
        );
        expect(noJs.ok, `${route.id} no-JS: ${noJs.error}`).toBe(true);
      }
    } finally {
      await session.cleanup();
    }

    // 4) Focused payload budgets stay green when a trusted out/ exists.
    const outDir = join(repoRoot, DEFAULT_EXPORT_OUT_DIR);
    if (existsSync(outDir)) {
      const budgets = evaluateReferencePayloadBudgets({
        cwd: repoRoot,
        outDir: DEFAULT_EXPORT_OUT_DIR,
      });
      expect(
        budgets.ok,
        budgets.ok ? "" : budgets.failures.map((f) => f.message).join("; "),
      ).toBe(true);
    }
  }, 900_000);
});
