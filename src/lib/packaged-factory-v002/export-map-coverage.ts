/**
 * Pure helpers for checking whether a package `exports` map covers a required
 * subpath. Fail closed when `exports` is missing or does not match.
 */

export type PackageExportsMap = Record<string, unknown>;

/**
 * Normalize a package.json `exports` value into a flat subpath → target map.
 * Conditional export objects are treated as present (coverage only cares that
 * the key exists). Returns null when exports are absent or not an object map.
 */
export function normalizePackageExportsMap(
  exportsField: unknown,
): PackageExportsMap | null {
  if (exportsField === undefined || exportsField === null) {
    return null;
  }

  // Legacy string / array export forms are not used by this family and are not
  // enough to prove documented subpath coverage.
  if (typeof exportsField === "string" || Array.isArray(exportsField)) {
    return null;
  }

  if (typeof exportsField !== "object") {
    return null;
  }

  return exportsField as PackageExportsMap;
}

/**
 * True when `exportSubpath` (for example `.`, `./styles.css`,
 * `./factories/deep-research.json`) is covered by an exact or single-segment
 * `*` pattern key in the exports map.
 */
export function packageExportsMapCoversSubpath(
  exportsMap: PackageExportsMap | null,
  exportSubpath: string,
): boolean {
  if (exportsMap === null) {
    return false;
  }

  if (Object.hasOwn(exportsMap, exportSubpath)) {
    return true;
  }

  for (const pattern of Object.keys(exportsMap)) {
    if (matchesNodeExportPattern(pattern, exportSubpath)) {
      return true;
    }
  }

  return false;
}

/**
 * Node package-exports pattern match for a single `*` replacing one path
 * segment (for example `./factories/*.json` ↔ `./factories/deep-research.json`).
 */
export function matchesNodeExportPattern(
  pattern: string,
  subpath: string,
): boolean {
  if (!pattern.includes("*")) {
    return pattern === subpath;
  }

  const starIndex = pattern.indexOf("*");
  if (pattern.indexOf("*", starIndex + 1) !== -1) {
    // Multi-star patterns are out of scope for this Batch 1 contract.
    return false;
  }

  const prefix = pattern.slice(0, starIndex);
  const suffix = pattern.slice(starIndex + 1);
  if (!subpath.startsWith(prefix) || !subpath.endsWith(suffix)) {
    return false;
  }

  const matched = subpath.slice(prefix.length, subpath.length - suffix.length);
  if (matched.length === 0) {
    return false;
  }

  // A single `*` matches exactly one path segment (no `/`).
  return !matched.includes("/");
}
