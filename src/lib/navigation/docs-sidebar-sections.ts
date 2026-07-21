import type { Node } from "fumadocs-core/page-tree";
import {
  assertFactoryExplorerSectionOrder,
  assertFactorySidebarFolderLabels,
  assertFactorySidebarPageUrls,
  FACTORY_EXPLORER_SECTION_ORDER,
  FACTORY_REFERENCE_NESTED_COLLECTION_IDS,
  type FactoryExplorerSectionRef,
  type FactoryExplorerVirtualFolderId,
  type FactoryReferenceNestedCollectionId,
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
 * Reader-visible explorer top-level order under locked PS-100: Guides →
 * Program documentation → Concepts → Techniques → Reference → Internal
 * architecture → Miscellanea → FAQ. Factories / Workers / Workstations nest
 * under Reference. Glossary is omitted.
 */
export const DOCS_SIDEBAR_SECTION_ORDER = FACTORY_EXPLORER_SECTION_ORDER;

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
  sectionOrder = DOCS_SIDEBAR_SECTION_ORDER,
}: {
  pages: readonly DocsPageSource[];
  definitions: readonly ShellCollectionSidebarDefinition[];
  groupingResolvers: Record<
    string,
    (pages: readonly DocsPageSource[]) => Node[]
  >;
  sectionOrder?: readonly FactoryExplorerSectionRef[];
}): Node[] {
  assertFactoryExplorerSectionOrder([...sectionOrder]);

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
    // W18 move stubs keep static compatibility routes but are not explorer
    // destinations under Program documentation (or any collection folder).
    if (isDocumentationRouteMigrationOldBrowsePath(page.docsSlug)) {
      continue;
    }
    // Mode A Program overviews stay published until PS-300 wires membership;
    // do not place them in explorer folders as ungrouped leftovers.
    if (isModeAProgramOverviewPendingExplorerMembership(page.docsSlug)) {
      continue;
    }
    // Deferred-membership pages (for example Program API how-to) stay
    // published without explorer placement until their IA lane wires them.
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

  const nodes = sectionOrder.map((sectionRef) => {
    if (sectionRef.kind === "page") {
      const page = pagesByDocsSlug.get(sectionRef.docsSlug);
      if (!page) {
        throw new Error(
          `Missing published page for explorer top-level entry: ${sectionRef.docsSlug}`,
        );
      }

      return createShellCollectionPageNode(page);
    }

    if (sectionRef.kind === "virtual-folder") {
      return buildVirtualFolderNode({
        id: sectionRef.id,
        pagesByDocsSlug,
      });
    }

    const definition = definitionsById.get(sectionRef.id);
    if (!definition) {
      throw new Error(
        `Missing collection definition for sidebar id: ${sectionRef.id}`,
      );
    }

    if (sectionRef.id === "references") {
      return buildReferenceFolderNode({
        definition,
        referencePages: pagesByCollection.get("references") ?? [],
        nestedPagesByCollection: pagesByCollection,
        definitionsById,
        groupingResolvers,
      });
    }

    if (isReferenceNestedCollectionId(sectionRef.id)) {
      throw new Error(
        `Reference-nested collection "${sectionRef.id}" must not appear as a top-level explorer section.`,
      );
    }

    return buildCollectionFolderNode({
      definition,
      collectionPages: pagesByCollection.get(sectionRef.id) ?? [],
      groupingResolvers,
    });
  });

  assertFactorySidebarFolderLabels(
    nodes
      .filter((node) => node.type === "folder")
      .map((folder) => String(folder.name)),
  );
  assertFactorySidebarPageUrls(collectSidebarPageUrls(nodes));

  return nodes;
}
