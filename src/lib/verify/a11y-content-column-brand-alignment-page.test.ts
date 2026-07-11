import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  BRAND_ALIGNMENT_EXPECTED_BRAND,
  listBrandAlignmentMatrixCases,
  shouldAssertInlineLeftEdgeAlignment,
} from "@/lib/layout/content-column-brand-alignment-coverage";
import {
  assertCriticalLayoutContract,
  CRITICAL_LAYOUT_CHROME_SELECTORS,
  evaluateContentColumnLeftEdgeAlignmentInBrowser,
  evaluateCriticalLayoutSnapshotInBrowser,
  hashLayoutSnapshot,
} from "./a11y-layout-snapshot";
import { PAGE_OVERFLOW_TOLERANCE_PX } from "./a11y-responsive-contract";
import { openA11yResponsiveBrowserSession } from "./a11y-responsive-page-session";
import { shouldRunVerifyProductionIntegrationTests } from "./server-lifecycle";

const repoRoot = join(import.meta.dir, "../../..");

/** Subpixel / rounding tolerance for shared left-edge geometry. */
const LEFT_EDGE_TOLERANCE_PX = 2;

describe("brand + content-column alignment served-page matrix", () => {
  test("brand-alignment routes at mobile/tablet/laptop/wide pass brand, surface, overflow, and left-edge contract", async () => {
    if (!shouldRunVerifyProductionIntegrationTests(repoRoot)) {
      return;
    }

    const cases = listBrandAlignmentMatrixCases();
    expect(cases.length).toBeGreaterThan(0);

    const session = await openA11yResponsiveBrowserSession({
      projectRoot: repoRoot,
    });

    try {
      const hashes: string[] = [];

      for (const { route, viewport } of cases) {
        const page = await session.openPath(route.path, viewport);
        const snapshot = await page.evaluate(
          evaluateCriticalLayoutSnapshotInBrowser,
          {
            overflowTolerancePx: PAGE_OVERFLOW_TOLERANCE_PX,
            chromeSelectors: [...CRITICAL_LAYOUT_CHROME_SELECTORS],
          },
        );

        assertCriticalLayoutContract(snapshot, {
          expectedBrand: BRAND_ALIGNMENT_EXPECTED_BRAND,
          expectedContentColumnSurface: route.contentColumnSurface,
          minPrimaryNavLinks: 1,
        });
        expect(snapshot.brandText).toBe(BRAND_ALIGNMENT_EXPECTED_BRAND);
        expect(snapshot.hasUnintendedPageOverflow).toBe(false);
        expect(snapshot.chromeBoxes.length).toBeGreaterThan(0);

        if (shouldAssertInlineLeftEdgeAlignment(viewport)) {
          const edge = await page.evaluate(
            evaluateContentColumnLeftEdgeAlignmentInBrowser,
            {
              tolerancePx: LEFT_EDGE_TOLERANCE_PX,
            },
          );
          if (!edge.aligned) {
            throw new Error(
              `${route.id} @ ${viewport.id}: header nav left=${edge.headerNavLeft} vs content left=${edge.contentColumnLeft} (delta=${edge.deltaPx})`,
            );
          }
          expect(edge.aligned).toBe(true);
        }

        hashes.push(hashLayoutSnapshot(snapshot));
      }

      // Distinct route/viewport fingerprints should not all collapse.
      expect(new Set(hashes).size).toBeGreaterThan(1);
    } finally {
      await session.cleanup();
    }
  }, 600_000);
});
