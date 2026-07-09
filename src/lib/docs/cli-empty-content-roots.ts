import {
  type DocsSection,
  getDocsSectionRoot,
  getRegistryCollectionRoot,
  type RegistryCollection,
} from "@/lib/content/content-paths";
import type { DocsCollectionId } from "@/lib/docs/collection-definition-contract";
import { getDocsCollectionDefinition } from "@/lib/docs/docs-collection-definitions";
import {
  CLI_DOCS_COLLECTION_IDS,
  type CliDocsCollectionId,
} from "@/lib/docs/docs-collection-slug-acceptance";

/**
 * Docs content sections that are rewrite-era CLI collection targets.
 * `guides` and `techniques` still ship empty of authored page bundles.
 * `documentation` may contain authored topic pages. `concepts` is designated
 * the same CLI target (empty starters) while remaining Atlas concept pages
 * stay until `rewrite-delete-atlas-domain`.
 */
export const CLI_DOCS_CONTENT_ROOT_SECTIONS = CLI_DOCS_COLLECTION_IDS;

/**
 * Registry directories that must stay empty of authored CLI topic records in
 * this lane. Concepts keep existing Atlas registry records until the delete
 * lane owns removal. `documentation` is omitted because authored documentation
 * topic records are allowed.
 */
export const EMPTY_CLI_REGISTRY_COLLECTION_DIRS = [
  "guides",
  "techniques",
] as const satisfies readonly RegistryCollection[];

export type EmptyCliRegistryCollectionDir =
  (typeof EMPTY_CLI_REGISTRY_COLLECTION_DIRS)[number];

/** True when a docs collection id is a designated empty CLI taxonomy target. */
export function isCliDocsContentRoot(
  collectionId: DocsCollectionId,
): collectionId is CliDocsCollectionId {
  return (CLI_DOCS_CONTENT_ROOT_SECTIONS as readonly string[]).includes(
    collectionId,
  );
}

/** Docs content root for a designated CLI collection (`src/content/docs/<id>`). */
export function getCliDocsContentRoot(
  collectionId: CliDocsCollectionId,
  docsRoot?: string,
): string {
  return getDocsSectionRoot(collectionId as DocsSection, docsRoot);
}

/** Registry root for an empty CLI registry collection directory. */
export function getEmptyCliRegistryCollectionRoot(
  collection: EmptyCliRegistryCollectionDir,
  registryRoot?: string,
): string {
  return getRegistryCollectionRoot(collection, registryRoot);
}

/**
 * True when a CLI collection definition is ready for empty content: matching
 * route slug and empty starter/featured slug list (no featured placeholders).
 */
export function cliCollectionAllowsEmptyContent(
  collectionId: CliDocsCollectionId,
): boolean {
  const definition = getDocsCollectionDefinition(collectionId);
  return (
    definition.routeSlug === collectionId &&
    definition.starterSlugs.length === 0
  );
}
