import {
  DOCS_COLLECTION_IDS,
  type DocsCollectionId,
  type DocsCollectionMessageKeys,
} from "@/lib/docs/collection-definition-contract";
import {
  assertDocsCollectionInventory,
  getDocsCollectionDefinition,
  listDocsCollectionDefinitions,
} from "@/lib/docs/docs-collection-definitions";

/** Rewrite-era CLI collections may ship with empty starter/featured lists. */
const EMPTY_STARTER_COLLECTION_IDS = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
] as const satisfies readonly DocsCollectionId[];

const GLOSSARY_STARTER_COLLECTION_ID = "glossary" as const;
const GLOSSARY_STARTER_SLUG = "glossary/token" as const;

const RETIRED_ATLAS_COLLECTION_IDS = [
  "modules",
  "models",
  "papers",
  "training",
  "systems",
] as const;

function assertNonEmptyMessageKeyMetadata(
  collectionId: string,
  messageKeys: DocsCollectionMessageKeys,
): void {
  for (const path of [
    messageKeys.browse.sectionTitle,
    messageKeys.browse.sectionDescription,
    messageKeys.browse.sectionLinkLabel,
    messageKeys.index.title,
    messageKeys.index.description,
    messageKeys.index.listLabel,
    messageKeys.index.emptyTitle,
    messageKeys.index.emptyDescription,
    messageKeys.index.emptyHomeLink,
  ]) {
    if (typeof path !== "string" || path.length === 0) {
      throw new Error(
        `Collection ${collectionId} has empty message key metadata path`,
      );
    }
  }
}

function assertEmptyCliCollectionContract(): void {
  for (const id of EMPTY_STARTER_COLLECTION_IDS) {
    const definition = getDocsCollectionDefinition(id);
    if (definition.routeSlug !== id) {
      throw new Error(
        `Expected CLI collection ${id} route slug "${id}", found "${definition.routeSlug}"`,
      );
    }
    if (definition.starterSlugs.length !== 0) {
      throw new Error(
        `Expected CLI collection ${id} to have empty starterSlugs, found ${definition.starterSlugs.length}`,
      );
    }
  }

  const guides = getDocsCollectionDefinition("guides");
  if (guides.frontmatterKind !== "guide" || guides.registryKind !== "guide") {
    throw new Error(
      `Expected guides kinds guide/guide, found ${guides.frontmatterKind}/${guides.registryKind}`,
    );
  }

  const concepts = getDocsCollectionDefinition("concepts");
  if (
    concepts.frontmatterKind !== "concept" ||
    concepts.registryKind !== "concept"
  ) {
    throw new Error(
      `Expected concepts kinds concept/concept, found ${concepts.frontmatterKind}/${concepts.registryKind}`,
    );
  }

  const techniques = getDocsCollectionDefinition("techniques");
  if (
    techniques.frontmatterKind !== "technique" ||
    techniques.registryKind !== "technique"
  ) {
    throw new Error(
      `Expected techniques kinds technique/technique, found ${techniques.frontmatterKind}/${techniques.registryKind}`,
    );
  }

  const documentation = getDocsCollectionDefinition("documentation");
  if (
    documentation.frontmatterKind !== "documentation" ||
    documentation.registryKind !== "documentation"
  ) {
    throw new Error(
      `Expected documentation kinds documentation/documentation, found ${documentation.frontmatterKind}/${documentation.registryKind}`,
    );
  }
}

function assertGlossaryStarterSlugs(): void {
  const glossary = getDocsCollectionDefinition(GLOSSARY_STARTER_COLLECTION_ID);
  if (!glossary.starterSlugs.includes(GLOSSARY_STARTER_SLUG)) {
    throw new Error(
      `Glossary collection is missing starter slug ${GLOSSARY_STARTER_SLUG}`,
    );
  }
  if (glossary.frontmatterKind !== "glossary") {
    throw new Error(
      `Expected glossary frontmatter kind "glossary", found "${glossary.frontmatterKind}"`,
    );
  }
  if (glossary.registryKind !== "concept") {
    throw new Error(
      `Expected glossary registry kind "concept", found "${glossary.registryKind}"`,
    );
  }
}

function assertRetiredAtlasCollectionsAbsent(): void {
  const ids = new Set<string>(
    listDocsCollectionDefinitions().map((definition) => definition.id),
  );
  for (const retiredId of RETIRED_ATLAS_COLLECTION_IDS) {
    if (ids.has(retiredId)) {
      throw new Error(
        `Retired Atlas collection id "${retiredId}" must not appear in the public inventory`,
      );
    }
  }
}

/**
 * Behavioral verification that exported collection definitions match the
 * current docs collection contract without scanning source files.
 */
export function assertDocsCollectionDefinitionInventoryVerified(): void {
  assertDocsCollectionInventory();

  const definitions = listDocsCollectionDefinitions();
  if (definitions.length !== DOCS_COLLECTION_IDS.length) {
    throw new Error(
      `Expected ${DOCS_COLLECTION_IDS.length} collection definitions, found ${definitions.length}`,
    );
  }

  const emptyStarterIds = new Set<string>(EMPTY_STARTER_COLLECTION_IDS);

  for (const definition of definitions) {
    if (definition.routeSlug.length === 0) {
      throw new Error(`Collection ${definition.id} has an empty route slug`);
    }
    if (definition.registryKind.length === 0) {
      throw new Error(`Collection ${definition.id} has an empty registry kind`);
    }
    if (definition.frontmatterKind.length === 0) {
      throw new Error(
        `Collection ${definition.id} has an empty frontmatter kind`,
      );
    }

    assertNonEmptyMessageKeyMetadata(definition.id, definition.messageKeys);

    if (emptyStarterIds.has(definition.id)) {
      if (definition.starterSlugs.length !== 0) {
        throw new Error(
          `CLI collection ${definition.id} must keep starterSlugs empty`,
        );
      }
      continue;
    }

    if (definition.starterSlugs.length === 0) {
      throw new Error(`Collection ${definition.id} has no starter slugs`);
    }
    for (const slug of definition.starterSlugs) {
      if (!slug.startsWith(`${definition.routeSlug}/`)) {
        throw new Error(
          `Collection ${definition.id} starter slug "${slug}" is not route-relative to "${definition.routeSlug}"`,
        );
      }
    }
  }

  assertEmptyCliCollectionContract();
  assertGlossaryStarterSlugs();
  assertRetiredAtlasCollectionsAbsent();
}
