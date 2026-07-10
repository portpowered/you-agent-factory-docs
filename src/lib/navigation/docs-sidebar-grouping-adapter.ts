import type { Node } from "fumadocs-core/page-tree";
import type { DocsPageSource } from "@/lib/content/pages";
import { getConceptById } from "@/lib/content/registry-runtime";
import {
  getSidebarGroupIdsForSection,
  getSidebarGroupLabel,
  resolveConceptsSidebarGroup,
  resolveGlossarySidebarGroup,
  type SidebarGroupIdBySection,
  type SidebarGroupingSection,
} from "@/lib/content/sidebar-grouping";
import {
  type DocsCollectionSidebarGroupingResolverId,
  isDocsCollectionSidebarGroupingResolverId,
} from "@/lib/docs/collection-definition-contract";

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
    return record ? resolveConceptsSidebarGroup(record) : undefined;
  });
}

const GROUPED_NODE_BUILDERS: Record<
  DocsCollectionSidebarGroupingResolverId,
  (pages: DocsPageSource[]) => Node[]
> = {
  glossary: buildGlossaryGroupedNodes,
  concepts: buildConceptsGroupedNodes,
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
