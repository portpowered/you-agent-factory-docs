import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportHtmlRelativePath } from "@/lib/build/export-out-directory";
import {
  evaluateReferencePayloadBudgetMeasurements,
  evaluateReferencePayloadBudgets,
  extractReferencedScriptUrls,
  filterNextStaticJsUrls,
  formatReferencePayloadBudgetFailureReport,
  formatReferencePayloadBudgetPassReport,
  getReferencePayloadPageBudget,
  measureReferencePayloadBudgets,
  measureReferencePayloadPage,
  REFERENCE_PAYLOAD_BUDGET_COMMAND,
  REFERENCE_PAYLOAD_BUDGET_MEASUREMENT_METHOD,
  REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS,
  REFERENCE_PAYLOAD_PAGE_BUDGETS,
  referencePayloadBudgetsAlignWithSurfaceContract,
  utf8ByteLength,
} from "./a11y-reference-payload-budget";
import { REFERENCE_SURFACE_ROUTES } from "./a11y-reference-surface-contract";

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
  apiHtmlBytes?: number;
  eventsHtmlBytes?: number;
  schemaHtmlBytes?: number;
  jsBytes?: number;
  omitApi?: boolean;
  omitJsFile?: boolean;
}): { cwd: string; outDir: string } {
  const cwd = mkdtempSync(join(tmpdir(), "reference-payload-budget-"));
  tempDirs.push(cwd);
  const outDir = join(cwd, "out");
  mkdirSync(join(outDir, "_next", "static", "chunks"), { recursive: true });

  writeFileSync(join(outDir, "index.html"), "<html><body>home</body></html>");

  const scriptSrc = "/_next/static/chunks/app.js";
  const scriptTag = `<script src="${scriptSrc}"></script>`;

  if (!options?.omitJsFile) {
    writeFileSync(
      join(outDir, "_next", "static", "chunks", "app.js"),
      "x".repeat(options?.jsBytes ?? 1_000),
    );
  }

  const pages: Array<{
    file: string;
    bytes: number;
    omit?: boolean;
  }> = [
    {
      file: exportHtmlRelativePath("/docs/references/api"),
      bytes: options?.apiHtmlBytes ?? 1_000,
      omit: options?.omitApi,
    },
    {
      file: exportHtmlRelativePath("/docs/references/events"),
      bytes: options?.eventsHtmlBytes ?? 1_000,
    },
    {
      file: exportHtmlRelativePath("/docs/references/factory-schema"),
      bytes: options?.schemaHtmlBytes ?? 1_000,
    },
  ];

  for (const page of pages) {
    if (page.omit) continue;
    const absolute = join(outDir, page.file);
    mkdirSync(join(absolute, ".."), { recursive: true });
    const filler = "h".repeat(Math.max(0, page.bytes - scriptTag.length - 26));
    writeFileSync(absolute, `<html><body>${filler}${scriptTag}</body></html>`);
  }

  return { cwd, outDir: "out" };
}

describe("reference payload budget baselines", () => {
  test("records API/events/factory-schema baselines from prior export evidence", () => {
    expect(REFERENCE_PAYLOAD_BUDGET_COMMAND).toBe("make budget");
    expect(REFERENCE_PAYLOAD_BUDGET_MEASUREMENT_METHOD.buildMode).toBe(
      "static-export-out",
    );
    expect(
      REFERENCE_PAYLOAD_BUDGET_MEASUREMENT_METHOD.definitions.htmlBytes.length,
    ).toBeGreaterThan(20);
    expect(
      REFERENCE_PAYLOAD_BUDGET_MEASUREMENT_METHOD.definitions.jsPayloadBytes
        .length,
    ).toBeGreaterThan(20);
    expect(
      REFERENCE_PAYLOAD_BUDGET_MEASUREMENT_METHOD.baselineSource.measuredAtUtc,
    ).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS).toEqual([
      "references-api",
      "references-events",
      "references-factory-schema",
    ]);

    const byId = Object.fromEntries(
      REFERENCE_PAYLOAD_PAGE_BUDGETS.map((entry) => [entry.routeId, entry]),
    );

    expect(byId["references-api"]?.measuredHtmlBytes).toBe(10_258_887);
    expect(byId["references-api"]?.maxHtmlBytes).toBe(13_000_000);
    expect(byId["references-events"]?.measuredHtmlBytes).toBe(2_076_020);
    expect(byId["references-events"]?.maxHtmlBytes).toBe(2_600_000);
    expect(byId["references-factory-schema"]?.measuredHtmlBytes).toBe(
      1_997_920,
    );
    expect(byId["references-factory-schema"]?.maxHtmlBytes).toBe(2_500_000);

    for (const entry of REFERENCE_PAYLOAD_PAGE_BUDGETS) {
      expect(entry.maxHtmlBytes).toBeGreaterThan(entry.measuredHtmlBytes);
      expect(entry.maxJsPayloadBytes).toBeGreaterThan(
        entry.measuredJsPayloadBytes,
      );
      expect(entry.maxJsPayloadBytes).toBe(2_500_000);
    }
  });

  test("aligned with the shared W19 reference surface contract paths", () => {
    expect(referencePayloadBudgetsAlignWithSurfaceContract()).toBe(true);

    for (const routeId of REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS) {
      const budget = getReferencePayloadPageBudget(routeId);
      const surface = REFERENCE_SURFACE_ROUTES.find(
        (route) => route.id === routeId,
      );
      expect(budget?.path).toBe(surface?.path);
    }
  });
});

describe("reference payload script URL helpers", () => {
  test("extracts and filters Next static JS URLs", () => {
    const html = `
      <script src="/_next/static/chunks/a.js"></script>
      <script src="https://cdn.example/vendor.js"></script>
      <script src="/_next/static/chunks/app/%5B%5B...slug%5D%5D/page.js"></script>
    `;
    const urls = extractReferencedScriptUrls(html, "http://127.0.0.1");
    const nextOnly = filterNextStaticJsUrls(urls);
    expect(nextOnly).toHaveLength(2);
    expect(utf8ByteLength("héllo")).toBe(6);
  });
});

describe("reference payload measurement and evaluation", () => {
  test("measures HTML and attributable JS from an export fixture", () => {
    const { cwd, outDir } = createExportFixture({
      apiHtmlBytes: 2_000,
      eventsHtmlBytes: 3_000,
      schemaHtmlBytes: 1_500,
      jsBytes: 4_000,
    });

    const measurements = measureReferencePayloadBudgets(outDir, cwd);
    expect(measurements).toHaveLength(3);

    const api = measurements.find((row) => row.routeId === "references-api");
    expect(api?.htmlBytes).toBeGreaterThan(1_500);
    expect(api?.jsPayloadBytes).toBe(4_000);
    expect(api?.jsScriptCount).toBe(1);
    expect(api?.missingScriptPaths).toEqual([]);

    const evaluation = evaluateReferencePayloadBudgetMeasurements(measurements);
    expect(evaluation.ok).toBe(true);
    expect(formatReferencePayloadBudgetPassReport(evaluation)).toContain(
      "PASS",
    );
  });

  test("fails when HTML exceeds the focused ceiling", () => {
    const { cwd, outDir } = createExportFixture({
      apiHtmlBytes: 14_000_000,
      jsBytes: 1_000,
    });

    const evaluation = evaluateReferencePayloadBudgets({ outDir, cwd });
    expect(evaluation.ok).toBe(false);
    expect(
      evaluation.failures.some(
        (failure) =>
          failure.dimension === "htmlBytes" &&
          failure.routeId === "references-api",
      ),
    ).toBe(true);
    expect(formatReferencePayloadBudgetFailureReport(evaluation)).toContain(
      REFERENCE_PAYLOAD_BUDGET_COMMAND,
    );
  });

  test("fails when attributable JS exceeds the focused ceiling", () => {
    const { cwd, outDir } = createExportFixture({
      jsBytes: 2_600_000,
    });

    const evaluation = evaluateReferencePayloadBudgets({ outDir, cwd });
    expect(evaluation.ok).toBe(false);
    expect(
      evaluation.failures.every(
        (failure) => failure.dimension === "jsPayloadBytes",
      ),
    ).toBe(true);
  });

  test("fails closed when a budgeted HTML page is missing", () => {
    const { cwd, outDir } = createExportFixture({ omitApi: true });
    const evaluation = evaluateReferencePayloadBudgets({ outDir, cwd });
    expect(evaluation.ok).toBe(false);
    expect(
      evaluation.failures.some(
        (failure) =>
          failure.dimension === "htmlMissing" &&
          failure.routeId === "references-api",
      ),
    ).toBe(true);
  });

  test("fails closed when referenced script files are missing from out/", () => {
    const { cwd, outDir } = createExportFixture({ omitJsFile: true });
    const evaluation = evaluateReferencePayloadBudgets({ outDir, cwd });
    expect(evaluation.ok).toBe(false);
    expect(
      evaluation.failures.some(
        (failure) => failure.dimension === "jsScriptsIncomplete",
      ),
    ).toBe(true);
  });

  test("measureReferencePayloadPage accepts in-memory HTML with out/ JS files", () => {
    const { cwd, outDir } = createExportFixture({ jsBytes: 2_500 });
    const html =
      '<html><body><script src="/_next/static/chunks/app.js"></script></body></html>';
    const measurement = measureReferencePayloadPage({
      routeId: "references-factory-schema",
      html,
      outDir,
      cwd,
    });
    expect(measurement.htmlBytes).toBe(utf8ByteLength(html));
    expect(measurement.jsPayloadBytes).toBe(2_500);
  });

  test("fails closed when export directory is missing", () => {
    const cwd = mkdtempSync(join(tmpdir(), "reference-payload-missing-out-"));
    tempDirs.push(cwd);
    const evaluation = evaluateReferencePayloadBudgets({
      outDir: "out",
      cwd,
    });
    expect(evaluation.ok).toBe(false);
    expect(evaluation.failures[0]?.dimension).toBe("exportDirectory");
  });
});
