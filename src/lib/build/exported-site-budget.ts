/**
 * Factory exported-site budget gate (restore-required-tests-gates-004).
 *
 * Measures a trusted/static `out/` artifact against factory-specific baselines
 * for total export size, Next static JavaScript, and Orama search bootstrap
 * payloads. Pure measurement/evaluation — the CLI script owns IO exit codes.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  verifyExportOutDirectory,
} from "@/lib/build/export-out-directory";

/** Maintainer reproduction command printed on failure. */
export const EXPORTED_SITE_BUDGET_COMMAND = "make budget";

/**
 * Factory-specific baselines for the rewrite-era docs export.
 *
 * Calibrated against a clean `make build` on 2026-07-10 UTC (~64.5 MiB total,
 * ~2.51 MiB Next static JS, ~2.89 MiB search bootstrap). Raised total-out to
 * 90 MiB on 2026-07-11 UTC after concurrent launch-extra pages reached
 * ~85.08 MiB, then to 95 MiB the same day after Troubleshooting/FAQ plus
 * sibling documentation lanes measured ~87.8 MiB on a combined head (Next
 * static JS and search bootstrap remained under their limits). Raised again
 * on 2026-07-11 UTC after the concepts taxonomy repair lane (Tokens rewrite +
 * Skills/MCP/Tool calling) measured ~99.78 MiB total and ~4.08 MiB search
 * bootstrap on CI. Raised again on 2026-07-11 UTC after Script/Poller workers
 * documentation pages measured ~106.98 MiB total and ~4.32 MiB search
 * bootstrap on CI; after packaged-documents/factories (~106.78 MiB / ~4.27 MiB
 * search); after Agent/Inference workers Program docs (~107.37 MiB / ~4.40 MiB
 * search); and after Mock workers / Throttling and limits pages (plus locale
 * stubs) measured ~107.22 MiB total and ~4.42 MiB search bootstrap on CI.
 * Raised again on 2026-07-11 UTC after rebasing Mock workers / Throttling onto
 * main with Script/Poller already landed — combined export measured ~113.75 MiB
 * total and ~4.66 MiB search bootstrap on CI. Packaged + Script/Poller alone
 * had measured ~113.28 MiB / ~4.51 MiB. Raised again on 2026-07-11 UTC after
 * rebasing Agent/Inference workers onto that combined main — six-page export
 * measured ~120.83 MiB total and ~4.97 MiB search bootstrap on CI. Packaged +
 * Mock/Throttling + Script/Poller measured ~120.24 MiB / ~4.84 MiB. Projected
 * eight-page union (packaged + Agent/Inference + Mock/Throttling +
 * Script/Poller) from those observed deltas is ~127 MiB / ~5.15 MiB; ceilings
 * were 130 MiB / 5.30 MiB. Raised again on 2026-07-18 UTC after the W05
 * route-family foundation lane (four direct family indexes + nested-slug
 * routing + reference kind/template) measured ~138.27 MiB total on CI while
 * Next static JS (~2.65 MiB) and search bootstrap (~5.16 MiB) remained under
 * their limits; ceiling is now 145 MiB total / 5.30 MiB search. Keep modest
 * headroom for ordinary content growth without silent skip/pass.
 */
export const FACTORY_EXPORTED_SITE_BUDGET_BASELINES = {
  maxTotalOutBytes: 145_000_000,
  maxNextStaticJsBytes: 3_500_000,
  maxSearchBootstrapBytes: 5_300_000,
} as const;

export type ExportedSiteBudgetBaselines =
  typeof FACTORY_EXPORTED_SITE_BUDGET_BASELINES;

export type ExportedSiteBudgetMeasurement = {
  outDir: string;
  totalOutBytes: number;
  fileCount: number;
  nextStaticJsBytes: number;
  nextStaticJsFileCount: number;
  largestNextStaticJsPath: string | null;
  largestNextStaticJsBytes: number;
  searchBootstrapBytes: number;
  searchBootstrapPaths: string[];
};

export type ExportedSiteBudgetFailureDimension =
  | "exportDirectory"
  | "totalOutBytes"
  | "nextStaticJsBytes"
  | "nextStaticJsPresent"
  | "searchBootstrapBytes"
  | "searchBootstrapPresent";

export type ExportedSiteBudgetFailure = {
  dimension: ExportedSiteBudgetFailureDimension;
  message: string;
};

export type ExportedSiteBudgetEvaluation = {
  ok: boolean;
  measurement: ExportedSiteBudgetMeasurement | null;
  failures: ExportedSiteBudgetFailure[];
  summaryLines: string[];
};

function resolveAbsoluteOutDir(outDir: string, cwd: string): string {
  return isAbsolute(outDir) ? outDir : join(cwd, outDir);
}

function toPosixRelative(exportRoot: string, absolutePath: string): string {
  return relative(exportRoot, absolutePath).split(sep).join("/");
}

function listFilesRecursive(directory: string): string[] {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    return [];
  }

  const results: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(entryPath));
      continue;
    }
    if (entry.isFile()) {
      results.push(entryPath);
    }
  }
  return results;
}

function listSearchBootstrapPaths(absoluteOutDir: string): string[] {
  const apiDir = join(absoluteOutDir, "api");
  if (!existsSync(apiDir) || !statSync(apiDir).isDirectory()) {
    return [];
  }

  return readdirSync(apiDir)
    .filter((name) => name === "search" || name.startsWith("search."))
    .map((name) => join(apiDir, name))
    .filter((path) => existsSync(path) && statSync(path).isFile())
    .sort();
}

/** Measures export payload surfaces under `outDir`. */
export function measureExportedSiteBudget(
  outDir: string = DEFAULT_EXPORT_OUT_DIR,
  cwd: string = process.cwd(),
): ExportedSiteBudgetMeasurement {
  const absoluteOutDir = resolveAbsoluteOutDir(outDir, cwd);
  const allFiles = listFilesRecursive(absoluteOutDir);

  let totalOutBytes = 0;
  for (const filePath of allFiles) {
    totalOutBytes += statSync(filePath).size;
  }

  const jsFiles = listFilesRecursive(
    join(absoluteOutDir, "_next", "static"),
  ).filter((path) => path.endsWith(".js"));

  let nextStaticJsBytes = 0;
  let largestNextStaticJsPath: string | null = null;
  let largestNextStaticJsBytes = 0;
  for (const filePath of jsFiles) {
    const size = statSync(filePath).size;
    nextStaticJsBytes += size;
    if (size > largestNextStaticJsBytes) {
      largestNextStaticJsBytes = size;
      largestNextStaticJsPath = `/${toPosixRelative(absoluteOutDir, filePath)}`;
    }
  }

  const searchPaths = listSearchBootstrapPaths(absoluteOutDir);
  let searchBootstrapBytes = 0;
  for (const filePath of searchPaths) {
    searchBootstrapBytes += statSync(filePath).size;
  }

  return {
    outDir,
    totalOutBytes,
    fileCount: allFiles.length,
    nextStaticJsBytes,
    nextStaticJsFileCount: jsFiles.length,
    largestNextStaticJsPath,
    largestNextStaticJsBytes,
    searchBootstrapBytes,
    searchBootstrapPaths: searchPaths.map(
      (path) => `/${toPosixRelative(absoluteOutDir, path)}`,
    ),
  };
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) {
    return `${(bytes / 1_000_000).toFixed(2)} MB (${bytes} bytes)`;
  }
  if (bytes >= 1_000) {
    return `${(bytes / 1_000).toFixed(1)} KB (${bytes} bytes)`;
  }
  return `${bytes} bytes`;
}

/** Builds concise pass/fail summary lines for observed values vs limits. */
export function formatExportedSiteBudgetSummaryLines(
  measurement: ExportedSiteBudgetMeasurement,
  baselines: ExportedSiteBudgetBaselines = FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
): string[] {
  return [
    `total out/: ${formatBytes(measurement.totalOutBytes)} / limit ${formatBytes(baselines.maxTotalOutBytes)} (${measurement.fileCount} files)`,
    `Next static JS (_next/static/**/*.js): ${formatBytes(measurement.nextStaticJsBytes)} / limit ${formatBytes(baselines.maxNextStaticJsBytes)} (${measurement.nextStaticJsFileCount} files; largest=${measurement.largestNextStaticJsPath ?? "missing"} ${measurement.largestNextStaticJsBytes} bytes)`,
    `search bootstrap (api/search*): ${formatBytes(measurement.searchBootstrapBytes)} / limit ${formatBytes(baselines.maxSearchBootstrapBytes)} (${measurement.searchBootstrapPaths.join(", ") || "none"})`,
  ];
}

/** Evaluates a measurement against factory baselines. */
export function evaluateExportedSiteBudgetMeasurement(
  measurement: ExportedSiteBudgetMeasurement,
  baselines: ExportedSiteBudgetBaselines = FACTORY_EXPORTED_SITE_BUDGET_BASELINES,
): ExportedSiteBudgetEvaluation {
  const failures: ExportedSiteBudgetFailure[] = [];

  if (measurement.nextStaticJsFileCount === 0) {
    failures.push({
      dimension: "nextStaticJsPresent",
      message:
        "expected at least one .js asset under _next/static — export looks incomplete",
    });
  }

  if (measurement.searchBootstrapPaths.length === 0) {
    failures.push({
      dimension: "searchBootstrapPresent",
      message:
        "expected Orama search bootstrap files under api/search* — export looks incomplete",
    });
  }

  if (measurement.totalOutBytes > baselines.maxTotalOutBytes) {
    failures.push({
      dimension: "totalOutBytes",
      message: `expected totalOutBytes<=${baselines.maxTotalOutBytes}, received ${measurement.totalOutBytes}`,
    });
  }

  if (measurement.nextStaticJsBytes > baselines.maxNextStaticJsBytes) {
    failures.push({
      dimension: "nextStaticJsBytes",
      message: [
        `expected nextStaticJsBytes<=${baselines.maxNextStaticJsBytes}, received ${measurement.nextStaticJsBytes}`,
        `across ${measurement.nextStaticJsFileCount} .js assets`,
        `largest=${measurement.largestNextStaticJsPath ?? "missing"} (${measurement.largestNextStaticJsBytes} bytes)`,
      ].join("; "),
    });
  }

  if (measurement.searchBootstrapBytes > baselines.maxSearchBootstrapBytes) {
    failures.push({
      dimension: "searchBootstrapBytes",
      message: `expected searchBootstrapBytes<=${baselines.maxSearchBootstrapBytes}, received ${measurement.searchBootstrapBytes}`,
    });
  }

  return {
    ok: failures.length === 0,
    measurement,
    failures,
    summaryLines: formatExportedSiteBudgetSummaryLines(measurement, baselines),
  };
}

/**
 * Evaluates the export directory at `outDir` against factory baselines.
 * Fails closed when the export directory is missing or incomplete.
 */
export function evaluateExportedSiteBudget(options?: {
  outDir?: string;
  cwd?: string;
  baselines?: ExportedSiteBudgetBaselines;
}): ExportedSiteBudgetEvaluation {
  const outDir = options?.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const cwd = options?.cwd ?? process.cwd();
  const baselines =
    options?.baselines ?? FACTORY_EXPORTED_SITE_BUDGET_BASELINES;

  const directory = verifyExportOutDirectory(outDir, cwd);
  if (!directory.ok) {
    return {
      ok: false,
      measurement: null,
      failures: [
        {
          dimension: "exportDirectory",
          message: directory.reason,
        },
      ],
      summaryLines: [],
    };
  }

  const measurement = measureExportedSiteBudget(outDir, cwd);
  return evaluateExportedSiteBudgetMeasurement(measurement, baselines);
}

/** Formats a failure report including the local reproduction command. */
export function formatExportedSiteBudgetFailureReport(
  evaluation: ExportedSiteBudgetEvaluation,
): string {
  const lines = [
    "Exported-site budget gate failed:",
    ...evaluation.failures.map(
      (failure) => `- ${failure.dimension}: ${failure.message}`,
    ),
  ];

  if (evaluation.summaryLines.length > 0) {
    lines.push("Observed:");
    for (const line of evaluation.summaryLines) {
      lines.push(`  ${line}`);
    }
  }

  lines.push(`Reproduce locally with: ${EXPORTED_SITE_BUDGET_COMMAND}`);
  return lines.join("\n");
}

/** Formats a concise pass summary including observed values and limits. */
export function formatExportedSiteBudgetPassReport(
  evaluation: ExportedSiteBudgetEvaluation,
): string {
  return [
    "Exported-site budget gate: PASS",
    ...evaluation.summaryLines.map((line) => `  ${line}`),
  ].join("\n");
}
