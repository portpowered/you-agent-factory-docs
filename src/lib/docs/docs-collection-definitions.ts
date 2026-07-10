import {
  DOCS_COLLECTION_IDS,
  type DocsCollectionDefinition,
  type DocsCollectionId,
  type DocsCollectionMessageKeys,
} from "@/lib/docs/collection-definition-contract";

function collectionMessageKeys(
  browsePrefix: string,
  indexPrefix: string,
): DocsCollectionMessageKeys {
  return {
    browse: {
      sectionTitle: `browseIndex.${browsePrefix}SectionTitle`,
      sectionDescription: `browseIndex.${browsePrefix}SectionDescription`,
      sectionLinkLabel: `browseIndex.${browsePrefix}SectionLinkLabel`,
    },
    index: {
      title: `${indexPrefix}Index.title`,
      description: `${indexPrefix}Index.description`,
      listLabel: `${indexPrefix}Index.listLabel`,
      emptyTitle: `${indexPrefix}Index.emptyTitle`,
      emptyDescription: `${indexPrefix}Index.emptyDescription`,
      emptyHomeLink: `${indexPrefix}Index.emptyHomeLink`,
    },
  };
}

/**
 * Canonical docs collection inventory.
 * Public factory collections only: guides, concepts, techniques,
 * documentation, and glossary. CLI collections ship with empty
 * starter/featured slug lists. Default browse order is the four CLI ids in
 * `DOCS_BROWSE_COLLECTION_IDS`.
 */
export const DOCS_COLLECTION_DEFINITIONS = [
  {
    id: "guides",
    routeSlug: "guides",
    registryKind: "guide",
    frontmatterKind: "guide",
    starterSlugs: [],
    messageKeys: collectionMessageKeys("guides", "guides"),
  },
  {
    id: "concepts",
    routeSlug: "concepts",
    registryKind: "concept",
    frontmatterKind: "concept",
    starterSlugs: [],
    messageKeys: collectionMessageKeys("concepts", "concepts"),
    sidebarGroupingResolverId: "concepts",
  },
  {
    id: "techniques",
    routeSlug: "techniques",
    registryKind: "technique",
    frontmatterKind: "technique",
    starterSlugs: [],
    messageKeys: collectionMessageKeys("techniques", "techniques"),
  },
  {
    id: "documentation",
    routeSlug: "documentation",
    registryKind: "documentation",
    frontmatterKind: "documentation",
    starterSlugs: [],
    messageKeys: collectionMessageKeys("documentation", "documentation"),
  },
  {
    id: "glossary",
    routeSlug: "glossary",
    registryKind: "concept",
    frontmatterKind: "glossary",
    starterSlugs: ["glossary/token", "glossary/architecture"],
    messageKeys: collectionMessageKeys("glossary", "glossary"),
    sidebarGroupingResolverId: "glossary",
  },
] as const satisfies readonly DocsCollectionDefinition[];

export type DocsCollectionDefinitions = typeof DOCS_COLLECTION_DEFINITIONS;

const definitionsById = new Map<DocsCollectionId, DocsCollectionDefinition>(
  DOCS_COLLECTION_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function getDocsCollectionDefinition(
  id: DocsCollectionId,
): DocsCollectionDefinition {
  const definition = definitionsById.get(id);
  if (!definition) {
    throw new Error(`Unknown docs collection id: ${id}`);
  }
  return definition;
}

export function listDocsCollectionDefinitions(): readonly DocsCollectionDefinition[] {
  return DOCS_COLLECTION_DEFINITIONS;
}

export function assertDocsCollectionInventory(): void {
  const ids = DOCS_COLLECTION_DEFINITIONS.map((definition) => definition.id);
  if (ids.length !== DOCS_COLLECTION_IDS.length) {
    throw new Error(
      `Expected ${DOCS_COLLECTION_IDS.length} collection definitions, found ${ids.length}`,
    );
  }

  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error("Duplicate docs collection ids in definition inventory");
  }

  for (const expectedId of DOCS_COLLECTION_IDS) {
    if (!uniqueIds.has(expectedId)) {
      throw new Error(
        `Missing docs collection definition for id: ${expectedId}`,
      );
    }
  }
}
