import {
  FACTORY_SIDEBAR_COLLECTION_IDS,
  type FactorySidebarCollectionId,
  resolveFactorySidebarFolderLabel,
} from "@/lib/content/factory-breadcrumb-sidebar";
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

const FACTORY_SIDEBAR_COLLECTION_ID_SET = new Set<string>(
  FACTORY_SIDEBAR_COLLECTION_IDS,
);

export function resolveDocsSidebarFolderLabel(id: DocsCollectionId): string {
  return resolveFactorySidebarFolderLabel(id);
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

/**
 * Explorer-facing shell sidebar definitions. Glossary remains in the full
 * docs collection inventory for browse/search/direct routes, but is omitted
 * from the explorer folder list.
 */
export function listDocsShellSidebarDefinitions(): ShellCollectionSidebarDefinition[] {
  return listDocsCollectionDefinitions()
    .filter((definition) =>
      FACTORY_SIDEBAR_COLLECTION_ID_SET.has(definition.id),
    )
    .map(toDocsShellSidebarDefinition);
}

export function listDocsShellCollectionIds(): FactorySidebarCollectionId[] {
  return [...FACTORY_SIDEBAR_COLLECTION_IDS];
}

export type DocsShellPageTreeSettings = {
  definitions: ShellCollectionSidebarDefinition[];
  collectionIds: FactorySidebarCollectionId[];
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
