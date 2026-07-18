import {
  DIRECT_DOCS_ROUTE_FAMILY_IDS,
  type DirectDocsRouteFamilyId,
} from "@/lib/docs/collection-definition-contract";

/**
 * App Router page modules for the four direct route-family collection indexes.
 * These are statically generated as dedicated routes (not catch-all params).
 */
export const DIRECT_DOCS_ROUTE_FAMILY_INDEX_APP_PAGE_MARKERS = [
  "docs/references/page.tsx",
  "docs/factories/page.tsx",
  "docs/workers/page.tsx",
  "docs/workstations/page.tsx",
] as const;

/** Splits a docs slug into catch-all `generateStaticParams` slug segments. */
export function docsSlugToCatchAllStaticParamSlug(docsSlug: string): string[] {
  return docsSlug.split("/").filter(Boolean);
}

/** True when a docs slug is under a W05 direct route family (index or nested). */
export function isDirectDocsRouteFamilySlug(docsSlug: string): boolean {
  return DIRECT_DOCS_ROUTE_FAMILY_IDS.some(
    (id) => docsSlug === id || docsSlug.startsWith(`${id}/`),
  );
}

/** True when a catch-all slug array belongs to a direct route family. */
export function isDirectDocsRouteFamilyCatchAllSlug(
  slug: readonly string[] | undefined,
): boolean {
  const section = slug?.[0];
  if (!section) {
    return false;
  }
  return (DIRECT_DOCS_ROUTE_FAMILY_IDS as readonly string[]).includes(section);
}

/**
 * Builds catch-all static params from discovered docs slugs.
 * Nested slugs (`workers/agent/variant`) become multi-segment `slug` arrays.
 */
export function buildDocsCatchAllStaticParamsFromDocsSlugs(
  docsSlugs: readonly string[],
): Array<{ slug: string[] }> {
  return docsSlugs.map((docsSlug) => ({
    slug: docsSlugToCatchAllStaticParamSlug(docsSlug),
  }));
}

/**
 * Filters discovered docs slugs to nested pages under the four direct route
 * families (two or more segments after joining).
 */
export function listDirectRouteFamilyNestedDocsSlugs(
  docsSlugs: readonly string[],
): string[] {
  return docsSlugs.filter((docsSlug) => {
    if (!isDirectDocsRouteFamilySlug(docsSlug)) {
      return false;
    }
    const segments = docsSlugToCatchAllStaticParamSlug(docsSlug);
    return segments.length >= 2;
  });
}

/** Dedupes catch-all static param entries by joined slug path. */
export function mergeDocsCatchAllStaticParams<
  T extends { slug?: string[] | undefined },
>(...groups: readonly (readonly T[])[]): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const group of groups) {
    for (const entry of group) {
      const key = (entry.slug ?? []).join("/");
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(entry);
    }
  }

  return merged;
}

export function isDirectDocsRouteFamilyId(
  value: string,
): value is DirectDocsRouteFamilyId {
  return (DIRECT_DOCS_ROUTE_FAMILY_IDS as readonly string[]).includes(value);
}
