import type { DocsPageSource } from "@/lib/content/pages";
import {
  DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS,
  type DocsCollectionDefinition,
  type DocsCollectionId,
  type DocsCollectionSidebarGroupingResolverId,
} from "@/lib/docs/collection-definition-contract";
import { listDocsCollectionDefinitions } from "@/lib/docs/docs-collection-definitions";
import { buildGroupedSidebarNodes } from "@/lib/navigation/docs-sidebar-grouping-adapter";
import type {
  ShellCollectionSidebarDefinition,
  ShellSidebarGroupingResolver,
} from "@/lib/navigation/shell-collection-page-tree";

const DOCS_SIDEBAR_FOLDER_LABELS: Record<DocsCollectionId, string> = {
  guides: "Guides",
  concepts: "Concepts",
  techniques: "Techniques",
  documentation: "Documentation",
  glossary: "Glossary",
};

export function resolveDocsSidebarFolderLabel(id: DocsCollectionId): string {
  return DOCS_SIDEBAR_FOLDER_LABELS[id];
}

export function toDocsShellSidebarDefinition(
  definition: DocsCollectionDefinition,
): ShellCollectionSidebarDefinition {
  return {
    id: definition.id,
    routeSlug: definition.routeSlug,
    frontmatterKind: definition.frontmatterKind,
    sidebarLabel: resolveDocsSidebarFolderLabel(definition.id),
    sidebarGroupingResolverId: definition.sidebarGroupingResolverId,
  };
}

export function listDocsShellSidebarDefinitions(): ShellCollectionSidebarDefinition[] {
  return listDocsCollectionDefinitions().map(toDocsShellSidebarDefinition);
}

export function listDocsShellCollectionIds(): DocsCollectionId[] {
  return listDocsCollectionDefinitions().map((definition) => definition.id);
}

export type DocsShellPageTreeSettings = {
  definitions: ShellCollectionSidebarDefinition[];
  collectionIds: DocsCollectionId[];
  groupingResolvers: Record<string, ShellSidebarGroupingResolver>;
};

export function getDocsShellPageTreeSettings(): DocsShellPageTreeSettings {
  const definitions = listDocsShellSidebarDefinitions();

  return {
    definitions,
    collectionIds: listDocsShellCollectionIds(),
    groupingResolvers: getDocsShellSidebarGroupingResolvers(),
  };
}

function createDocsGroupingResolver(
  resolverId: DocsCollectionSidebarGroupingResolverId,
): ShellSidebarGroupingResolver {
  return (pages) =>
    buildGroupedSidebarNodes(resolverId, pages as DocsPageSource[]);
}

export function getDocsShellSidebarGroupingResolvers(): Record<
  string,
  ShellSidebarGroupingResolver
> {
  return Object.fromEntries(
    DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS.map((resolverId) => [
      resolverId,
      createDocsGroupingResolver(resolverId),
    ]),
  );
}
