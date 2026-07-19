/**
 * Static-export compile-graph contract for retired Atlas/AI routes and modules.
 *
 * After B09 domain cleanup, the supported `build:export` path must not compile
 * or emit HTML for deleted legacy route trees. This module:
 * - lists App Router `page.tsx` modules that Next will compile
 * - detects retired route modules / owned paths still present on disk
 * - scans `out/` for retired public-route HTML artifacts
 * - filters retired Atlas collection slugs out of docs `generateStaticParams`
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import {
  RETIRED_AI_CONTENT_OWNED_PATHS,
  RETIRED_COLLECTION_SECTION_IDS,
  RETIRED_PUBLIC_ROUTE_FAMILIES,
} from "@/lib/governance/retired-ai-content-infrastructure-denylist";
import { supportedLocales } from "@/lib/i18n/locale-routing";
import { DEFAULT_EXPORT_OUT_DIR } from "./export-out-directory";

/** Retired Atlas docs collection ids that must not enter static params. */
export const RETIRED_ATLAS_DOCS_COLLECTION_IDS = [
  "models",
  "modules",
  "papers",
  "training",
  "systems",
] as const;

export type RetiredAtlasDocsCollectionId =
  (typeof RETIRED_ATLAS_DOCS_COLLECTION_IDS)[number];

/**
 * Factory docs / site surfaces that must remain on the supported export path.
 * Architecture is a live browse index (not an Atlas collection).
 */
export const SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS = [
  "docs/guides/page.tsx",
  "docs/concepts/page.tsx",
  "docs/techniques/page.tsx",
  "docs/documentation/page.tsx",
  "docs/references/page.tsx",
  "docs/factories/page.tsx",
  "docs/workers/page.tsx",
  "docs/workstations/page.tsx",
  "blog/page.tsx",
] as const;

/** Extra retired public routes beyond `/docs/{models,modules,…}` families. */
export const ADDITIONAL_RETIRED_EXPORT_ROUTE_FAMILIES = [
  "/topology",
  "/docs/timeline",
] as const;

export type LegacyCompileGraphViolationKind =
  | "retired-app-route-module"
  | "retired-owned-path"
  | "retired-export-html"
  | "missing-factory-export-route";

export type LegacyCompileGraphViolation = {
  kind: LegacyCompileGraphViolationKind;
  path: string;
  detail: string;
};

export type LegacyCompileGraphAuditResult = {
  ok: boolean;
  violations: readonly LegacyCompileGraphViolation[];
  appPageModules: readonly string[];
};

const RETIRED_COLLECTION_ID_SET = new Set<string>([
  ...RETIRED_ATLAS_DOCS_COLLECTION_IDS,
  ...RETIRED_COLLECTION_SECTION_IDS,
]);

function normalizePosixPath(pathValue: string): string {
  return pathValue.split(sep).join("/");
}

/** True when a docs catch-all slug belongs to a retired Atlas collection. */
export function isRetiredAtlasDocsSlug(
  slug: readonly string[] | undefined,
): boolean {
  const section = slug?.[0];
  if (!section) {
    return false;
  }
  return RETIRED_COLLECTION_ID_SET.has(section);
}

/**
 * Drops retired Atlas collection params so static export never schedules
 * compile/render work for deleted `/docs/{models,modules,…}` trees.
 */
export function omitRetiredAtlasDocsStaticParams<
  T extends { slug?: string[] | undefined },
>(params: readonly T[]): T[] {
  return params.filter((entry) => !isRetiredAtlasDocsSlug(entry.slug));
}

/** Recursively lists `page.tsx` paths under `src/app`, relative to that root. */
export function listAppPageModulePaths(appDir: string): string[] {
  if (!existsSync(appDir)) {
    return [];
  }

  const pages: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const absolute = join(dir, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (entry === "page.tsx" || entry === "page.ts" || entry === "page.jsx") {
        pages.push(normalizePosixPath(relative(appDir, absolute)));
      }
    }
  };

  walk(appDir);
  return pages.sort();
}

/**
 * True when an App Router page module path is under a retired public route
 * family (route groups like `(site)` / `[locale]` are ignored).
 */
export function appPageModuleMatchesRetiredRouteFamily(
  pageModulePath: string,
): boolean {
  const segments = pageModulePath.split("/").filter((segment) => {
    if (segment.startsWith("(") && segment.endsWith(")")) {
      return false;
    }
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return false;
    }
    return (
      segment !== "page.tsx" && segment !== "page.ts" && segment !== "page.jsx"
    );
  });

  const routePath = `/${segments.join("/")}`;
  for (const family of [
    ...RETIRED_PUBLIC_ROUTE_FAMILIES,
    ...ADDITIONAL_RETIRED_EXPORT_ROUTE_FAMILIES,
  ]) {
    if (routePath === family || routePath.startsWith(`${family}/`)) {
      return true;
    }
  }
  return false;
}

function resolveProjectPath(projectRoot: string, relativePath: string): string {
  return isAbsolute(relativePath)
    ? relativePath
    : join(projectRoot, relativePath);
}

/** Collects retired owned paths that still exist on disk (reintroduction). */
export function findRetiredOwnedPathViolations(
  projectRoot: string,
): LegacyCompileGraphViolation[] {
  const violations: LegacyCompileGraphViolation[] = [];
  for (const ownedPath of RETIRED_AI_CONTENT_OWNED_PATHS) {
    const absolute = resolveProjectPath(projectRoot, ownedPath);
    if (existsSync(absolute)) {
      violations.push({
        kind: "retired-owned-path",
        path: ownedPath,
        detail: `Retired Atlas/AI owned path still exists and would re-enter the compile graph: ${ownedPath}`,
      });
    }
  }
  return violations;
}

/** Collects App Router page modules that map to retired public route families. */
export function findRetiredAppRouteModuleViolations(
  projectRoot: string,
): LegacyCompileGraphViolation[] {
  const appDir = join(projectRoot, "src/app");
  const pages = listAppPageModulePaths(appDir);
  const violations: LegacyCompileGraphViolation[] = [];

  for (const page of pages) {
    if (appPageModuleMatchesRetiredRouteFamily(page)) {
      violations.push({
        kind: "retired-app-route-module",
        path: `src/app/${page}`,
        detail: `Retired public route page module is still present for static export compilation: src/app/${page}`,
      });
    }
  }

  return violations;
}

/** Ensures required factory export route page modules still exist. */
export function findMissingFactoryExportRouteViolations(
  projectRoot: string,
): LegacyCompileGraphViolation[] {
  const appDir = join(projectRoot, "src/app");
  const pages = listAppPageModulePaths(appDir);
  const violations: LegacyCompileGraphViolation[] = [];

  for (const marker of SUPPORTED_FACTORY_EXPORT_APP_PAGE_MARKERS) {
    const present = pages.some(
      (page) => page === marker || page.endsWith(`/${marker}`),
    );
    if (!present) {
      violations.push({
        kind: "missing-factory-export-route",
        path: marker,
        detail: `Required factory export route page module is missing: ${marker}`,
      });
    }
  }

  return violations;
}

function listHtmlFilesUnder(dir: string): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current)) {
      const absolute = join(current, entry);
      const stats = statSync(absolute);
      if (stats.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (entry.endsWith(".html")) {
        files.push(absolute);
      }
    }
  };
  walk(dir);
  return files;
}

/**
 * Maps a retired public route family to relative `out/` HTML path prefixes
 * (default locale + localized prefixes).
 */
export function retiredExportHtmlPathPrefixes(
  routeFamily: string,
): readonly string[] {
  const trimmed = routeFamily.startsWith("/")
    ? routeFamily.slice(1)
    : routeFamily;
  const prefixes = [trimmed];
  for (const locale of supportedLocales) {
    if (locale === "en") {
      continue;
    }
    prefixes.push(`${locale}/${trimmed}`);
  }
  return prefixes;
}

function exportHtmlMatchesRetiredFamily(
  relativeHtmlPath: string,
  routeFamily: string,
): boolean {
  const normalized = normalizePosixPath(relativeHtmlPath);
  for (const prefix of retiredExportHtmlPathPrefixes(routeFamily)) {
    if (
      normalized === `${prefix}.html` ||
      normalized === `${prefix}/index.html` ||
      normalized.startsWith(`${prefix}/`)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Scans an export `out/` directory for HTML artifacts under retired public
 * route families. Missing `out/` is treated as not-yet-built (no violations).
 */
export function findRetiredExportHtmlViolations(
  outDir: string,
  cwd: string = process.cwd(),
): LegacyCompileGraphViolation[] {
  const absoluteOutDir = isAbsolute(outDir) ? outDir : join(cwd, outDir);
  if (!existsSync(absoluteOutDir)) {
    return [];
  }

  const htmlFiles = listHtmlFilesUnder(absoluteOutDir);
  const violations: LegacyCompileGraphViolation[] = [];
  const families = [
    ...RETIRED_PUBLIC_ROUTE_FAMILIES,
    ...ADDITIONAL_RETIRED_EXPORT_ROUTE_FAMILIES,
  ];

  for (const absoluteHtml of htmlFiles) {
    const relativeHtml = normalizePosixPath(
      relative(absoluteOutDir, absoluteHtml),
    );
    for (const family of families) {
      if (exportHtmlMatchesRetiredFamily(relativeHtml, family)) {
        violations.push({
          kind: "retired-export-html",
          path: relativeHtml,
          detail: `Static export emitted HTML for retired route family ${family}: ${relativeHtml}`,
        });
        break;
      }
    }
  }

  return violations;
}

export type AuditStaticExportLegacyCompileGraphOptions = {
  projectRoot: string;
  /** When set, also scan this export directory for retired HTML. */
  outDir?: string;
  /** When false, skip the factory-route presence check. Default true. */
  requireFactoryRoutes?: boolean;
};

/**
 * Full compile-graph audit for the supported static-export path: no retired
 * app modules / owned paths, no retired `out/` HTML, factory routes present.
 */
export function auditStaticExportLegacyCompileGraph(
  options: AuditStaticExportLegacyCompileGraphOptions,
): LegacyCompileGraphAuditResult {
  const {
    projectRoot,
    outDir = DEFAULT_EXPORT_OUT_DIR,
    requireFactoryRoutes = true,
  } = options;

  const appPageModules = listAppPageModulePaths(join(projectRoot, "src/app"));
  const violations = [
    ...findRetiredAppRouteModuleViolations(projectRoot),
    ...findRetiredOwnedPathViolations(projectRoot),
    ...findRetiredExportHtmlViolations(outDir, projectRoot),
    ...(requireFactoryRoutes
      ? findMissingFactoryExportRouteViolations(projectRoot)
      : []),
  ];

  return {
    ok: violations.length === 0,
    violations,
    appPageModules,
  };
}

export function formatLegacyCompileGraphAudit(
  result: LegacyCompileGraphAuditResult,
): string {
  if (result.ok) {
    return [
      "static-export-legacy-compile-graph: ok",
      `appPageModules=${result.appPageModules.length}`,
      "retiredRouteFamilies=absent",
      "retiredOwnedPaths=absent",
      "retiredExportHtml=absent",
    ].join("\n");
  }

  const lines = [
    "static-export-legacy-compile-graph: FAIL",
    `violations=${result.violations.length}`,
  ];
  for (const violation of result.violations) {
    lines.push(`- [${violation.kind}] ${violation.path}: ${violation.detail}`);
  }
  return `${lines.join("\n")}\n`;
}
