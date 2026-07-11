import type { Node } from "fumadocs-core/page-tree";
import {
  assertFactorySidebarFolderLabels,
  assertFactorySidebarPageUrls,
  assertFactorySidebarSectionOrder,
  FACTORY_SIDEBAR_COLLECTION_IDS,
} from "@/lib/content/factory-breadcrumb-sidebar";
import type { DocsPageSource } from "@/lib/content/pages";
import { isDocsCollectionSidebarGroupingResolverId } from "@/lib/docs/collection-definition-contract";
import { buildGroupedSidebarNodes } from "@/lib/navigation/docs-sidebar-grouping-adapter";
import {
  buildUngroupedShellCollectionPageNodes,
  type ShellCollectionSidebarDefinition,
} from "@/lib/navigation/shell-collection-page-tree";

type DocsSidebarSectionRef = { kind: "collection"; id: string };

/**
 * Reader-visible explorer folder order for factory docs collections.
 * Glossary is intentionally omitted; it remains on browse/search/direct routes.
 */
export const DOCS_SIDEBAR_SECTION_ORDER = FACTORY_SIDEBAR_COLLECTION_IDS.map(
  (id) => ({ kind: "collection" as const, id }),
);

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
  sectionOrder?: readonly DocsSidebarSectionRef[];
}): Node[] {
  assertFactorySidebarSectionOrder(sectionOrder.map((section) => section.id));

  const definitionsById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );
  const collectionIdByRouteSlug = new Map(
    definitions.map((definition) => [definition.routeSlug, definition.id]),
  );
  const pagesByCollection = new Map<string, DocsPageSource[]>(
    definitions.map((definition) => [definition.id, []]),
  );

  for (const page of pages) {
    const [routeSlug] = page.docsSlug.split("/", 1);
    const collectionId = collectionIdByRouteSlug.get(routeSlug);
    if (!collectionId) {
      continue;
    }

    pagesByCollection.get(collectionId)?.push(page);
  }

  const folders = sectionOrder.map((sectionRef) => {
    const definition = definitionsById.get(sectionRef.id);
    if (!definition) {
      throw new Error(
        `Missing collection definition for sidebar id: ${sectionRef.id}`,
      );
    }

    const collectionPages = pagesByCollection.get(sectionRef.id) ?? [];

    const children =
      definition.sidebarGroupingResolverId &&
      isDocsCollectionSidebarGroupingResolverId(
        definition.sidebarGroupingResolverId,
      )
        ? (groupingResolvers[definition.sidebarGroupingResolverId]?.(
            collectionPages,
          ) ??
          buildGroupedSidebarNodes(
            definition.sidebarGroupingResolverId,
            collectionPages,
          ))
        : buildUngroupedShellCollectionPageNodes(collectionPages);

    return {
      type: "folder",
      name: definition.sidebarLabel,
      children,
    } satisfies Node;
  });

  assertFactorySidebarFolderLabels(
    folders.map((folder) => String(folder.name)),
  );
  assertFactorySidebarPageUrls(collectSidebarPageUrls(folders));

  return folders;
}
