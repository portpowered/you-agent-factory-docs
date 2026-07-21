import {
  FACTORY_SIDEBAR_COLLECTION_IDS,
  type FactorySidebarCollectionId,
  resolveFactorySidebarFolderLabel,
} from "@/lib/content/factory-breadcrumb-sidebar";
import type { DocsPageSource } from "@/lib/content/pages";
import {
  hasDocumentationSidebarMembership,
  hasReferenceSidebarMembership,
} from "@/lib/content/sidebar-grouping";
import {
  DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS,
  type DocsCollectionDefinition,
  type DocsCollectionId,
  type DocsCollectionSidebarGroupingResolverId,
} from "@/lib/docs/collection-definition-contract";
import { listDocsCollectionDefinitions } from "@/lib/docs/docs-collection-definitions";
import { buildGroupedSidebarNodes } from "@/lib/navigation/docs-sidebar-grouping-adapter";
import type {
  ShellCollectionIdResolver,
  ShellCollectionPageSource,
  ShellCollectionSidebarDefinition,
  ShellSidebarGroupingResolver,
} from "@/lib/navigation/shell-collection-page-tree";

const FACTORY_SIDEBAR_COLLECTION_ID_SET = new Set<string>(
  FACTORY_SIDEBAR_COLLECTION_IDS,
);

/** Program documentation shell collection id for explorer folder routing. */
export const PROGRAM_DOCUMENTATION_COLLECTION_ID = "documentation" as const;

/** Reference shell collection id for explorer folder routing. */
export const REFERENCE_COLLECTION_ID = "references" as const;

/**
 * Route pages with Program documentation membership (including cross-collection
 * factories config pages) into the Program documentation explorer folder.
 */
export function resolveProgramDocumentationExplorerCollectionId(
  page: Pick<ShellCollectionPageSource, "docsSlug">,
): string | undefined {
  if (!hasDocumentationSidebarMembership(page.docsSlug)) {
    return undefined;
  }
  return PROGRAM_DOCUMENTATION_COLLECTION_ID;
}

/**
 * Route pages with Reference subgroup membership (including cross-collection
 * Limits throttling) into the Reference explorer folder.
 */
export function resolveReferenceExplorerCollectionId(
  page: Pick<ShellCollectionPageSource, "docsSlug">,
): string | undefined {
  if (!hasReferenceSidebarMembership(page.docsSlug)) {
    return undefined;
  }
  return REFERENCE_COLLECTION_ID;
}

/**
 * Composed explorer folder override: Program membership wins first, then
 * Reference membership (Limits throttling). RouteSlug-based placement applies
 * when neither override matches.
 */
export function resolveDocsExplorerCollectionId(
  page: Pick<ShellCollectionPageSource, "docsSlug">,
): string | undefined {
  return (
    resolveProgramDocumentationExplorerCollectionId(page) ??
    resolveReferenceExplorerCollectionId(page)
  );
}

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
 * from the explorer folder list. Includes nested Reference families so the
 * section builder can nest Factories / Workers / Workstations under Reference.
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
  resolveCollectionId: ShellCollectionIdResolver;
};

export function getDocsShellPageTreeSettings(): DocsShellPageTreeSettings {
  const definitions = listDocsShellSidebarDefinitions();

  return {
    definitions,
    collectionIds: listDocsShellCollectionIds(),
    groupingResolvers: getDocsShellSidebarGroupingResolvers(),
    resolveCollectionId: resolveDocsExplorerCollectionId,
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
