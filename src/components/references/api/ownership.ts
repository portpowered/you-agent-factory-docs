/**
 * W08 production API renderer ownership fence.
 *
 * Prefer importing from `@/components/references/api` for OpenAPI API UI.
 * Keep W01/W02 spike trees, W07 schema UI, W09 event catalog, and W10 family
 * renderers outside this ownership surface except when migrating a reusable
 * helper into production.
 */

/** Repo-relative ownership root for W08 components and helpers. */
export const API_REFERENCE_OWNERSHIP_ROOT =
  "src/components/references/api" as const;

/** Preferred import alias for the production API surface. */
export const API_REFERENCE_OWNERSHIP_IMPORT =
  "@/components/references/api" as const;

/**
 * Trees that must not own the production API renderer.
 * Spike trees may donate migrated helpers; they remain non-production.
 */
export const API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS = [
  "src/lib/references-openapi-spike",
  "src/lib/references-sse-asyncapi-spike",
  "src/components/references/schema",
  "src/components/references/cli",
  "src/components/references/mcp",
  "src/components/references/javascript",
  "src/components/references/harness",
] as const;

export type ApiReferenceForbiddenOwnershipRoot =
  (typeof API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS)[number];

/** True when a path is under the W08 production API ownership root. */
export function isApiReferenceOwnershipPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return (
    normalized === API_REFERENCE_OWNERSHIP_ROOT ||
    normalized.startsWith(`${API_REFERENCE_OWNERSHIP_ROOT}/`)
  );
}

/** True when a path sits under a tree that must not own W08 production UI. */
export function isForbiddenApiReferenceOwnershipPath(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return API_REFERENCE_FORBIDDEN_OWNERSHIP_ROOTS.some(
    (root) => normalized === root || normalized.startsWith(`${root}/`),
  );
}
