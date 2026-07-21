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
import {
  isDeferredDocumentationExplorerMembershipSlug,
  isModeAProgramOverviewPendingExplorerMembership,
} from "@/lib/content/sidebar-grouping";
import { isDocsCollectionSidebarGroupingResolverId } from "@/lib/docs/collection-definition-contract";
import { resolveProgramDocumentationExplorerCollectionId } from "@/lib/navigation/docs-sidebar-adapter";
import { buildGroupedSidebarNodes } from "@/lib/navigation/docs-sidebar-grouping-adapter";
import {
  buildUngroupedShellCollectionPageNodes,
  createShellCollectionPageNode,
  type ShellCollectionSidebarDefinition,
} from "@/lib/navigation/shell-collection-page-tree";
import { isDocumentationRouteMigrationOldBrowsePath } from "@/lib/seo/documentation-route-migration";

/**
 * Reader-visible explorer top-level order: CLI + W15 family collection
 * folders, then FAQ as a sibling page outside Program documentation.
 * Glossary is omitted.
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

    // Cross-collection Program membership (factories config pages) moves tree
    // placement into Program documentation while keeping published routes.
    const programCollectionId =
      resolveProgramDocumentationExplorerCollectionId(page);
    if (programCollectionId) {
      pagesByCollection.get(programCollectionId)?.push(page);
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
