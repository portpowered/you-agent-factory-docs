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
 * Reviewer-visible summary of what the current contract enforces and why the
 * boundary is scoped to the practical component-package surface in this repo.
 */
export const COMPONENT_COVERAGE_PRACTICAL_CONTRACT_SUMMARY =
  "Enforces aggregate line coverage at or above the configured threshold for TypeScript and TSX files under src/components only. This repo's shared UI components currently live in a single directory rather than discrete npm-style packages, so file-group enforcement under src/components is the practical current contract.";

/**
 * Maintainer-facing steps for extending coverage without replacing the root
 * make component-coverage or make component-coverage-boundary command contract.
 */
export const COMPONENT_COVERAGE_EXTENSION_PATH_STEPS = [
  "Add new shared UI components under src/components; they are picked up automatically by listEnforcedComponentSourceFiles.",
  "To bring additional component-adjacent surfaces into scope later, update COMPONENT_COVERAGE_ENFORCED_ROOT or remove matching entries from COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES with an explicit rationale.",
  "Keep COMPONENT_COVERAGE_PATH_IGNORE_PATTERNS and bunfig.toml coveragePathIgnorePatterns aligned when widening measurement scope.",
  "Continue using make component-coverage for threshold enforcement and make component-coverage-boundary for the reviewer-visible contract; later lanes extend this wiring instead of introducing a parallel runner.",
] as const;

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

export function formatComponentCoverageContractLimitations(): string {
  const outOfScopeLines = COMPONENT_COVERAGE_OUT_OF_SCOPE_SURFACES.map(
    (item) => `  - ${item.surface}: ${item.reason}`,
  ).join("\n");

  const extensionPathLines = COMPONENT_COVERAGE_EXTENSION_PATH_STEPS.map(
    (step) => `  - ${step}`,
  ).join("\n");

  return [
    "Component coverage enforcement contract (current practical boundary):",
    `  ${COMPONENT_COVERAGE_PRACTICAL_CONTRACT_SUMMARY}`,
    `  Threshold for the enforced surface remains ${COMPONENT_COVERAGE_THRESHOLD_PERCENT}% aggregate line coverage; out-of-scope surfaces are excluded from measurement, not held to a lower bar.`,
    "Surfaces not enforced by this lane yet:",
    outOfScopeLines,
    "Extension path for later coverage expansion:",
    extensionPathLines,
  ].join("\n");
}

export function formatComponentCoverageBoundaryReport(
  repoRoot: string,
): string {
  const enforcedFiles = listEnforcedComponentSourceFiles(repoRoot);
  const enforcedFileLines =
    enforcedFiles.length > 0
      ? enforcedFiles.map((file) => `  - ${file}`).join("\n")
      : "  - (no component source files discovered yet)";

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
    "Coverage measurement ignore patterns (checked in via bunfig.toml):",
    ignorePatternLines,
    "",
    formatComponentCoverageContractLimitations(),
  ].join("\n");
}
