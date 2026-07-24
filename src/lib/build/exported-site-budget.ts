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
 * their limits; ceiling was 145 MiB total / 5.30 MiB search. Raised again on
 * 2026-07-18 UTC after the W12 factories authored-pages lane measured
 * ~151.07 MiB / ~5.33 MiB, the W13 Worker authored-pages lane measured
 * ~152.37 MiB / ~5.36 MiB, W11 schema + events measured ~161.68 MiB /
 * ~5.44 MiB, W11 CLI/MCP/JavaScript runtime + events + workers measured
 * ~167.84 MiB / ~5.51 MiB, and the W14 Workstation authored-pages lane
 * (family index + 4 behaviors + 8 types with overlay embeds) measured
 * ~161.99 MiB / ~5.53 MiB. Raised again on 2026-07-18 UTC after merging W14
 * with main (W11 schema + events + W13 workers) — combined export measured
 * ~184.93 MiB total and ~5.82 MiB search bootstrap on CI; then after merging
 * W12 factories onto that head; ceiling was 210 MiB total / 6.50 MiB search.
 * Raised again on 2026-07-18 UTC after merging the W11 API reference page onto
 * that combined head — CI measured ~211.61 MiB total while Next static JS
 * (~2.87 MiB) and search bootstrap (~6.16 MiB) remained under their limits;
 * ceiling was 220 MiB total / 6.50 MiB search. Raised again on 2026-07-18 UTC
 * after the Next-safe OpenAPI loader fix on that head — CI measured
 * ~220.21 MiB total while JS (~2.87 MiB) and search (~6.16 MiB) stayed under
 * limits; ceiling was 225 MiB total / 6.50 MiB search. Raised again on
 * 2026-07-18 UTC after the W17 localization / contract-language lane (reference
 * chrome catalogs + ja/zh-CN/vi family-index messages + language-boundary
 * helpers) measured ~229.44 MiB total on CI while Next static JS (~2.86 MiB)
 * and search bootstrap (~6.16 MiB) remained under their limits; ceiling was
 * 235 MiB total / 6.50 MiB search. Raised again on 2026-07-18 UTC after
 * rebasing W16 search-and-anchor projection onto that W17 head — ~585
 * reference item documents in every locale catalog, with layout meta omitting
 * those item rows. Combined local `make build` measured ~225.54 MiB total /
 * ~29.69 MiB search bootstrap (en/ja/zh-CN/vi) / ~2.87 MiB Next static JS.
 * Total stays under the W17 235 MiB ceiling (meta omission more than offsets
 * the Orama delta); search ceiling is now 32 MiB. Keep modest headroom for
 * ordinary content growth without silent skip/pass.
 * Raised again on 2026-07-19 UTC after the repair-api-fumadocs-openapi-components
 * lane mounted Fumadocs `createAPIPage` / Schema UI as the primary
 * `/docs/references/api` renderer (curl+JS usage samples only; TS defs off).
 * Local `make build` measured ~334.75 MiB total / ~13.21 MiB Next static JS
 * (425 chunks; attributable API-page JS stayed ~2.14 MiB under the focused
 * ceiling) / ~28.88 MiB search bootstrap. API HTML alone is ~10.26 MiB × 4
 * locales from full Schema UI SSR — product-required for component-object
 * visibility. Ceilings: 360 MiB total / 15 MiB Next static JS / 32 MiB search.
 * Raised total-out again on 2026-07-22 UTC after the reference-aligned landing
 * and docs-root convergence added 14 intentional static routes (four docs
 * roots plus ten linked coming-soon destinations). CI measured ~366.29 MiB
 * total while Next static JS (~13.50 MiB) and search bootstrap (~22.87 MiB)
 * remained below their existing focused ceilings. The total ceiling was
 * 375 MiB; JS and search ceilings remain unchanged.
 * Raised total-out again on 2026-07-24 UTC after merging Batch 4 packaged
 * factory child pages (deep-research, goal/subagent, fusion/review) plus the
 * landing Youi compact goal replay onto the same head. CI measured
 * ~377.69 MiB total (377691517 bytes) while Next static JS (~13.97 MiB) and
 * search bootstrap (~22.93 MiB) stayed under their focused ceilings. The
 * total ceiling is now 380 MiB; JS and search ceilings remain unchanged.
 */
export const FACTORY_EXPORTED_SITE_BUDGET_BASELINES = {
  maxTotalOutBytes: 380_000_000,
  maxNextStaticJsBytes: 15_000_000,
  maxSearchBootstrapBytes: 32_000_000,
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
