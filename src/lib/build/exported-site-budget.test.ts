import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  EXPORTED_SITE_BUDGET_COMMAND,
  evaluateExportedSiteBudget,
  evaluateExportedSiteBudgetMeasurement,
  FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
  formatExportedSiteBudgetFailureReport,
  formatExportedSiteBudgetPassReport,
  measureExportedSiteBudget,
} from "./exported-site-budget";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function createExportFixture(options?: {
  jsBytes?: number;
  searchBytes?: number;
  extraHtmlBytes?: number;
  omitJs?: boolean;
  omitSearch?: boolean;
}): { cwd: string; outDir: string } {
  const cwd = mkdtempSync(join(tmpdir(), "exported-site-budget-"));
  tempDirs.push(cwd);
  const outDir = join(cwd, "out");
  mkdirSync(join(outDir, "_next", "static", "chunks"), { recursive: true });
  mkdirSync(join(outDir, "api"), { recursive: true });

  writeFileSync(
    join(outDir, "index.html"),
    `<html><body>${"h".repeat(options?.extraHtmlBytes ?? 32)}</body></html>`,
  );

  if (!options?.omitJs) {
    writeFileSync(
      join(outDir, "_next", "static", "chunks", "app.js"),
      "x".repeat(options?.jsBytes ?? 1_000),
    );
  }

  if (!options?.omitSearch) {
    writeFileSync(
      join(outDir, "api", "search"),
      "s".repeat(options?.searchBytes ?? 500),
    );
    writeFileSync(
      join(outDir, "api", "search.ja"),
      "j".repeat(Math.floor((options?.searchBytes ?? 500) / 2)),
    );
  }

  return { cwd, outDir: "out" };
}

describe("exported-site-budget baselines", () => {
  test("declares factory-specific numeric baselines and a reproduction command", () => {
    expect(EXPORTED_SITE_BUDGET_COMMAND).toBe("make budget");
    expect(FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxTotalOutBytes).toBe(
      170_000_000,
    );
    expect(FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxNextStaticJsBytes).toBe(
      3_500_000,
    );
    expect(FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes).toBe(
      5_800_000,
    );
  });
});

describe("exported-site-budget measurement", () => {
  test("measures total out/, Next static JS, and search bootstrap payloads", () => {
    const { cwd, outDir } = createExportFixture({
      jsBytes: 2_000,
      searchBytes: 800,
      extraHtmlBytes: 40,
    });

    const measurement = measureExportedSiteBudget(outDir, cwd);

    expect(measurement.fileCount).toBe(4);
    expect(measurement.nextStaticJsFileCount).toBe(1);
    expect(measurement.nextStaticJsBytes).toBe(2_000);
    expect(measurement.largestNextStaticJsPath).toBe(
      "/_next/static/chunks/app.js",
    );
    expect(measurement.searchBootstrapPaths).toEqual([
      "/api/search",
      "/api/search.ja",
    ]);
    expect(measurement.searchBootstrapBytes).toBe(800 + 400);
    expect(measurement.totalOutBytes).toBeGreaterThan(
      measurement.nextStaticJsBytes + measurement.searchBootstrapBytes,
    );
  });
});

describe("exported-site-budget evaluation", () => {
  test("passes when the export stays within factory baselines", () => {
    const { cwd, outDir } = createExportFixture();
    const evaluation = evaluateExportedSiteBudget({ cwd, outDir });

    expect(evaluation.ok).toBe(true);
    expect(evaluation.failures).toEqual([]);
    expect(evaluation.summaryLines.length).toBe(3);
    expect(formatExportedSiteBudgetPassReport(evaluation)).toContain(
      "Exported-site budget gate: PASS",
    );
    expect(formatExportedSiteBudgetPassReport(evaluation)).toContain(
      "limit 170.00 MB",
    );
  });

  test("fails closed when the export directory is missing", () => {
    const cwd = mkdtempSync(join(tmpdir(), "exported-site-budget-missing-"));
    tempDirs.push(cwd);

    const evaluation = evaluateExportedSiteBudget({ cwd, outDir: "out" });

    expect(evaluation.ok).toBe(false);
    expect(evaluation.measurement).toBeNull();
    expect(evaluation.failures[0]?.dimension).toBe("exportDirectory");
    expect(formatExportedSiteBudgetFailureReport(evaluation)).toContain(
      "Reproduce locally with: make budget",
    );
  });

  test("fails when Next static JS exceeds the baseline", () => {
    const { cwd, outDir } = createExportFixture({
      jsBytes: FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxNextStaticJsBytes + 1,
    });
    const evaluation = evaluateExportedSiteBudget({ cwd, outDir });

    expect(evaluation.ok).toBe(false);
    expect(
      evaluation.failures.some(
        (failure) => failure.dimension === "nextStaticJsBytes",
      ),
    ).toBe(true);
    expect(formatExportedSiteBudgetFailureReport(evaluation)).toContain(
      "nextStaticJsBytes",
    );
  });

  test("fails when search bootstrap exceeds the baseline", () => {
    const evaluation = evaluateExportedSiteBudgetMeasurement({
      outDir: "out",
      totalOutBytes: 10_000,
      fileCount: 3,
      nextStaticJsBytes: 100,
      nextStaticJsFileCount: 1,
      largestNextStaticJsPath: "/_next/static/chunks/app.js",
      largestNextStaticJsBytes: 100,
      searchBootstrapBytes:
        FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes + 1,
      searchBootstrapPaths: ["/api/search"],
    });

    expect(evaluation.ok).toBe(false);
    expect(evaluation.failures).toEqual([
      {
        dimension: "searchBootstrapBytes",
        message: `expected searchBootstrapBytes<=${FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes}, received ${FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxSearchBootstrapBytes + 1}`,
      },
    ]);
  });

  test("fails when total out/ exceeds the baseline", () => {
    const evaluation = evaluateExportedSiteBudgetMeasurement({
      outDir: "out",
      totalOutBytes:
        FACTORY_EXPORTED_SITE_BUDGET_BASELINES.maxTotalOutBytes + 1,
      fileCount: 10,
      nextStaticJsBytes: 100,
      nextStaticJsFileCount: 1,
      largestNextStaticJsPath: "/_next/static/chunks/app.js",
      largestNextStaticJsBytes: 100,
      searchBootstrapBytes: 50,
      searchBootstrapPaths: ["/api/search"],
    });

    expect(evaluation.ok).toBe(false);
    expect(evaluation.failures[0]?.dimension).toBe("totalOutBytes");
  });

  test("fails when required JS or search surfaces are missing", () => {
    const { cwd, outDir } = createExportFixture({
      omitJs: true,
      omitSearch: true,
    });
    const evaluation = evaluateExportedSiteBudget({ cwd, outDir });

    expect(evaluation.ok).toBe(false);
    expect(
      evaluation.failures.map((failure) => failure.dimension).sort(),
    ).toEqual(["nextStaticJsPresent", "searchBootstrapPresent"]);
  });
});
