import type { Node } from "fumadocs-core/page-tree";
import { isDocsExplorerTopLevelFaqPage } from "@/lib/content/factory-breadcrumb-sidebar";
import type { DocsPageSource } from "@/lib/content/pages";
import { getConceptById } from "@/lib/content/registry-runtime";
import {
  documentationSidebarMembershipSlug,
  getDocumentationSidebarMembership,
  getDocumentationSidebarSecondaryIdsForGroup,
  getDocumentationSidebarSecondaryLabel,
  getSidebarGroupIdsForSection,
  getSidebarGroupLabel,
  isDocumentationSidebarSecondaryGroup,
  resolveConceptsSidebarGroup,
  resolveDocumentationSidebarGroup,
  resolveGlossarySidebarGroup,
  type SidebarGroupIdBySection,
  type SidebarGroupingSection,
} from "@/lib/content/sidebar-grouping";
import {
  type DocsCollectionSidebarGroupingResolverId,
  isDocsCollectionSidebarGroupingResolverId,
} from "@/lib/docs/collection-definition-contract";
import { isDocumentationRouteMigrationOldBrowsePath } from "@/lib/seo/documentation-route-migration";

function createPageNode(page: DocsPageSource): Node {
  return {
    type: "page",
    name: page.messages.title,
    url: page.url,
  };
}

function createSeparator(name: string): Node {
  return {
    type: "separator",
    name,
  };
}

function createFolder(name: string, children: Node[]): Node {
  return {
    type: "folder",
    name,
    children,
  };
}

function documentationPageSlug(page: DocsPageSource): string {
  return documentationSidebarMembershipSlug(page.docsSlug);
}

function sortPages(pages: DocsPageSource[]): DocsPageSource[] {
  return [...pages].sort((left, right) =>
    left.messages.title.localeCompare(right.messages.title, "en", {
      sensitivity: "base",
    }),
  );
}

function groupPages(
  pages: DocsPageSource[],
  groups: ReadonlyArray<{
    name: string;
    matchesPage: (page: DocsPageSource) => boolean;
  }>,
): Node[] {
  const remaining = new Set(pages.map((page) => page.docsSlug));
  const nodes: Node[] = [];

  for (const group of groups) {
    const groupedPages = sortPages(
      pages.filter(
        (page) => remaining.has(page.docsSlug) && group.matchesPage(page),
      ),
    );
    if (groupedPages.length === 0) {
      continue;
    }

    nodes.push(createSeparator(group.name));
    for (const page of groupedPages) {
      remaining.delete(page.docsSlug);
      nodes.push(createPageNode(page));
    }
  }

  for (const page of sortPages(
    pages.filter((page) => remaining.has(page.docsSlug)),
  )) {
    nodes.push(createPageNode(page));
  }

  return nodes;
}

function groupPagesBySection<Section extends SidebarGroupingSection>(
  section: Section,
  pages: DocsPageSource[],
  resolveGroupId: (
    page: DocsPageSource,
  ) => SidebarGroupIdBySection[Section] | undefined,
): Node[] {
  return groupPages(
    pages,
    getSidebarGroupIdsForSection(section).map((groupId) => ({
      name: getSidebarGroupLabel(section, groupId),
      matchesPage: (page) => resolveGroupId(page) === groupId,
    })),
  );
}

function buildGlossaryGroupedNodes(pages: DocsPageSource[]): Node[] {
  return groupPagesBySection("glossary", pages, (page) => {
    const record = getConceptById(page.frontmatter.registryId);
    return record ? resolveGlossarySidebarGroup(record) : undefined;
  });
}

function buildConceptsGroupedNodes(pages: DocsPageSource[]): Node[] {
  return groupPagesBySection("concepts", pages, (page) => {
    const record = getConceptById(page.frontmatter.registryId);
    const slug =
      record?.slug ??
      (page.docsSlug.startsWith("concepts/")
        ? page.docsSlug.slice("concepts/".length)
        : page.docsSlug);

    return resolveConceptsSidebarGroup({
      ...(record ?? {}),
      slug,
    });
  });
}

/**
 * Program documentation emits a three-level explorer: top-group separators,
 * optional nested secondary folders, then page links. Empty top groups and
 * empty secondaries are omitted. Membership is allowlist-only via
 * {@link getDocumentationSidebarMembership}: FAQ, W18 documentation move stubs,
 * Mode A overviews pending PS-300 membership, deferred-membership pages
 * (PS-300 Interfaces `api`, etc.), and locked PS-100 demotions stay published
 * without Program explorer placement until their IA lane wires membership.
 */
function buildDocumentationGroupedNodes(pages: DocsPageSource[]): Node[] {
  const explorerPages = pages.filter((page) => {
    if (isDocsExplorerTopLevelFaqPage(page.docsSlug)) {
      return false;
    }
    if (isDocumentationRouteMigrationOldBrowsePath(page.docsSlug)) {
      return false;
    }
    return (
      getDocumentationSidebarMembership(documentationPageSlug(page)) !==
      undefined
    );
  });
  const remaining = new Set(explorerPages.map((page) => page.docsSlug));
  const nodes: Node[] = [];

  for (const groupId of getSidebarGroupIdsForSection("documentation")) {
    const groupPages = sortPages(
      explorerPages.filter((page) => {
        if (!remaining.has(page.docsSlug)) {
          return false;
        }
        return (
          resolveDocumentationSidebarGroup({
            slug: documentationPageSlug(page),
          }) === groupId
        );
      }),
    );
    if (groupPages.length === 0) {
      continue;
    }

    nodes.push(createSeparator(getSidebarGroupLabel("documentation", groupId)));

    if (isDocumentationSidebarSecondaryGroup(groupId)) {
      for (const secondaryId of getDocumentationSidebarSecondaryIdsForGroup(
        groupId,
      )) {
        const secondaryPages = sortPages(
          groupPages.filter((page) => {
            const membership = getDocumentationSidebarMembership(
              documentationPageSlug(page),
            );
            return (
              membership !== undefined &&
              "secondary" in membership &&
              membership.secondary === secondaryId
            );
          }),
        );
        if (secondaryPages.length === 0) {
          continue;
        }

        for (const page of secondaryPages) {
          remaining.delete(page.docsSlug);
        }
        nodes.push(
          createFolder(
            getDocumentationSidebarSecondaryLabel(groupId, secondaryId),
            secondaryPages.map(createPageNode),
          ),
        );
      }

      for (const page of sortPages(
        groupPages.filter((page) => remaining.has(page.docsSlug)),
      )) {
        remaining.delete(page.docsSlug);
        nodes.push(createPageNode(page));
      }
      continue;
    }

    for (const page of groupPages) {
      remaining.delete(page.docsSlug);
      nodes.push(createPageNode(page));
    }
  }

  for (const page of sortPages(
    explorerPages.filter((page) => remaining.has(page.docsSlug)),
  )) {
    nodes.push(createPageNode(page));
  }

  return nodes;
}

const GROUPED_NODE_BUILDERS: Record<
  DocsCollectionSidebarGroupingResolverId,
  (pages: DocsPageSource[]) => Node[]
> = {
  glossary: buildGlossaryGroupedNodes,
  concepts: buildConceptsGroupedNodes,
  documentation: buildDocumentationGroupedNodes,
};

export function buildGroupedSidebarNodes(
  resolverId: DocsCollectionSidebarGroupingResolverId,
  pages: DocsPageSource[],
): Node[] {
  const buildNodes = GROUPED_NODE_BUILDERS[resolverId];
  if (!buildNodes) {
    throw new Error(
      `Unsupported docs sidebar grouping resolver id: ${resolverId}`,
    );
  }

  return buildNodes(pages);
}

export function assertSupportedSidebarGroupingResolverId(
  resolverId: string,
): asserts resolverId is DocsCollectionSidebarGroupingResolverId {
  if (!isDocsCollectionSidebarGroupingResolverId(resolverId)) {
    throw new Error(
      `Unsupported docs sidebar grouping resolver id: ${resolverId}`,
    );
  }
}
