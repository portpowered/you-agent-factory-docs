import type { Node } from "fumadocs-core/page-tree";
import {
  assertFactoryExplorerSectionOrder,
  assertFactorySidebarFolderLabels,
  assertFactorySidebarPageUrls,
  FACTORY_EXPLORER_SECTION_ORDER,
  type FactoryExplorerSectionRef,
  isDocsExplorerTopLevelFaqPage,
} from "@/lib/content/factory-breadcrumb-sidebar";
import type { DocsPageSource } from "@/lib/content/pages";
import { isDocsCollectionSidebarGroupingResolverId } from "@/lib/docs/collection-definition-contract";
import { buildGroupedSidebarNodes } from "@/lib/navigation/docs-sidebar-grouping-adapter";
import {
  buildUngroupedShellCollectionPageNodes,
  createShellCollectionPageNode,
  type ShellCollectionSidebarDefinition,
} from "@/lib/navigation/shell-collection-page-tree";

/**
 * Reader-visible explorer top-level order: CLI collection folders, then FAQ
 * as a sibling page outside Program documentation. Glossary is omitted.
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
  const children =
    definition.sidebarGroupingResolverId &&
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

  return {
    type: "folder",
    name: definition.sidebarLabel,
    children,
  } satisfies Node;
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

    const definition = definitionsById.get(sectionRef.id);
    if (!definition) {
      throw new Error(
        `Missing collection definition for sidebar id: ${sectionRef.id}`,
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
