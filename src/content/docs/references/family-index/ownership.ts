/**
 * W11 references family index ownership fence.
 *
 * Prefer importing from `@/content/docs/references/family-index` for the
 * `/docs/references` landing surface. Keep sibling W11 page bodies and foreign
 * family renderer trees outside this ownership surface.
 */

import { REFERENCE_FAMILY_DISCOVERABILITY_ROUTES } from "./reference-family-routes";

/** Repo-relative ownership root for the references family index. */
export const REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT =
  "src/content/docs/references/family-index" as const;

/** Preferred import alias for the family-index ownership surface. */
export const REFERENCES_FAMILY_INDEX_OWNERSHIP_IMPORT =
  "@/content/docs/references/family-index" as const;

/**
 * Foreign renderer trees that must not own the family index.
 * Sibling contract pages land in parallel W11 slices; this lane only links.
 */
export const REFERENCES_FAMILY_INDEX_FORBIDDEN_RENDERER_ROOTS = [
  "src/features/references/api",
  "src/features/references/schema",
  "src/features/references/events",
  "src/features/references/cli",
  "src/features/references/mcp",
  "src/features/references/javascript",
] as const;

/**
 * Sibling reference page body roots this lane must not author.
 * Discoverability hrefs may target these routes before bodies publish.
 */
export const REFERENCES_FAMILY_INDEX_FORBIDDEN_SIBLING_PAGE_ROOTS =
  REFERENCE_FAMILY_DISCOVERABILITY_ROUTES.map(
    (route) => `src/content/docs/references/${route.id}` as const,
  );

/** Direct route-family content trees owned by other W05/W12–W14 lanes. */
export const REFERENCES_FAMILY_INDEX_FORBIDDEN_ROUTE_FAMILY_ROOTS = [
  "src/content/docs/factories",
  "src/content/docs/workers",
  "src/content/docs/workstations",
] as const;

export type ReferencesFamilyIndexForbiddenRendererRoot =
  (typeof REFERENCES_FAMILY_INDEX_FORBIDDEN_RENDERER_ROOTS)[number];

export type ReferencesFamilyIndexForbiddenSiblingPageRoot =
  (typeof REFERENCES_FAMILY_INDEX_FORBIDDEN_SIBLING_PAGE_ROOTS)[number];

export type ReferencesFamilyIndexForbiddenRouteFamilyRoot =
  (typeof REFERENCES_FAMILY_INDEX_FORBIDDEN_ROUTE_FAMILY_ROOTS)[number];

function matchesRoot(path: string, root: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  return normalized === root || normalized.startsWith(`${root}/`);
}

/** True when a path is under the W11 references family index ownership root. */
export function isReferencesFamilyIndexOwnershipPath(path: string): boolean {
  return matchesRoot(path, REFERENCES_FAMILY_INDEX_OWNERSHIP_ROOT);
}

/** True when a path sits under a foreign family renderer tree. */
export function isForbiddenReferencesFamilyRendererPath(path: string): boolean {
  return REFERENCES_FAMILY_INDEX_FORBIDDEN_RENDERER_ROOTS.some((root) =>
    matchesRoot(path, root),
  );
}

/** True when a path is a sibling W11 reference page body this lane must not author. */
export function isForbiddenReferencesFamilySiblingPagePath(
  path: string,
): boolean {
  return REFERENCES_FAMILY_INDEX_FORBIDDEN_SIBLING_PAGE_ROOTS.some((root) =>
    matchesRoot(path, root),
  );
}

/** True when a path sits under factories/workers/workstations content. */
export function isForbiddenReferencesFamilyRouteFamilyPath(
  path: string,
): boolean {
  return REFERENCES_FAMILY_INDEX_FORBIDDEN_ROUTE_FAMILY_ROOTS.some((root) =>
    matchesRoot(path, root),
  );
}
