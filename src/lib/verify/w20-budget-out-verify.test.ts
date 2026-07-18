/**
 * W20 story 008: verify a trusted `out/` against total-site and focused
 * reference payload budgets after the `make budget` command gate.
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_EXPORT_OUT_DIR } from "@/lib/build/export-out-directory";
import {
  evaluateExportedSiteBudget,
  FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
} from "@/lib/build/exported-site-budget";
import {
  evaluateReferencePayloadBudgets,
  REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS,
} from "./a11y-reference-payload-budget";
import { W20_BUDGET_SUITE_COMMAND } from "./w20-budget-convergence";

const repoRoot = join(import.meta.dir, "../../..");
const outDir = join(repoRoot, DEFAULT_EXPORT_OUT_DIR);

describe("W20 budget out/ verify", () => {
  test("trusted out/ stays under total-site and focused reference ceilings", () => {
    expect(existsSync(outDir)).toBe(true);

    const totalSite = evaluateExportedSiteBudget({
      outDir: DEFAULT_EXPORT_OUT_DIR,
      cwd: repoRoot,
    });

    if (!totalSite.ok) {
      throw new Error(
        [
          "Total-site budget evaluation failed against trusted out/.",
          ...totalSite.failures.map((failure) => failure.message),
          `Reproduce with: ${W20_BUDGET_SUITE_COMMAND}`,
          "or: make build && make budget",
        ].join("\n"),
      );
    }

    expect(totalSite.measurement).not.toBeNull();
    expect(totalSite.measurement?.totalOutBytes).toBeLessThanOrEqual(
      FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxTotalOutBytes,
    );
    expect(totalSite.measurement?.nextStaticJsBytes).toBeLessThanOrEqual(
      FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxNextStaticJsBytes,
    );
    expect(totalSite.measurement?.searchBootstrapBytes).toBeLessThanOrEqual(
      FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes,
    );

    const focused = evaluateReferencePayloadBudgets({
      outDir: DEFAULT_EXPORT_OUT_DIR,
      cwd: repoRoot,
    });

    if (!focused.ok) {
      throw new Error(
        [
          "Focused reference payload budget evaluation failed against trusted out/.",
          ...focused.failures.map((failure) => failure.message),
          `Reproduce with: ${W20_BUDGET_SUITE_COMMAND}`,
          "or: make build && make budget",
        ].join("\n"),
      );
    }

    expect(focused.measurements).toHaveLength(
      REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS.length,
    );
    for (const routeId of REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS) {
      expect(
        focused.measurements.some(
          (measurement) => measurement.routeId === routeId,
        ),
      ).toBe(true);
    }
  });
});
