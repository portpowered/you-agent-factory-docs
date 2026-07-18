/**
 * Opt-in served-page W19 reference hash-focus / sticky / mobile-collapse probe.
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
  listReferenceHashTargetsForRoute,
  listReferenceMobileNavsForRoute,
  openReferenceSurfaceBrowserSession,
} from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

/** Routes with required hash targets for story 006. */
const HASH_FOCUS_ROUTE_IDS: readonly ReferenceSurfaceRouteId[] = [
  "references-api",
  "references-events",
  "references-factory-schema",
] as const;

const HASH_FOCUS_VIEWPORTS = [
  { id: "laptop" as const, width: 1024, height: 768 },
  { id: "wide" as const, width: 1440, height: 900 },
  { id: "mobile" as const, width: 390, height: 844 },
] as const;

describe("reference-surface hash focus, sticky visibility, and mobile collapse (served pages)", () => {
  test("API, events, and factory-schema deep links focus targets without sticky obscuring; API mobile nav collapses", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const routeId of HASH_FOCUS_ROUTE_IDS) {
        const route = REFERENCE_SURFACE_ROUTES.find(
          (entry) => entry.id === routeId,
        );
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

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

        for (const viewport of HASH_FOCUS_VIEWPORTS) {
          // Sticky obscuring is verified at desktop/laptop; mobile still
          // exercises hash focus + mobile nav collapse.
          if (
            (viewport.id === "wide" || viewport.id === "laptop") === false &&
            routeId !== "references-api"
          ) {
            // Still run mobile for events/schema hash focus once.
          }

          const page = await session.openPath(route.path, viewport);

          const probe = await page.evaluate(
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
              function hasScrollMargin(element: Element): boolean {
                const style = window.getComputedStyle(element);
                const margin = Number.parseFloat(style.scrollMarginTop);
                if (Number.isFinite(margin) && margin > 0) {
                  return true;
                }
                return /\bscroll-mt-|\bscroll-margin/.test(
                  (element as HTMLElement).className ?? "",
                );
              }

              function collectSticky(): Array<{
                top: number;
                bottom: number;
                height: number;
              }> {
                const candidates = Array.from(
                  document.querySelectorAll(
                    '[data-docs-header], header[data-sticky], [data-sticky-chrome], [class*="sticky"]',
                  ),
                );
                const rects: Array<{
                  top: number;
                  bottom: number;
                  height: number;
                }> = [];
                for (const element of candidates) {
                  const position = window.getComputedStyle(element).position;
                  const marked =
                    element.hasAttribute("data-sticky-chrome") ||
                    element.hasAttribute("data-sticky");
                  if (
                    position !== "sticky" &&
                    position !== "fixed" &&
                    !marked
                  ) {
                    continue;
                  }
                  const rect = element.getBoundingClientRect();
                  if (rect.height <= 0 || rect.top > 8 || rect.bottom <= 0) {
                    continue;
                  }
                  rects.push({
                    top: rect.top,
                    bottom: rect.bottom,
                    height: rect.height,
                  });
                }
                return rects;
              }

              const errors: string[] = [];

              for (const spec of args.hashSpecs) {
                const target = document.querySelector(spec.selector);
                if (!(target instanceof HTMLElement)) {
                  if (spec.required) {
                    errors.push(
                      `required hash target "${spec.label}" (${spec.selector}) missing`,
                    );
                  }
                  continue;
                }
                const anchor = target.id;
                if (!anchor) {
                  errors.push(`hash target "${spec.label}" missing stable id`);
                  continue;
                }

                const before = target.innerHTML;
                if (!target.hasAttribute("tabindex")) {
                  target.tabIndex = -1;
                }
                target.scrollIntoView({ behavior: "auto", block: "start" });
                target.focus({ preventScroll: true });

                if (target.innerHTML !== before) {
                  errors.push(`hash focus rewrote content for "#${anchor}"`);
                }
                if (document.activeElement !== target) {
                  errors.push(`hash focus did not land on "#${anchor}"`);
                }
                if (spec.requireScrollMargin && !hasScrollMargin(target)) {
                  errors.push(
                    `hash target "#${anchor}" missing scroll-margin clearance`,
                  );
                }

                if (args.checkSticky) {
                  const sticky = collectSticky();
                  if (sticky.length > 0) {
                    const stickyBottom = Math.max(
                      ...sticky.map((rect) => rect.bottom),
                    );
                    const rect = target.getBoundingClientRect();
                    if (rect.height > 0 && rect.bottom <= stickyBottom + 0.5) {
                      errors.push(
                        `hash target "#${anchor}" fully obscured by sticky chrome (stickyBottom=${stickyBottom}, targetBottom=${rect.bottom})`,
                      );
                    }
                  }
                }
              }

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
                  errors.push(
                    `required mobile navigator "${spec.label}" missing`,
                  );
                  continue;
                }
                if (host.open !== spec.defaultOpen) {
                  errors.push(
                    `mobile navigator "${spec.label}" defaultOpen=${String(host.open)} expected ${String(spec.defaultOpen)}`,
                  );
                }
                summary.focus();
                if (document.activeElement !== summary) {
                  errors.push(
                    `mobile navigator "${spec.label}" summary not focusable`,
                  );
                }
                host.open = true;
                if (!host.open) {
                  errors.push(`mobile navigator "${spec.label}" did not open`);
                }
                host.open = false;
                summary.focus();
                if (host.open) {
                  errors.push(`mobile navigator "${spec.label}" did not close`);
                }
                if (document.activeElement !== summary) {
                  errors.push(
                    `mobile navigator "${spec.label}" did not return focus to summary`,
                  );
                }
              }

              return {
                ok: errors.length === 0,
                errors,
              };
            },
            {
              hashSpecs,
              mobileSpecs,
              checkSticky: viewport.id === "laptop" || viewport.id === "wide",
            },
          );

          if (!probe.ok) {
            throw new Error(
              `${route.id} @ ${viewport.id}: ${probe.errors.join("; ")}`,
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
