import type { Node } from "fumadocs-core/page-tree";
import {
  assertFactoryExplorerSectionOrder,
  assertFactorySidebarFolderLabels,
  assertFactorySidebarPageUrls,
  FACTORY_EXPLORER_TOP_LEVEL_GROUPS,
  FACTORY_REFERENCE_NESTED_COLLECTION_IDS,
  type FactoryExplorerSectionRef,
  type FactoryExplorerTopLevelGroup,
  type FactoryExplorerVirtualFolderId,
  type FactoryReferenceNestedCollectionId,
  isDocsExplorerQuickStartPage,
  isDocsExplorerTopLevelFaqPage,
  isDocsExplorerVirtualFolderPage,
  listFactoryExplorerVirtualFolderMembership,
  resolveFactoryExplorerVirtualFolderLabel,
} from "@/lib/content/factory-breadcrumb-sidebar";
import type { DocsPageSource } from "@/lib/content/pages";
import {
  isDeferredDocumentationExplorerMembershipSlug,
  isModeAProgramOverviewPendingExplorerMembership,
} from "@/lib/content/sidebar-grouping";
import { isDocsCollectionSidebarGroupingResolverId } from "@/lib/docs/collection-definition-contract";
import { resolveDocsExplorerCollectionId } from "@/lib/navigation/docs-sidebar-adapter";
import { buildGroupedSidebarNodes } from "@/lib/navigation/docs-sidebar-grouping-adapter";
import {
  buildUngroupedShellCollectionPageNodes,
  createShellCollectionPageNode,
  type ShellCollectionSidebarDefinition,
} from "@/lib/navigation/shell-collection-page-tree";
import { isDocumentationRouteMigrationOldBrowsePath } from "@/lib/seo/documentation-route-migration";

/**
 * Reader-visible explorer top level: Quick starts → How-tos → References →
 * Information. The authoring-shaped collection folders (Guides, Program
 * documentation, Concepts, Techniques, Reference, and the virtual folders) now
 * sit one level down inside those groups. Glossary is omitted.
 */
export const DOCS_SIDEBAR_TOP_LEVEL_GROUPS = FACTORY_EXPLORER_TOP_LEVEL_GROUPS;

function collectSidebarPageUrls(nodes: Node[]): string[] {
  const urls: string[] = [];

  for (const node of nodes) {
    if (node.type === "page" && "url" in node && typeof node.url === "string") {
      urls.push(node.url);
    }
    if (node.type === "folder" && "children" in node) {
      urls.push(...collectSidebarPageUrls(node.children));
    }
  }

  return urls;
}

function buildCollectionFolderChildren({
  definition,
  collectionPages,
  groupingResolvers,
}: {
  definition: ShellCollectionSidebarDefinition;
  collectionPages: readonly DocsPageSource[];
  groupingResolvers: Record<
    string,
    (pages: readonly DocsPageSource[]) => Node[]
  >;
}): Node[] {
  return definition.sidebarGroupingResolverId &&
    isDocsCollectionSidebarGroupingResolverId(
      definition.sidebarGroupingResolverId,
    )
    ? (groupingResolvers[definition.sidebarGroupingResolverId]?.(
        collectionPages,
      ) ??
        buildGroupedSidebarNodes(definition.sidebarGroupingResolverId, [
          ...collectionPages,
        ]))
    : buildUngroupedShellCollectionPageNodes(collectionPages);
}

function buildCollectionFolderNode({
  definition,
  collectionPages,
  groupingResolvers,
}: {
  definition: ShellCollectionSidebarDefinition;
  collectionPages: readonly DocsPageSource[];
  groupingResolvers: Record<
    string,
    (pages: readonly DocsPageSource[]) => Node[]
  >;
}): Node {
  return {
    type: "folder",
    name: definition.sidebarLabel,
    children: buildCollectionFolderChildren({
      definition,
      collectionPages,
      groupingResolvers,
    }),
  } satisfies Node;
}

function buildReferenceFolderNode({
  definition,
  referencePages,
  nestedPagesByCollection,
  definitionsById,
  groupingResolvers,
}: {
  definition: ShellCollectionSidebarDefinition;
  referencePages: readonly DocsPageSource[];
  nestedPagesByCollection: ReadonlyMap<string, readonly DocsPageSource[]>;
  definitionsById: ReadonlyMap<string, ShellCollectionSidebarDefinition>;
  groupingResolvers: Record<
    string,
    (pages: readonly DocsPageSource[]) => Node[]
  >;
}): Node {
  const children = buildCollectionFolderChildren({
    definition,
    collectionPages: referencePages,
    groupingResolvers,
  });

  for (const nestedId of FACTORY_REFERENCE_NESTED_COLLECTION_IDS) {
    const nestedDefinition = definitionsById.get(nestedId);
    if (!nestedDefinition) {
      throw new Error(
        `Missing collection definition for nested Reference folder: ${nestedId}`,
      );
    }

    const nestedPages = nestedPagesByCollection.get(nestedId) ?? [];
    if (nestedPages.length === 0) {
      continue;
    }

    children.push(
      buildCollectionFolderNode({
        definition: nestedDefinition,
        collectionPages: nestedPages,
        groupingResolvers,
      }),
    );
  }

  return {
    type: "folder",
    name: definition.sidebarLabel,
    children,
  } satisfies Node;
}

function buildVirtualFolderNode({
  id,
  pagesByDocsSlug,
}: {
  id: FactoryExplorerVirtualFolderId;
  pagesByDocsSlug: ReadonlyMap<string, DocsPageSource>;
}): Node {
  const children: Node[] = [];

  for (const docsSlug of listFactoryExplorerVirtualFolderMembership(id)) {
    const page = pagesByDocsSlug.get(docsSlug);
    if (!page) {
      throw new Error(
        `Missing published page for explorer virtual folder "${id}": ${docsSlug}`,
      );
    }
    children.push(createShellCollectionPageNode(page));
  }

  return {
    type: "folder",
    name: resolveFactoryExplorerVirtualFolderLabel(id),
    children,
  } satisfies Node;
}

function isReferenceNestedCollectionId(
  id: string,
): id is FactoryReferenceNestedCollectionId {
  return (
    FACTORY_REFERENCE_NESTED_COLLECTION_IDS as readonly string[]
  ).includes(id);
}

export function buildDocsSidebarSectionNodes({
  pages,
  definitions,
  groupingResolvers,
  groups = DOCS_SIDEBAR_TOP_LEVEL_GROUPS,
}: {
  pages: readonly DocsPageSource[];
  definitions: readonly ShellCollectionSidebarDefinition[];
  groupingResolvers: Record<
    string,
    (pages: readonly DocsPageSource[]) => Node[]
  >;
  groups?: readonly FactoryExplorerTopLevelGroup[];
}): Node[] {
  assertFactoryExplorerSectionOrder(groups.flatMap((group) => group.sections));

  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );
  const collectionIdByRouteSlug = new Map(
    definitions.map((definition) => [definition.routeSlug, definition.id]),
  );
  const pagesByCollection = new Map<string, DocsPageSource[]>(
    definitions.map((definition) => [definition.id, []]),
  );
  const pagesByDocsSlug = new Map(
    pages.map((page) => [page.docsSlug, page] as const),
  );

  for (const page of pages) {
    if (isDocsExplorerTopLevelFaqPage(page.docsSlug)) {
      continue;
    }
    if (isDocsExplorerVirtualFolderPage(page.docsSlug)) {
      continue;
    }
    // Quick starts are listed in their own group; leaving them in Guides too
    // would make that folder a superset of the group above it.
    if (isDocsExplorerQuickStartPage(page.docsSlug)) {
      continue;
    }
    // W18 move stubs keep static compatibility routes but are not explorer
    // destinations under Program documentation (or any collection folder).
    if (isDocumentationRouteMigrationOldBrowsePath(page.docsSlug)) {
      continue;
    }
    // Mode A overviews still pending membership stay published without explorer
    // placement so they do not appear as ungrouped leftovers.
    if (isModeAProgramOverviewPendingExplorerMembership(page.docsSlug)) {
      continue;
    }
    // Deferred-membership pages stay published without explorer placement
    // until their IA lane wires them (list empty after PS-300 Interfaces).
    const documentationSlug = page.docsSlug.startsWith("documentation/")
      ? page.docsSlug.slice("documentation/".length)
      : page.docsSlug;
    if (isDeferredDocumentationExplorerMembershipSlug(documentationSlug)) {
      continue;
    }

    // Cross-collection explorer membership (Program factories config, Reference
    // Limits throttling) moves tree placement while keeping published routes.
    const overrideCollectionId = resolveDocsExplorerCollectionId(page);
    if (overrideCollectionId) {
      pagesByCollection.get(overrideCollectionId)?.push(page);
      continue;
    }

    const [routeSlug] = page.docsSlug.split("/", 1);
    const collectionId = collectionIdByRouteSlug.get(routeSlug);
    if (!collectionId) {
      continue;
    }

    pagesByCollection.get(collectionId)?.push(page);
  }

  /** Builds the node(s) a single section ref contributes to its parent. */
  const buildSectionNodes = (sectionRef: FactoryExplorerSectionRef): Node[] => {
    if (sectionRef.kind === "page" || sectionRef.kind === "curated-page") {
      const page = pagesByDocsSlug.get(sectionRef.docsSlug);
      if (!page) {
        throw new Error(
          `Missing published page for explorer top-level entry: ${sectionRef.docsSlug}`,
        );
      }

      return [createShellCollectionPageNode(page)];
    }

    if (sectionRef.kind === "virtual-folder") {
      return [buildVirtualFolderNode({ id: sectionRef.id, pagesByDocsSlug })];
    }

    const definition = definitionsById.get(sectionRef.id);
    if (!definition) {
      throw new Error(
        `Missing collection definition for sidebar id: ${sectionRef.id}`,
      );
    }

    if (sectionRef.id === "references") {
      const referenceFolder = buildReferenceFolderNode({
        definition,
        referencePages: pagesByCollection.get("references") ?? [],
        nestedPagesByCollection: pagesByCollection,
        definitionsById,
        groupingResolvers,
      });

      // Inlined: the group already carries the "References" name, so the
      // collection folder itself would only add a redundant level.
      return sectionRef.kind === "inlined-collection" &&
        referenceFolder.type === "folder"
        ? [...referenceFolder.children]
        : [referenceFolder];
    }

    if (isReferenceNestedCollectionId(sectionRef.id)) {
      throw new Error(
        `Reference-nested collection "${sectionRef.id}" must not appear as a top-level explorer section.`,
      );
    }

    const collectionFolder = buildCollectionFolderNode({
      definition,
      collectionPages: pagesByCollection.get(sectionRef.id) ?? [],
      groupingResolvers,
    });

    return sectionRef.kind === "inlined-collection" &&
      collectionFolder.type === "folder"
      ? [...collectionFolder.children]
      : [collectionFolder];
  };

  const nodes = groups.map(
    (group) =>
      ({
        type: "folder",
        name: group.label,
        children: group.sections.flatMap(buildSectionNodes),
      }) satisfies Node,
  );

  assertFactorySidebarFolderLabels(
    nodes
      .filter((node) => node.type === "folder")
      .map((folder) => String(folder.name)),
  );
  assertFactorySidebarPageUrls(collectSidebarPageUrls(nodes));

  return nodes;
}
