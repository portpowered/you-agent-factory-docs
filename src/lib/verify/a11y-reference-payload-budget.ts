/**
 * W19 focused reference-page payload budgets.
 *
 * Promotes spike-era HTML + attributable Next static JS cost ideas
 * (`references-openapi-spike/cost-measurements`) into production gates for the
 * heaviest Factory reference surfaces. Pure measurement/evaluation — CLI /
 * `make budget` owns IO exit codes. Does not raise the total-site
 * `FACTORY_EXPORTED_SITE_BUDGET_BASELINES` ceilings.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  DEFAULT_EXPORT_OUT_DIR,
  exportHtmlRelativePath,
  resolveExportHtmlFilePath,
  verifyExportOutDirectory,
} from "@/lib/build/export-out-directory";
import {
  getReferenceSurfaceRoute,
  type ReferenceSurfaceRouteId,
} from "./a11y-reference-surface-contract";

/** Maintainer reproduction command printed on focused budget failure. */
export const REFERENCE_PAYLOAD_BUDGET_COMMAND = "make budget";

/**
 * Routes that carry focused per-page payload ceilings (API, events, largest
 * schema). Authored factory/worker/workstation pages stay on the total-site
 * gate only for W19 story 002.
 */
export const REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS = [
  "references-api",
  "references-events",
  "references-factory-schema",
] as const satisfies readonly ReferenceSurfaceRouteId[];

export type ReferencePayloadBudgetRouteId =
  (typeof REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS)[number];

export type ReferencePayloadBudgetBuildMode = "static-export-out";

/**
 * Reproducible measurement method for focused reference page payloads.
 * Mirrors the spike HTML / attributable-JS definitions against production
 * routes under a trusted `out/` export.
 */
export const REFERENCE_PAYLOAD_BUDGET_MEASUREMENT_METHOD = {
  buildMode:
    "static-export-out" as const satisfies ReferencePayloadBudgetBuildMode,
  reproductionCommands: [
    "make build",
    "bun -e \"import { measureReferencePayloadBudgets, formatReferencePayloadBudgetPassReport, evaluateReferencePayloadBudgets } from './src/lib/verify/a11y-reference-payload-budget.ts'; const e = evaluateReferencePayloadBudgets(); console.log(e.ok ? formatReferencePayloadBudgetPassReport(e) : e.failures);\"",
    "make budget",
  ] as const,
  definitions: {
    htmlBytes:
      "UTF-8 byte length of the exported HTML document for the route under out/ (for example out/docs/references/api.html).",
    jsPayloadBytes:
      "Sum of unique /_next/static/**/*.js script bodies referenced by that HTML, resolved from files under the same out/ (percent-decoded paths).",
  } as const,
  /**
   * Prior production measurement used to set ceilings (W16 search-and-anchor
   * export head that already shipped API + events + factory-schema pages).
   * Re-measure on this lane's `out/` before raising ceilings.
   */
  baselineSource: {
    measuredAtUtc: "2026-07-19T11:58:00Z",
    note: "Measured from repair-api-fumadocs-openapi-components static-export out/ after Fumadocs APIPage + Schema UI became the primary /docs/references/api renderer (curl+JS codeUsages; generateTypeScriptDefinitions false). API HTML ~10.26 MiB; attributable API JS ~2.14 MiB.",
  } as const,
} as const;

export type ReferencePayloadPageBaseline = {
  routeId: ReferencePayloadBudgetRouteId;
  path: string;
  /** Observed HTML bytes at baselineSource.measuredAtUtc. */
  measuredHtmlBytes: number;
  /** Observed attributable Next static JS bytes at baseline. */
  measuredJsPayloadBytes: number;
  /** Focused HTML ceiling (measured + modest headroom). */
  maxHtmlBytes: number;
  /** Focused attributable JS ceiling (measured + modest headroom). */
  maxJsPayloadBytes: number;
};

/**
 * Recorded baselines + focused ceilings. Headroom is ~25% so ordinary contract
 * growth does not force silent total-site raises, while a single heavy page
 * regression still fails closed.
 */
export const REFERENCE_PAYLOAD_PAGE_BUDGETS: readonly ReferencePayloadPageBaseline[] =
  [
    {
      routeId: "references-api",
      path: "/docs/references/api",
      measuredHtmlBytes: 10_258_887,
      measuredJsPayloadBytes: 2_136_570,
      // ~25% headroom above Fumadocs Schema UI SSR HTML for 45 operations.
      maxHtmlBytes: 13_000_000,
      maxJsPayloadBytes: 2_500_000,
    },
    {
      routeId: "references-events",
      path: "/docs/references/events",
      measuredHtmlBytes: 2_076_020,
      measuredJsPayloadBytes: 2_136_570,
      maxHtmlBytes: 2_600_000,
      maxJsPayloadBytes: 2_500_000,
    },
    {
      routeId: "references-factory-schema",
      path: "/docs/references/factory-schema",
      measuredHtmlBytes: 480_214,
      measuredJsPayloadBytes: 2_136_570,
      maxHtmlBytes: 600_000,
      maxJsPayloadBytes: 2_500_000,
    },
  ] as const;

export type ReferencePayloadPageMeasurement = {
  routeId: ReferencePayloadBudgetRouteId;
  path: string;
  htmlRelativePath: string;
  htmlBytes: number;
  jsPayloadBytes: number;
  jsScriptCount: number;
  missingScriptPaths: string[];
};

export type ReferencePayloadBudgetFailureDimension =
  | "exportDirectory"
  | "htmlMissing"
  | "htmlBytes"
  | "jsPayloadBytes"
  | "jsScriptsIncomplete";

export type ReferencePayloadBudgetFailure = {
  dimension: ReferencePayloadBudgetFailureDimension;
  routeId?: ReferencePayloadBudgetRouteId;
  message: string;
};

export type ReferencePayloadBudgetEvaluation = {
  ok: boolean;
  measurements: ReferencePayloadPageMeasurement[];
  failures: ReferencePayloadBudgetFailure[];
  summaryLines: string[];
};

const SCRIPT_SRC_RE =
  /<script\b[^>]*\bsrc=["']([^"']+\.js(?:\?[^"']*)?)["'][^>]*>/gi;

function resolveAbsoluteOutDir(outDir: string, cwd: string): string {
  return isAbsolute(outDir) ? outDir : join(cwd, outDir);
}

/** UTF-8 byte length of a string (matches spike cost helper). */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

/**
 * Collect unique absolute or root-relative JS script URLs from an HTML document.
 */
export function extractReferencedScriptUrls(
  html: string,
  origin = "http://127.0.0.1",
): string[] {
  const urls = new Set<string>();
  for (const match of html.matchAll(SCRIPT_SRC_RE)) {
    const raw = match[1];
    if (!raw) continue;
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      urls.add(raw);
      continue;
    }
    if (raw.startsWith("/")) {
      urls.add(new URL(raw, origin).toString());
      continue;
    }
    urls.add(new URL(raw, origin).toString());
  }
  return [...urls].sort();
}

/**
 * Keep only Next static JS chunks (ignore third-party / analytics noise).
 */
export function filterNextStaticJsUrls(urls: readonly string[]): string[] {
  return urls.filter((url) => {
    try {
      const pathname = new URL(url).pathname;
      return pathname.includes("/_next/static/") && pathname.endsWith(".js");
    } catch {
      return false;
    }
  });
}

/**
 * Map a script URL to a path relative to the export root (`_next/static/...`).
 * Percent-decodes so `%5B%5B...slug%5D%5D` chunks resolve on disk.
 */
export function exportRelativePathFromScriptUrl(url: string): string | null {
  try {
    const pathname = decodeURIComponent(new URL(url).pathname);
    const marker = "/_next/static/";
    const index = pathname.indexOf(marker);
    if (index === -1) {
      return null;
    }
    return pathname.slice(index + 1);
  } catch {
    return null;
  }
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

export function getReferencePayloadPageBudget(
  routeId: ReferencePayloadBudgetRouteId,
): ReferencePayloadPageBaseline | undefined {
  return REFERENCE_PAYLOAD_PAGE_BUDGETS.find(
    (entry) => entry.routeId === routeId,
  );
}

/**
 * Measures HTML + attributable Next static JS for one exported reference page.
 */
export function measureReferencePayloadPage(options: {
  routeId: ReferencePayloadBudgetRouteId;
  html: string;
  outDir?: string;
  cwd?: string;
  origin?: string;
}): ReferencePayloadPageMeasurement {
  const route = getReferenceSurfaceRoute(options.routeId);
  const budget = getReferencePayloadPageBudget(options.routeId);
  if (!route || !budget) {
    throw new Error(
      `Unknown reference payload budget route: ${options.routeId}`,
    );
  }

  const cwd = options.cwd ?? process.cwd();
  const outDir = options.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const absoluteOutDir = resolveAbsoluteOutDir(outDir, cwd);
  const htmlRelativePath = exportHtmlRelativePath(route.path);
  const htmlBytes = utf8ByteLength(options.html);

  const scriptUrls = filterNextStaticJsUrls(
    extractReferencedScriptUrls(
      options.html,
      options.origin ?? "http://127.0.0.1",
    ),
  );

  let jsPayloadBytes = 0;
  const missingScriptPaths: string[] = [];
  for (const url of scriptUrls) {
    const relative = exportRelativePathFromScriptUrl(url);
    if (!relative) {
      missingScriptPaths.push(url);
      continue;
    }
    const absolute = join(absoluteOutDir, relative);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      missingScriptPaths.push(`/${relative}`);
      continue;
    }
    jsPayloadBytes += statSync(absolute).size;
  }

  return {
    routeId: options.routeId,
    path: route.path,
    htmlRelativePath,
    htmlBytes,
    jsPayloadBytes,
    jsScriptCount: scriptUrls.length,
    missingScriptPaths,
  };
}

/**
 * Measures all focused reference payload pages from a trusted `out/` export.
 */
export function measureReferencePayloadBudgets(
  outDir: string = DEFAULT_EXPORT_OUT_DIR,
  cwd: string = process.cwd(),
): ReferencePayloadPageMeasurement[] {
  const absoluteOutDir = resolveAbsoluteOutDir(outDir, cwd);
  return REFERENCE_PAYLOAD_BUDGET_ROUTE_IDS.map((routeId) => {
    const route = getReferenceSurfaceRoute(routeId);
    if (!route) {
      throw new Error(`Missing reference surface route: ${routeId}`);
    }
    const htmlPath = resolveExportHtmlFilePath(outDir, route.path, cwd);
    if (!existsSync(htmlPath)) {
      return {
        routeId,
        path: route.path,
        htmlRelativePath: exportHtmlRelativePath(route.path),
        htmlBytes: 0,
        jsPayloadBytes: 0,
        jsScriptCount: 0,
        missingScriptPaths: [
          `missing:${join(absoluteOutDir, exportHtmlRelativePath(route.path))}`,
        ],
      };
    }
    const html = readFileSync(htmlPath, "utf8");
    return measureReferencePayloadPage({
      routeId,
      html,
      outDir,
      cwd,
    });
  });
}

/** Builds concise pass/fail summary lines for observed values vs ceilings. */
export function formatReferencePayloadBudgetSummaryLines(
  measurements: readonly ReferencePayloadPageMeasurement[],
): string[] {
  return measurements.map((measurement) => {
    const budget = getReferencePayloadPageBudget(measurement.routeId);
    if (!budget) {
      return `${measurement.path}: missing budget entry`;
    }
    return [
      `${measurement.path}:`,
      `HTML ${formatBytes(measurement.htmlBytes)} / limit ${formatBytes(budget.maxHtmlBytes)};`,
      `attributable JS ${formatBytes(measurement.jsPayloadBytes)} / limit ${formatBytes(budget.maxJsPayloadBytes)}`,
      `(${measurement.jsScriptCount} scripts)`,
    ].join(" ");
  });
}

/** Evaluates measurements against focused per-page ceilings. */
export function evaluateReferencePayloadBudgetMeasurements(
  measurements: readonly ReferencePayloadPageMeasurement[],
): ReferencePayloadBudgetEvaluation {
  const failures: ReferencePayloadBudgetFailure[] = [];

  for (const measurement of measurements) {
    const budget = getReferencePayloadPageBudget(measurement.routeId);
    if (!budget) {
      failures.push({
        dimension: "htmlMissing",
        routeId: measurement.routeId,
        message: `missing budget entry for ${measurement.routeId}`,
      });
      continue;
    }

    if (
      measurement.missingScriptPaths.some((path) => path.startsWith("missing:"))
    ) {
      failures.push({
        dimension: "htmlMissing",
        routeId: measurement.routeId,
        message: `expected exported HTML at ${measurement.htmlRelativePath}`,
      });
      continue;
    }

    if (measurement.missingScriptPaths.length > 0) {
      failures.push({
        dimension: "jsScriptsIncomplete",
        routeId: measurement.routeId,
        message: `missing ${measurement.missingScriptPaths.length} attributable script file(s) under out/ (first=${measurement.missingScriptPaths[0]})`,
      });
    }

    if (measurement.htmlBytes > budget.maxHtmlBytes) {
      failures.push({
        dimension: "htmlBytes",
        routeId: measurement.routeId,
        message: `expected htmlBytes<=${budget.maxHtmlBytes} for ${measurement.path}, received ${measurement.htmlBytes}`,
      });
    }

    if (measurement.jsPayloadBytes > budget.maxJsPayloadBytes) {
      failures.push({
        dimension: "jsPayloadBytes",
        routeId: measurement.routeId,
        message: `expected jsPayloadBytes<=${budget.maxJsPayloadBytes} for ${measurement.path}, received ${measurement.jsPayloadBytes}`,
      });
    }
  }

  return {
    ok: failures.length === 0,
    measurements: [...measurements],
    failures,
    summaryLines: formatReferencePayloadBudgetSummaryLines(measurements),
  };
}

/**
 * Evaluates focused reference page budgets against `out/`.
 * Fails closed when the export directory or a budgeted HTML file is missing.
 */
export function evaluateReferencePayloadBudgets(options?: {
  outDir?: string;
  cwd?: string;
}): ReferencePayloadBudgetEvaluation {
  const outDir = options?.outDir ?? DEFAULT_EXPORT_OUT_DIR;
  const cwd = options?.cwd ?? process.cwd();

  const directory = verifyExportOutDirectory(outDir, cwd);
  if (!directory.ok) {
    return {
      ok: false,
      measurements: [],
      failures: [
        {
          dimension: "exportDirectory",
          message: directory.reason,
        },
      ],
      summaryLines: [],
    };
  }

  const measurements = measureReferencePayloadBudgets(outDir, cwd);
  return evaluateReferencePayloadBudgetMeasurements(measurements);
}

/** Formats a failure report including the local reproduction command. */
export function formatReferencePayloadBudgetFailureReport(
  evaluation: ReferencePayloadBudgetEvaluation,
): string {
  const lines = [
    "Focused reference payload budget gate failed:",
    ...evaluation.failures.map((failure) => {
      const route = failure.routeId ? ` [${failure.routeId}]` : "";
      return `- ${failure.dimension}${route}: ${failure.message}`;
    }),
  ];

  if (evaluation.summaryLines.length > 0) {
    lines.push("Observed:");
    for (const line of evaluation.summaryLines) {
      lines.push(`  ${line}`);
    }
  }

  lines.push(`Reproduce locally with: ${REFERENCE_PAYLOAD_BUDGET_COMMAND}`);
  return lines.join("\n");
}

/** Formats a concise pass summary including observed values and ceilings. */
export function formatReferencePayloadBudgetPassReport(
  evaluation: ReferencePayloadBudgetEvaluation,
): string {
  return [
    "Focused reference payload budget gate: PASS",
    ...evaluation.summaryLines.map((line) => `  ${line}`),
  ].join("\n");
}

/**
 * True when every focused budget path matches the shared W19 reference
 * surface contract (guards against hard-coding divergent routes).
 */
export function referencePayloadBudgetsAlignWithSurfaceContract(): boolean {
  return REFERENCE_PAYLOAD_PAGE_BUDGETS.every((budget) => {
    const route = getReferenceSurfaceRoute(budget.routeId);
    return route?.path === budget.path;
  });
}
