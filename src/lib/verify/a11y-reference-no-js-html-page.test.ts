/**
 * Opt-in W19 reference no-JS / static HTML readability probe.
 *
 * Prefers script-stripped static-export HTML under `out/` (or VERIFY_BASE_URL
 * served pages with JavaScript disabled). Same gate as other reference page
 * probes: VERIFY_PRODUCTION_INTEGRATION_TESTS=1 + fresh `.next` (or an
 * existing trusted `out/` when VERIFY_BASE_URL points at a static export).
 */

import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  resolveExportHtmlFilePath,
} from "@/lib/build/export-out-directory";
import {
  evaluateReferenceNoJsHtmlInBrowser,
  expectReferenceNoJsHtmlReadability,
  REFERENCE_NO_JS_ROUTE_IDS,
  referenceNoJsHtmlEvaluateArgs,
  stripScriptsFromHtml,
} from "./a11y-reference-no-js-html-contract";
import {
  getReferenceSurfaceRoute,
  REFERENCE_SURFACE_ROUTES,
} from "./a11y-reference-surface-contract";
import { openReferenceSurfaceBrowserSession } from "./a11y-reference-surface-probes";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

describe("reference-surface no-JS static HTML (served / export)", () => {
  test("exported HTML keeps essential facts after scripts are stripped", () => {
    // Runs whenever a trusted local `out/` exists (after `make build`). Does
    // not require VERIFY_PRODUCTION_INTEGRATION_TESTS — script-stripped HTML
    // fetch is the primary no-JS proof.
    const outDir = join(repoRoot, DEFAULT_EXPORT_OUT_DIR);
    if (!existsSync(outDir)) {
      return;
    }

    for (const routeId of REFERENCE_NO_JS_ROUTE_IDS) {
      const route = getReferenceSurfaceRoute(routeId);
      expect(route).toBeDefined();
      if (!route) {
        continue;
      }

      const htmlPath = resolveExportHtmlFilePath(outDir, route.path, repoRoot);
      expect(
        existsSync(htmlPath),
        `missing export HTML for ${route.path} at ${htmlPath}`,
      ).toBe(true);

      const raw = readFileSync(htmlPath, "utf8");
      const stripped = stripScriptsFromHtml(raw);
      expect(stripped).not.toMatch(/<script\b/i);

      const bodyMatch = stripped.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      document.body.innerHTML = bodyMatch?.[1] ?? stripped;

      const probe = expectReferenceNoJsHtmlReadability(document, routeId);
      expect(probe.ok, `${route.path}: ${probe.error}`).toBe(true);
      expect(probe.scriptsAbsent).toBe(true);

      const required = probe.facts.filter((entry) => entry.required);
      expect(required.length).toBeGreaterThan(0);
      for (const fact of required) {
        expect(
          fact.readableHitCount,
          `${route.path}: ${fact.id} readableHits`,
        ).toBeGreaterThanOrEqual(fact.minHits);
      }
    }
  });

  test("Playwright session with JavaScript disabled keeps essential facts", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const session = await openReferenceSurfaceBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      // Probe the three primary reference routes at laptop width; authored
      // pages are covered by the export HTML strip test above.
      const routeIds = [
        "references-api",
        "references-events",
        "references-factory-schema",
      ] as const;

      for (const routeId of routeIds) {
        const route = REFERENCE_SURFACE_ROUTES.find(
          (entry) => entry.id === routeId,
        );
        expect(route).toBeDefined();
        if (!route) {
          continue;
        }

        const page = await session.openPath(route.path, {
          width: 1024,
          height: 768,
        });

        // Prefer script-stripped setContent of the current DOM so hydration
        // cannot replace SSR contract text (matches W19 browser-verify pattern).
        const html = await page.content();
        const stripped = stripScriptsFromHtml(html);
        await page.setContent(stripped, { waitUntil: "domcontentloaded" });

        const probe = await page.evaluate(
          evaluateReferenceNoJsHtmlInBrowser,
          referenceNoJsHtmlEvaluateArgs(routeId),
        );

        expect(probe.ok, `${route.path}: ${probe.error}`).toBe(true);
        expect(probe.scriptsAbsent).toBe(true);
        const required = probe.facts.filter((entry) => entry.required);
        expect(required.length).toBeGreaterThan(0);
        for (const fact of required) {
          expect(
            fact.readableHitCount,
            `${route.path}: ${fact.id}`,
          ).toBeGreaterThanOrEqual(fact.minHits);
        }
      }
    } finally {
      await session.cleanup();
    }
  }, 600_000);
});
