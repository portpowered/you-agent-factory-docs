import type { DocsCollectionId } from "@/lib/docs/collection-definition-contract";
import {
  getDocsCollectionDefinition,
  listDocsCollectionDefinitions,
} from "@/lib/docs/docs-collection-definitions";

/** Rewrite-era CLI collection ids whose route prefixes must be source-accepted. */
export const CLI_DOCS_COLLECTION_IDS = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
] as const satisfies readonly DocsCollectionId[];

export type CliDocsCollectionId = (typeof CLI_DOCS_COLLECTION_IDS)[number];

const acceptedRouteSlugs = new Set(
  listDocsCollectionDefinitions().map((definition) => definition.routeSlug),
);

/**
 * True when a docs path section segment is a registered collection route slug.
 * Used by Fumadocs source slug mapping and local page-bundle path checks.
 */
export function isAcceptedDocsSourceSection(section: string): boolean {
  return acceptedRouteSlugs.has(section as DocsCollectionId);
}

/**
 * Resolves the collection id for a docs slug by route-slug prefix
 * (`guides/…`, `concepts/…`, …), independent of frontmatter kind.
 */
export function resolveDocsCollectionIdFromDocsSlug(
  docsSlug: string,
): DocsCollectionId | null {
  for (const definition of listDocsCollectionDefinitions()) {
    if (docsSlug.startsWith(`${definition.routeSlug}/`)) {
      return definition.id;
    }
  }

  return null;
}

/** True when a docs slug belongs to the given collection via its route-slug prefix. */
export function docsSlugBelongsToCollection(
  docsSlug: string,
  collectionId: DocsCollectionId,
): boolean {
  const definition = getDocsCollectionDefinition(collectionId);
  return docsSlug.startsWith(`${definition.routeSlug}/`);
}

/** True when a docs slug belongs to one of the four CLI collections. */
export function docsSlugBelongsToCliCollection(
  docsSlug: string,
  collectionId: CliDocsCollectionId,
): boolean {
  return docsSlugBelongsToCollection(docsSlug, collectionId);
}
