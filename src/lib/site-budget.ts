import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { DOCS_ENTRY_ROUTE } from "@/lib/site";
import type { FetchLike } from "@/lib/static-export";

export type BudgetRouteTarget = {
  id: "homepage" | "docs-entry";
  label: string;
  route: "/" | typeof DOCS_ENTRY_ROUTE;
};

export type RouteBudgetThresholds = {
  maxHtmlBytes: number;
  maxScriptTagCount: number;
  maxStylesheetLinkCount: number;
  maxImageCount: number;
  requireMainLandmark: boolean;
  requireTitle: boolean;
  requireH1: boolean;
};

export type BudgetedRouteTarget = BudgetRouteTarget & {
  budget: RouteBudgetThresholds;
};

export type RouteBudgetMeasurement = {
  route: BudgetRouteTarget;
  requestUrl: string;
  status: number;
  htmlBytes: number;
  scriptTagCount: number;
  stylesheetLinkCount: number;
  imageCount: number;
  mainLandmarkPresent: boolean;
  titlePresent: boolean;
  h1Text: string | null;
};

export type RouteBudgetFailure = {
  route: BudgetRouteTarget;
  dimension:
    | "status"
    | "htmlBytes"
    | "scriptTagCount"
    | "stylesheetLinkCount"
    | "imageCount"
    | "mainLandmarkPresent"
    | "titlePresent"
    | "h1Text";
  message: string;
};

export type StaticAssetBudgetThresholds = {
  maxTotalBytes: number;
};

export type StaticAssetBudgetTarget = {
  id: "next-static-javascript";
  label: string;
  directory: string;
  fileExtension: ".js";
  budget: StaticAssetBudgetThresholds;
};

export type StaticAssetBudgetMeasurement = {
  target: StaticAssetBudgetTarget;
  assetCount: number;
  totalBytes: number;
  largestAssetPath: string | null;
  largestAssetBytes: number;
};

export type StaticAssetBudgetFailure = {
  target: StaticAssetBudgetTarget;
  dimension: "totalBytes";
  message: string;
};

export const SITE_BUDGET_ROUTE_TARGETS: BudgetedRouteTarget[] = [
  {
    id: "homepage",
    label: "Homepage",
    route: "/",
    budget: {
      maxHtmlBytes: 8_500,
      maxScriptTagCount: 13,
      maxStylesheetLinkCount: 1,
      maxImageCount: 0,
      requireMainLandmark: true,
      requireTitle: true,
      requireH1: true,
    },
  },
  {
    id: "docs-entry",
    label: "Docs entry",
    route: DOCS_ENTRY_ROUTE,
    budget: {
      maxHtmlBytes: 9_000,
      maxScriptTagCount: 13,
      maxStylesheetLinkCount: 1,
      maxImageCount: 0,
      requireMainLandmark: true,
      requireTitle: true,
      requireH1: true,
    },
  },
];

export const SITE_BUDGET_STATIC_ASSET_TARGETS: StaticAssetBudgetTarget[] = [
  {
    id: "next-static-javascript",
    label: "Next static JavaScript",
    directory: "_next/static",
    fileExtension: ".js",
    budget: {
      maxTotalBytes: 850_000,
    },
  },
];

export function resolveBudgetRouteUrl(
  baseUrl: string,
  route: BudgetRouteTarget["route"],
): string {
  const normalizedRoute = route === "/" ? "" : `${route.replace(/^\//, "")}/`;
  return new URL(normalizedRoute, baseUrl).toString();
}

export async function measureBudgetRoute(
  fetchHttp: FetchLike,
  baseUrl: string,
  route: BudgetRouteTarget,
): Promise<RouteBudgetMeasurement> {
  const requestUrl = resolveBudgetRouteUrl(baseUrl, route.route);
  const response = await fetchHttp(requestUrl, {
    signal: AbortSignal.timeout(10_000),
  });
  const html = await response.text();

  return {
    route,
    requestUrl,
    status: response.status,
    htmlBytes: Buffer.byteLength(html, "utf8"),
    scriptTagCount: countMatches(html, /<script\b/gi),
    stylesheetLinkCount: countMatches(
      html,
      /<link\b[^>]*rel=["']stylesheet["']/gi,
    ),
    imageCount: countMatches(html, /<img\b/gi),
    mainLandmarkPresent: /<main\b/i.test(html),
    titlePresent: /<title>[\s\S]*?<\/title>/i.test(html),
    h1Text: extractTextContent(html, "h1"),
  };
}

export function evaluateRouteBudget(
  measurement: RouteBudgetMeasurement,
  budget: RouteBudgetThresholds = getRouteBudgetThresholds(
    measurement.route.id,
  ),
): RouteBudgetFailure[] {
  const failures: RouteBudgetFailure[] = [];

  if (measurement.status !== 200) {
    failures.push({
      route: measurement.route,
      dimension: "status",
      message: `expected status=200, received ${measurement.status}`,
    });
  }

  if (measurement.htmlBytes > budget.maxHtmlBytes) {
    failures.push({
      route: measurement.route,
      dimension: "htmlBytes",
      message: `expected htmlBytes<=${budget.maxHtmlBytes}, received ${measurement.htmlBytes}`,
    });
  }

  if (measurement.scriptTagCount > budget.maxScriptTagCount) {
    failures.push({
      route: measurement.route,
      dimension: "scriptTagCount",
      message: `expected scripts<=${budget.maxScriptTagCount}, received ${measurement.scriptTagCount}`,
    });
  }

  if (measurement.stylesheetLinkCount > budget.maxStylesheetLinkCount) {
    failures.push({
      route: measurement.route,
      dimension: "stylesheetLinkCount",
      message: `expected stylesheets<=${budget.maxStylesheetLinkCount}, received ${measurement.stylesheetLinkCount}`,
    });
  }

  if (measurement.imageCount > budget.maxImageCount) {
    failures.push({
      route: measurement.route,
      dimension: "imageCount",
      message: `expected images<=${budget.maxImageCount}, received ${measurement.imageCount}`,
    });
  }

  if (budget.requireMainLandmark && !measurement.mainLandmarkPresent) {
    failures.push({
      route: measurement.route,
      dimension: "mainLandmarkPresent",
      message: "expected a <main> landmark",
    });
  }

  if (budget.requireTitle && !measurement.titlePresent) {
    failures.push({
      route: measurement.route,
      dimension: "titlePresent",
      message: "expected a <title> element",
    });
  }

  if (budget.requireH1 && !measurement.h1Text) {
    failures.push({
      route: measurement.route,
      dimension: "h1Text",
      message: "expected a non-empty <h1>",
    });
  }

  return failures;
}

export function assertSiteBudget(
  measurements: RouteBudgetMeasurement[],
  routeTargets: BudgetedRouteTarget[] = SITE_BUDGET_ROUTE_TARGETS,
): void {
  const failures = measurements.flatMap((measurement) =>
    evaluateRouteBudget(
      measurement,
      routeTargets.find(
        (routeTarget) => routeTarget.id === measurement.route.id,
      )?.budget,
    ),
  );

  if (failures.length === 0) {
    return;
  }

  throw new Error(formatRouteBudgetFailures(failures));
}

export function measureStaticAssetBudget(
  exportRoot: string,
  target: StaticAssetBudgetTarget,
): StaticAssetBudgetMeasurement {
  const assetRoot = join(exportRoot, target.directory);
  const assetPaths = listMatchingAssetPaths(assetRoot, target.fileExtension);

  let totalBytes = 0;
  let largestAssetPath: string | null = null;
  let largestAssetBytes = 0;

  for (const assetPath of assetPaths) {
    const assetBytes = statSync(assetPath).size;
    totalBytes += assetBytes;

    if (assetBytes > largestAssetBytes) {
      largestAssetBytes = assetBytes;
      largestAssetPath = `/${relative(exportRoot, assetPath).split(sep).join("/")}`;
    }
  }

  return {
    target,
    assetCount: assetPaths.length,
    totalBytes,
    largestAssetPath,
    largestAssetBytes,
  };
}

export function evaluateStaticAssetBudget(
  measurement: StaticAssetBudgetMeasurement,
  budget: StaticAssetBudgetThresholds = measurement.target.budget,
): StaticAssetBudgetFailure[] {
  if (measurement.totalBytes <= budget.maxTotalBytes) {
    return [];
  }

  return [
    {
      target: measurement.target,
      dimension: "totalBytes",
      message: [
        `expected totalBytes<=${budget.maxTotalBytes}, received ${measurement.totalBytes}`,
        `across ${measurement.assetCount} ${measurement.target.fileExtension} assets`,
        `largest=${measurement.largestAssetPath ?? "missing"} (${measurement.largestAssetBytes} bytes)`,
      ].join("; "),
    },
  ];
}

export function assertStaticAssetBudget(
  measurements: StaticAssetBudgetMeasurement[],
): void {
  const failures = measurements.flatMap((measurement) =>
    evaluateStaticAssetBudget(measurement),
  );

  if (failures.length === 0) {
    return;
  }

  throw new Error(formatStaticAssetBudgetFailures(failures));
}

export function formatRouteBudgetFailures(
  failures: RouteBudgetFailure[],
): string {
  return [
    "Site budget check failed:",
    ...failures.map(
      (failure) =>
        `- ${failure.route.label} (${failure.route.route}) ${failure.dimension}: ${failure.message}`,
    ),
  ].join("\n");
}

function getRouteBudgetThresholds(
  routeId: BudgetRouteTarget["id"],
): RouteBudgetThresholds {
  const routeTarget = SITE_BUDGET_ROUTE_TARGETS.find(
    (candidate) => candidate.id === routeId,
  );

  if (!routeTarget) {
    throw new Error(`Missing site budget thresholds for route "${routeId}"`);
  }

  return routeTarget.budget;
}

export function formatStaticAssetBudgetFailures(
  failures: StaticAssetBudgetFailure[],
): string {
  return [
    "Static asset budget check failed:",
    ...failures.map(
      (failure) =>
        `- ${failure.target.label} (${failure.target.directory}) ${failure.dimension}: ${failure.message}`,
    ),
  ].join("\n");
}

function countMatches(text: string, matcher: RegExp): number {
  return text.match(matcher)?.length ?? 0;
}

function listMatchingAssetPaths(
  directory: string,
  fileExtension: string,
): string[] {
  const results: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      results.push(...listMatchingAssetPaths(entryPath, fileExtension));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(fileExtension)) {
      results.push(entryPath);
    }
  }

  return results;
}

function extractTextContent(text: string, tagName: string): string | null {
  const match = text.match(
    new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"),
  );

  if (!match) {
    return null;
  }

  return (
    match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || null
  );
}
