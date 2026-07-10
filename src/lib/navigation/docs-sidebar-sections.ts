import type { Node } from "fumadocs-core/page-tree";
import type { DocsPageSource } from "@/lib/content/pages";
import { isDocsCollectionSidebarGroupingResolverId } from "@/lib/docs/collection-definition-contract";
import {
  filterGlossaryPagesForDerivedSection,
  type GlossaryDerivedBrowseSectionId,
  getGlossaryDerivedSidebarLabel,
  isGlossaryPageAssignedToDerivedSection,
} from "@/lib/docs/glossary-derived-browse-sections";
import { buildGroupedSidebarNodes } from "@/lib/navigation/docs-sidebar-grouping-adapter";
import {
  buildUngroupedShellCollectionPageNodes,
  type ShellCollectionSidebarDefinition,
} from "@/lib/navigation/shell-collection-page-tree";

type DocsSidebarSectionRef =
  | { kind: "glossary-derived"; id: GlossaryDerivedBrowseSectionId }
  | { kind: "collection"; id: string };

/** Reader-visible sidebar folder order for factory docs collections. */
export const DOCS_SIDEBAR_SECTION_ORDER = [
  { kind: "collection", id: "guides" },
  { kind: "collection", id: "concepts" },
  { kind: "collection", id: "techniques" },
  { kind: "collection", id: "documentation" },
  { kind: "collection", id: "glossary" },
] as const satisfies readonly DocsSidebarSectionRef[];

function buildGlossaryDerivedSidebarFolder(
  sectionId: GlossaryDerivedBrowseSectionId,
  glossaryPages: readonly DocsPageSource[],
): Node {
  const sectionPages = filterGlossaryPagesForDerivedSection(
    glossaryPages,
    sectionId,
  );

  return {
    type: "folder",
    name: getGlossaryDerivedSidebarLabel(sectionId),
    children: buildUngroupedShellCollectionPageNodes(sectionPages),
  };
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

  const glossaryPages = pagesByCollection.get("glossary") ?? [];
  const remainingGlossaryPages = glossaryPages.filter(
    (page) => !isGlossaryPageAssignedToDerivedSection(page),
  );

  return sectionOrder.map((sectionRef) => {
    if (sectionRef.kind === "glossary-derived") {
      return buildGlossaryDerivedSidebarFolder(sectionRef.id, glossaryPages);
    }

    const definition = definitionsById.get(sectionRef.id);
    if (!definition) {
      throw new Error(
        `Missing collection definition for sidebar id: ${sectionRef.id}`,
      );
    }

    const collectionPages =
      sectionRef.id === "glossary"
        ? remainingGlossaryPages
        : (pagesByCollection.get(sectionRef.id) ?? []);

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
}
