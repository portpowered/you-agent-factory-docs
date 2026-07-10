import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Architecture/authoring docs this lane owns for product framing.
 * Keep the scan scoped here — not the full historical docs/internal archive.
 */
export const RETIRED_PRODUCT_DOCS_OWNED_PATHS = [
  "docs/site-fundamentals.md",
  "docs/data-model.md",
  "docs/architecture.md",
  "docs/documentation-template.md",
  "docs/guide-to-writing-pages.md",
  "docs/contributors/CONTRIBUTING.md",
  "docs/architectural-checklist.md",
  "factory/docs/standards/docs-writing-standards.md",
] as const;

export type RetiredProductDocsOwnedPath =
  (typeof RETIRED_PRODUCT_DOCS_OWNED_PATHS)[number];

export const RETIRED_PRODUCT_NAMES = [
  "Model Reference",
  "Model Atlas",
  "Learn Language Models",
] as const;

export type RetiredProductName = (typeof RETIRED_PRODUCT_NAMES)[number];

export const RETIRED_PUBLIC_ROUTE_FAMILIES = [
  "/docs/models",
  "/docs/modules",
  "/docs/papers",
  "/docs/training",
] as const;

export type RetiredPublicRouteFamily =
  (typeof RETIRED_PUBLIC_ROUTE_FAMILIES)[number];

export type RetiredProductDocsFindingKind =
  | "retired-product-name"
  | "retired-route-family";

export type RetiredProductDocsFinding = {
  kind: RetiredProductDocsFindingKind;
  line: number;
  matchedText: string;
  path: string;
  snippet: string;
};

export type RetiredProductDocsConsistencyResult = {
  findings: readonly RetiredProductDocsFinding[];
  ok: boolean;
  scannedPaths: readonly string[];
};

const PRODUCT_NAME_PATTERN = new RegExp(
  `\\b(${RETIRED_PRODUCT_NAMES.map(escapeRegExp).join("|")})\\b`,
  "gi",
);

/**
 * Public route families taught as live destinations.
 * Also catches PAGE=docs/modules/... style Atlas contributor examples.
 */
const ROUTE_FAMILY_PATTERN =
  /(?:^|[^/\w])(\/docs\/(?:models|modules|papers|training)(?:\/[\w-]+)*|PAGE=docs\/(?:models|modules|papers|training)(?:\/[\w./-]*)?)/gi;

/**
 * Exclusion / retirement / demotion wording that may mention retired names or
 * routes without presenting them as the current product.
 */
const EXCLUSION_CONTEXT_PATTERN =
  /\b(?:not|never|retired|exclude|exclusion|denylist|atlas-era|sibling atlas|sometimes called|only to exclude|do not|don't|not required|not the primary|not a mandatory|not mandatory|migration leftover|leftovers?|what this is not|no longer|demoted|must not|should not)\b/i;

const CONTEXT_WINDOW_LINES = 2;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isRetiredProductExclusionContext(context: string): boolean {
  return EXCLUSION_CONTEXT_PATTERN.test(context);
}

function buildContextWindow(
  lines: readonly string[],
  lineIndex: number,
): string {
  const start = Math.max(0, lineIndex - CONTEXT_WINDOW_LINES);
  const end = Math.min(lines.length, lineIndex + CONTEXT_WINDOW_LINES + 1);
  return lines.slice(start, end).join("\n");
}

function collectProductNameFindings(
  path: string,
  lines: readonly string[],
): RetiredProductDocsFinding[] {
  const findings: RetiredProductDocsFinding[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    PRODUCT_NAME_PATTERN.lastIndex = 0;
    let match = PRODUCT_NAME_PATTERN.exec(line);
    while (match) {
      const matchedText = match[1] ?? match[0];
      const context = buildContextWindow(lines, index);
      if (!isRetiredProductExclusionContext(context)) {
        findings.push({
          kind: "retired-product-name",
          line: index + 1,
          matchedText,
          path,
          snippet: line.trim(),
        });
      }
      match = PRODUCT_NAME_PATTERN.exec(line);
    }
  }

  return findings;
}

function collectRouteFamilyFindings(
  path: string,
  lines: readonly string[],
): RetiredProductDocsFinding[] {
  const findings: RetiredProductDocsFinding[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    ROUTE_FAMILY_PATTERN.lastIndex = 0;
    let match = ROUTE_FAMILY_PATTERN.exec(line);
    while (match) {
      const matchedText = match[1] ?? match[0];
      const context = buildContextWindow(lines, index);
      if (!isRetiredProductExclusionContext(context)) {
        findings.push({
          kind: "retired-route-family",
          line: index + 1,
          matchedText,
          path,
          snippet: line.trim(),
        });
      }
      match = ROUTE_FAMILY_PATTERN.exec(line);
    }
  }

  return findings;
}

/**
 * Scan markdown content for retired product-identity and route-family
 * regressions. Pure: callers supply path + content (tests use fixtures).
 */
export function scanRetiredProductDocsContent(
  path: string,
  content: string,
): readonly RetiredProductDocsFinding[] {
  const lines = content.split(/\r?\n/);
  return [
    ...collectProductNameFindings(path, lines),
    ...collectRouteFamilyFindings(path, lines),
  ];
}

export function collectRetiredProductDocsConsistency(options: {
  exists?: (absolutePath: string) => boolean;
  readFile?: (absolutePath: string) => string;
  repoRoot: string;
  paths?: readonly string[];
}): RetiredProductDocsConsistencyResult {
  const paths = options.paths ?? [...RETIRED_PRODUCT_DOCS_OWNED_PATHS];
  const exists =
    options.exists ?? ((absolutePath: string) => existsSync(absolutePath));
  const readFile =
    options.readFile ??
    ((absolutePath: string) => readFileSync(absolutePath, "utf8"));
  const findings: RetiredProductDocsFinding[] = [];
  const scannedPaths: string[] = [];

  for (const relativePath of paths) {
    const absolutePath = join(options.repoRoot, relativePath);
    if (!exists(absolutePath)) {
      findings.push({
        kind: "retired-product-name",
        line: 0,
        matchedText: relativePath,
        path: relativePath,
        snippet: `Owned architecture/authoring path is missing: ${relativePath}`,
      });
      continue;
    }

    scannedPaths.push(relativePath);
    findings.push(
      ...scanRetiredProductDocsContent(relativePath, readFile(absolutePath)),
    );
  }

  return {
    findings,
    ok: findings.length === 0,
    scannedPaths,
  };
}

export function formatRetiredProductDocsConsistency(
  result: RetiredProductDocsConsistencyResult,
): string {
  const lines = [
    "Retired product docs consistency check",
    `Scanned paths: ${result.scannedPaths.length}`,
    `Status: ${result.ok ? "pass" : "fail"}`,
  ];

  if (result.findings.length === 0) {
    lines.push("No retired product-name or route-family regressions found.");
    return `${lines.join("\n")}\n`;
  }

  lines.push(`Findings: ${result.findings.length}`);
  for (const finding of result.findings) {
    const location =
      finding.line > 0 ? `${finding.path}:${finding.line}` : finding.path;
    lines.push(
      `- [${finding.kind}] ${location}: ${finding.matchedText} — ${finding.snippet}`,
    );
  }

  return `${lines.join("\n")}\n`;
}
