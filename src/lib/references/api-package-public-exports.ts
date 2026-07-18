/**
 * Documented public subpath surface for `@you-agent-factory/api`.
 *
 * Pure allowlist helpers used by the build/server artifact resolver. Keep this
 * module free of filesystem and package-resolution IO so client code cannot
 * accidentally pull Node acquisition paths through this contract list alone.
 */

export const API_PACKAGE_NAME = "@you-agent-factory/api" as const;

/**
 * Fixed public subpaths published by the installed package's `exports` map.
 * Joined contracts use the `joined/*` wildcard and are validated separately.
 */
export const API_PACKAGE_FIXED_PUBLIC_SUBPATHS = [
  "manifest",
  "openapi",
  "cli",
  "mcp",
  "schemas/you-config",
  "schemas/factory",
  "schemas/mock-workers",
  "javascript/runtime",
] as const;

export type ApiPackageFixedPublicSubpath =
  (typeof API_PACKAGE_FIXED_PUBLIC_SUBPATHS)[number];

const FIXED_PUBLIC_SUBPATH_SET = new Set<string>(
  API_PACKAGE_FIXED_PUBLIC_SUBPATHS,
);

const PACKAGE_ROOT_SPECIFIERS = new Set<string>([
  API_PACKAGE_NAME,
  `${API_PACKAGE_NAME}/`,
]);

/**
 * True when `subpath` is a documented fixed public export or a `joined/*`
 * public wildcard export (no `..` segments).
 */
export function isDocumentedApiPackagePublicSubpath(subpath: string): boolean {
  if (FIXED_PUBLIC_SUBPATH_SET.has(subpath)) {
    return true;
  }

  return isJoinedPublicSubpath(subpath);
}

function isJoinedPublicSubpath(subpath: string): boolean {
  if (!subpath.startsWith("joined/")) {
    return false;
  }

  const remainder = subpath.slice("joined/".length);
  if (remainder.length === 0) {
    return false;
  }

  if (remainder.includes("\\") || remainder.includes("\0")) {
    return false;
  }

  const segments = remainder.split("/");
  return segments.every(
    (segment) => segment.length > 0 && segment !== "." && segment !== "..",
  );
}

/**
 * Normalize a caller target into `{ packageName, subpath }` when the target is
 * a package export specifier or bare documented subpath. Returns null when the
 * string is not a package-export-shaped target (for example a filesystem path).
 */
export function parseApiPackageExportTarget(target: string): {
  packageName: string;
  subpath: string;
} | null {
  const trimmed = target.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (looksLikeFilesystemOrUrlTarget(trimmed)) {
    return null;
  }

  if (PACKAGE_ROOT_SPECIFIERS.has(trimmed)) {
    return { packageName: API_PACKAGE_NAME, subpath: "" };
  }

  if (trimmed.startsWith(`${API_PACKAGE_NAME}/`)) {
    return {
      packageName: API_PACKAGE_NAME,
      subpath: trimmed.slice(API_PACKAGE_NAME.length + 1),
    };
  }

  // Bare documented subpath shorthand (for example "manifest" or "cli").
  if (!trimmed.includes(":") && !trimmed.startsWith("@")) {
    return { packageName: API_PACKAGE_NAME, subpath: trimmed };
  }

  return null;
}

/**
 * Build the canonical public export specifier for a documented subpath.
 */
export function toApiPackageExportSpecifier(subpath: string): string {
  return `${API_PACKAGE_NAME}/${subpath}`;
}

function looksLikeFilesystemOrUrlTarget(target: string): boolean {
  if (
    target.startsWith("/") ||
    target.startsWith("./") ||
    target.startsWith("../") ||
    target.startsWith("file:") ||
    target.startsWith("http:") ||
    target.startsWith("https:") ||
    /^[A-Za-z]:[\\/]/.test(target)
  ) {
    return true;
  }

  // Raw package-tree paths that bypass the exports map.
  if (
    target.includes("node_modules/@you-agent-factory/api/") ||
    target.includes("@you-agent-factory/api/generated/") ||
    /(^|\/)generated\//.test(target)
  ) {
    // Allow the package-export form `@you-agent-factory/api/generated/...` to
    // fall through to export parsing so callers get an illegal-subpath error
    // naming that export target. Bare `generated/...` and filesystem forms
    // remain filesystem/url targets.
    if (target.startsWith(`${API_PACKAGE_NAME}/`)) {
      return false;
    }
    return true;
  }

  return false;
}
