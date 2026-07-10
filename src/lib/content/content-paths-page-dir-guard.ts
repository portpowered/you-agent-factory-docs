/**
 * Guard against new ordinary docs page directory exports in content-paths.ts.
 *
 * Routine canonical pages should use getDocsPageDir instead of adding
 * page-specific `_PAGE_DIR` constants. Existing exports are grandfathered via
 * {@link ALLOWED_ORDINARY_PAGE_DIR_EXPORTS}.
 */

/** Grandfathered page-specific directory exports that predate derived lookup. */
export const ALLOWED_ORDINARY_PAGE_DIR_EXPORTS = [] as const;

const PAGE_DIR_EXPORT_PATTERN = /^export const (\w+_PAGE_DIR)\s*=/gm;

/** Collect exported `*_PAGE_DIR` constant names from a content-paths.ts source string. */
export function findExportedPageDirConstants(source: string): string[] {
  return [...source.matchAll(PAGE_DIR_EXPORT_PATTERN)]
    .map((match) => match[1])
    .sort();
}

/** Return page-directory exports that are not on the grandfathered allowlist. */
export function findNewOrdinaryPageDirExports(
  source: string,
  allowed: readonly string[] = ALLOWED_ORDINARY_PAGE_DIR_EXPORTS,
): string[] {
  const allowedNames = new Set(allowed);
  return findExportedPageDirConstants(source).filter(
    (name) => !allowedNames.has(name),
  );
}

/** Format a guard failure message that points callers at derived lookup. */
export function formatNewPageDirExportViolation(exports: string[]): string {
  const replacementExample = `getDocsPageDir("concepts", "my-page-slug")`;

  return [
    "content-paths.ts exports new ordinary docs page directory constants:",
    ...exports.map((name) => `  - ${name}`),
    "",
    "Routine canonical pages should not add page-specific constants here.",
    `Compute page directories from section and slug instead, e.g. ${replacementExample}.`,
    "Shared roots and section roots (getDocsRoot, getDocsSectionRoot, get*DocsRoot) remain allowed.",
    "See getDocsPageDir in content-paths.ts.",
  ].join("\n");
}
