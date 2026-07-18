/**
 * Opt-in served-page W19 reference screen-reader / axe probe.
 * Runs when VERIFY_PRODUCTION_INTEGRATION_TESTS=1 and a fresh `.next` exists
 * (same gate as the critical-route / reference overflow matrices).
 */

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { expectNoSeriousAxeOnPlaywrightPage } from "./a11y-playwright-axe";
import {
  REFERENCE_SURFACE_ROUTES,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";
import {
  listReferenceLabeledControlsForRoute,
  listReferenceNonColorStatusForRoute,
  openReferenceSurfaceBrowserSession,
} from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

/** Routes with required labeled + non-color chrome for story 005. */
const SCREEN_READER_ROUTE_IDS: readonly ReferenceSurfaceRouteId[] = [
  "references-api",
  "references-events",
  "references-factory-schema",
] as const;

const SCREEN_READER_VIEWPORTS = [
  { id: "laptop" as const, width: 1024, height: 768 },
  { id: "mobile" as const, width: 390, height: 844 },
] as const;

describe("reference-surface screen-reader chrome (served pages)", () => {
  test("API, events, and factory-schema expose labels, non-color status, coherent headings, and no serious axe violations", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      for (const routeId of SCREEN_READER_ROUTE_IDS) {
        const route = REFERENCE_SURFACE_ROUTES.find(
          (entry) => entry.id === routeId,
        );
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

        const labeledSpecs = listReferenceLabeledControlsForRoute(routeId).map(
          (spec) => ({
            id: spec.id,
            selector: spec.selector,
            label: spec.label,
            required: spec.required,
            namePatternSource: spec.namePattern?.source ?? null,
            namePatternFlags: spec.namePattern?.flags ?? null,
          }),
        );
        const statusSpecs = listReferenceNonColorStatusForRoute(routeId).map(
          (spec) => ({
            id: spec.id,
            selector: spec.selector,
            label: spec.label,
            required: spec.required,
            textPatternSource: spec.textPattern.source,
            textPatternFlags: spec.textPattern.flags,
          }),
        );

        for (const viewport of SCREEN_READER_VIEWPORTS) {
          const page = await session.openPath(route.path, viewport);

          const structure = await page.evaluate(
            (args: {
              labeledSpecs: Array<{
                id: string;
                selector: string;
                label: string;
                required: boolean;
                namePatternSource: string | null;
                namePatternFlags: string | null;
              }>;
              statusSpecs: Array<{
                id: string;
                selector: string;
                label: string;
                required: boolean;
                textPatternSource: string;
                textPatternFlags: string;
              }>;
            }) => {
              function accessibleName(element: Element): string {
                const ariaLabel = element.getAttribute("aria-label")?.trim();
                if (ariaLabel) {
                  return ariaLabel;
                }
                const labelledBy = element.getAttribute("aria-labelledby");
                if (labelledBy) {
                  const parts = labelledBy
                    .split(/\s+/)
                    .map(
                      (id) =>
                        document.getElementById(id)?.textContent?.trim() ?? "",
                    )
                    .filter(Boolean);
                  if (parts.length > 0) {
                    return parts.join(" ");
                  }
                }
                const htmlElement = element as HTMLElement & {
                  labels?: NodeListOf<HTMLLabelElement> | null;
                };
                if (htmlElement.labels && htmlElement.labels.length > 0) {
                  const fromLabels = Array.from(htmlElement.labels)
                    .map((label) =>
                      (label.textContent ?? "").replace(/\s+/g, " ").trim(),
                    )
                    .filter(Boolean)
                    .join(" ");
                  if (fromLabels) {
                    return fromLabels;
                  }
                }
                const id = element.getAttribute("id");
                if (id) {
                  const forLabel = document.querySelector(
                    `label[for="${CSS.escape(id)}"]`,
                  );
                  const fromFor = (forLabel?.textContent ?? "")
                    .replace(/\s+/g, " ")
                    .trim();
                  if (fromFor) {
                    return fromFor;
                  }
                }
                const title = element.getAttribute("title")?.trim();
                if (title) {
                  return title;
                }
                return (element.textContent ?? "").replace(/\s+/g, " ").trim();
              }

              function normalizeCue(element: Element): string {
                const ariaLabel =
                  element.getAttribute("aria-label")?.trim() ?? "";
                const title = element.getAttribute("title")?.trim() ?? "";
                const text = (element.textContent ?? "")
                  .replace(/\s+/g, " ")
                  .trim();
                return [text, ariaLabel, title].filter(Boolean).join(" ");
              }

              const headings = Array.from(
                document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
              );
              const levels = headings
                .map((el) => {
                  const match = /^H([1-6])$/i.exec(el.tagName);
                  return match ? Number(match[1]) : null;
                })
                .filter((level): level is number => level !== null);
              let hasSkippedLevel = false;
              for (let index = 1; index < levels.length; index += 1) {
                const previous = levels[index - 1];
                const current = levels[index];
                if (
                  previous !== undefined &&
                  current !== undefined &&
                  current > previous + 1
                ) {
                  hasSkippedLevel = true;
                  break;
                }
              }
              const h1Count = levels.filter((level) => level === 1).length;

              for (const spec of args.labeledSpecs) {
                const hits = Array.from(
                  document.querySelectorAll(spec.selector),
                );
                if (spec.required && hits.length === 0) {
                  return {
                    ok: false,
                    error: `required labeled control "${spec.label}" missing`,
                    h1Count,
                    hasSkippedLevel,
                    levels,
                  };
                }
                for (const hit of hits) {
                  const name = accessibleName(hit);
                  if (!name) {
                    return {
                      ok: false,
                      error: `control "${spec.label}" missing accessible name`,
                      h1Count,
                      hasSkippedLevel,
                      levels,
                    };
                  }
                  if (spec.namePatternSource) {
                    const pattern = new RegExp(
                      spec.namePatternSource,
                      spec.namePatternFlags ?? undefined,
                    );
                    if (!pattern.test(name)) {
                      return {
                        ok: false,
                        error: `control "${spec.label}" name "${name}" did not match pattern`,
                        h1Count,
                        hasSkippedLevel,
                        levels,
                      };
                    }
                  }
                }
              }

              for (const spec of args.statusSpecs) {
                const hits = Array.from(
                  document.querySelectorAll(spec.selector),
                );
                if (spec.required && hits.length === 0) {
                  return {
                    ok: false,
                    error: `required status "${spec.label}" missing`,
                    h1Count,
                    hasSkippedLevel,
                    levels,
                  };
                }
                const pattern = new RegExp(
                  spec.textPatternSource,
                  spec.textPatternFlags,
                );
                for (const hit of hits) {
                  const cue = normalizeCue(hit);
                  if (!cue || !pattern.test(cue)) {
                    return {
                      ok: false,
                      error: `status "${spec.label}" appears color-only (cue="${cue}")`,
                      h1Count,
                      hasSkippedLevel,
                      levels,
                    };
                  }
                }
              }

              if (h1Count < 1) {
                return {
                  ok: false,
                  error: "expected at least one h1",
                  h1Count,
                  hasSkippedLevel,
                  levels,
                };
              }
              if (hasSkippedLevel) {
                return {
                  ok: false,
                  error: `heading hierarchy skips a level (${levels.join(" → ")})`,
                  h1Count,
                  hasSkippedLevel,
                  levels,
                };
              }

              return {
                ok: true,
                error: null,
                h1Count,
                hasSkippedLevel,
                levels,
              };
            },
            { labeledSpecs, statusSpecs },
          );

          if (!structure.ok) {
            throw new Error(
              `${route.id} @ ${viewport.id}: ${structure.error ?? "screen-reader chrome failed"}`,
            );
          }
          expect(structure.ok).toBe(true);
          expect(structure.h1Count).toBeGreaterThanOrEqual(1);
          expect(structure.hasSkippedLevel).toBe(false);

          await expectNoSeriousAxeOnPlaywrightPage(page);
        }
      }
    } finally {
      await session.cleanup();
    }
  }, 600_000);
});
