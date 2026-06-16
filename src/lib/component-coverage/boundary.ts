import { readdirSync } from "node:fs";
import { join, posix } from "node:path";

/** Minimum line coverage for the practical component-package surface. */
export const COMPONENT_COVERAGE_THRESHOLD_PERCENT = 90;

/** Root directory for enforced shared UI components (relative to repo root). */
export const COMPONENT_COVERAGE_ENFORCED_ROOT = "src/components";

/** Glob for enforced component source files. */
export const COMPONENT_COVERAGE_ENFORCED_FILE_GLOB =
  "src/components/**/*.{ts,tsx}";

/** Reviewer-visible surfaces intentionally excluded from component coverage enforcement. */
export const COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES = [
  {
    surface: "src/app",
    reason:
      "App Router route entrypoints are thin composition layers; reusable UI behavior is enforced through src/components.",
  },
  {
    surface: "src/lib",
    reason:
      "Shared non-UI constants and utilities are validated through unit tests, not the component coverage gate.",
  },
  {
    surface: "search generation and content loading",
    reason:
      "Search and canonical content pipelines are outside this lane until dedicated foundations land.",
  },
  {
    surface: "localization catalogs and formatting hooks",
    reason:
      "Localization behavior is enforced through its own validation lane rather than package-level component coverage.",
  },
  {
    surface: "deployment, CI automation, and factory tooling",
    reason:
      "Build, deploy, and agent-factory surfaces are not part of the docs-site component package contract.",
  },
] as const;

export type ComponentCoverageOutOfScopeSurface =
  (typeof COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES)[number];

/**
 * Bun coverage ignore patterns that scope measurement to the practical
 * component-package surface. Everything matching these patterns is out of scope.
 */
export const COMPONENT_COVERAGE_PATH_IGNORE_PATTERNS = [
  "tests/**",
  "scripts/**",
  "factory/**",
  "next.config.ts",
  "src/app/**",
  "src/lib/**",
] as const;

const ENFORCED_SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

function normalizeRepoRelativePath(relativePath: string): string {
  return posix.normalize(relativePath.split("\\").join("/"));
}

export function isPathInEnforcedComponentBoundary(
  relativePath: string,
): boolean {
  const normalized = normalizeRepoRelativePath(relativePath);

  if (
    !normalized.startsWith(`${COMPONENT_COVERAGE_ENFORCED_ROOT}/`) &&
    normalized !== COMPONENT_COVERAGE_ENFORCED_ROOT
  ) {
    return false;
  }

  const extension = posix.extname(normalized);
  return ENFORCED_SOURCE_EXTENSIONS.has(extension);
}

function walkComponentSourceFiles(
  absoluteDirectory: string,
  repoRoot: string,
  discovered: string[],
): void {
  for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true })) {
    const absolutePath = join(absoluteDirectory, entry.name);

    if (entry.isDirectory()) {
      walkComponentSourceFiles(absolutePath, repoRoot, discovered);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const relativePath = normalizeRepoRelativePath(
      posix.relative(repoRoot, absolutePath),
    );

    if (isPathInEnforcedComponentBoundary(relativePath)) {
      discovered.push(relativePath);
    }
  }
}

export function listEnforcedComponentSourceFiles(repoRoot: string): string[] {
  const enforcedRoot = join(repoRoot, COMPONENT_COVERAGE_ENFORCED_ROOT);
  const discovered: string[] = [];

  walkComponentSourceFiles(enforcedRoot, repoRoot, discovered);
  return discovered.sort();
}

export function formatComponentCoverageBoundaryReport(
  repoRoot: string,
): string {
  const enforcedFiles = listEnforcedComponentSourceFiles(repoRoot);
  const enforcedFileLines =
    enforcedFiles.length > 0
      ? enforcedFiles.map((file) => `  - ${file}`).join("\n")
      : "  - (no component source files discovered yet)";

  const outOfScopeLines = COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES.map(
    (item) => `  - ${item.surface}: ${item.reason}`,
  ).join("\n");

  const ignorePatternLines = COMPONENT_COVERAGE_PATH_IGNORE_PATTERNS.map(
    (pattern) => `  - ${pattern}`,
  ).join("\n");

  return [
    "Component coverage enforcement boundary",
    `Threshold: ${COMPONENT_COVERAGE_THRESHOLD_PERCENT}% line coverage for the practical component-package surface.`,
    `Enforced root: ${COMPONENT_COVERAGE_ENFORCED_ROOT}`,
    `Enforced file glob: ${COMPONENT_COVERAGE_ENFORCED_FILE_GLOB}`,
    "Enforced component source files:",
    enforcedFileLines,
    "Out of scope for this lane:",
    outOfScopeLines,
    "Coverage measurement ignore patterns (checked in via bunfig.toml):",
    ignorePatternLines,
  ].join("\n");
}
