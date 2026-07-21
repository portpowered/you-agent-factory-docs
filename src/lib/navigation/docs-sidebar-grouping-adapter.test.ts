import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { isDocsExplorerTopLevelFaqPage } from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  DOCUMENTATION_SIDEBAR_SECONDARY_LABELS,
  FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG,
  getSidebarGroupLabel,
  isDeferredDocumentationExplorerMembershipSlug,
  isModeAProgramOverviewPendingExplorerMembership,
  PROGRAM_DOCUMENTATION_DEMOTED_SLUGS,
} from "@/lib/content/sidebar-grouping";
import { listDocsCollectionDefinitions } from "@/lib/docs/docs-collection-definitions";
import {
  assertSupportedSidebarGroupingResolverId,
  buildGroupedSidebarNodes,
} from "@/lib/navigation/docs-sidebar-grouping-adapter";
import {
  isDocumentationRouteMigrationOldBrowsePath,
  listDocumentationRouteMigrationOldRoutes,
} from "@/lib/seo/documentation-route-migration";

function getSeparatorLabels(nodes: Node[]): string[] {
  return nodes
    .filter((node) => node.type === "separator")
    .map((node) => String(node.name));
}

function collectPagesFromNode(node: Node): string[] {
  if (node.type === "page" && "url" in node && typeof node.url === "string") {
    return [node.url];
  }
  if (node.type === "folder" && "children" in node) {
    return node.children.flatMap((child) => collectPagesFromNode(child));
  }
  return [];
}

function collectGroupedPageUrls(nodes: Node[]): Record<string, string[]> {
  const byGroup: Record<string, string[]> = {};
  let currentGroup: string | undefined;

  for (const node of nodes) {
    if (node.type === "separator" && typeof node.name === "string") {
      currentGroup = node.name;
      byGroup[currentGroup] ??= [];
      continue;
    }

    if (!currentGroup) {
      if (node.type === "page" && "url" in node) {
        throw new Error(`ungrouped page at ${node.url}`);
      }
      continue;
    }

    byGroup[currentGroup].push(...collectPagesFromNode(node));
  }

  return byGroup;
}

function secondaryFolderNamesAfterSeparator(
  nodes: Node[],
  separatorName: string,
): string[] {
  const start = nodes.findIndex(
    (node) => node.type === "separator" && node.name === separatorName,
  );
  if (start === -1) {
    return [];
  }

  const names: string[] = [];
  for (let index = start + 1; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node || node.type === "separator") {
      break;
    }
    if (node.type === "folder") {
      names.push(String(node.name));
    }
  }
  return names;
}

function pageUrlsInSecondaryFolderAfterSeparator(
  nodes: Node[],
  separatorName: string,
  secondaryFolderName: string,
): string[] {
  const start = nodes.findIndex(
    (node) => node.type === "separator" && node.name === separatorName,
  );
  if (start === -1) {
    return [];
  }

  for (let index = start + 1; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node || node.type === "separator") {
      break;
    }
    if (node.type === "folder" && String(node.name) === secondaryFolderName) {
      return collectPagesFromNode(node);
    }
  }
  return [];
}

function countPageNodes(nodes: Node[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "page") {
      count += 1;
      continue;
    }
    if (node.type === "folder" && "children" in node) {
      count += countPageNodes(node.children);
    }
  }
  return count;
}

describe("docs sidebar grouping adapter", () => {
  test("builds grouped nodes for every configured sidebar grouping resolver id with pages", () => {
    for (const definition of listDocsCollectionDefinitions()) {
      const resolverId = definition.sidebarGroupingResolverId;
      if (!resolverId) {
        continue;
      }

      const pages = loadPublishedDocsPagesSync("en").filter((page) =>
        page.docsSlug.startsWith(`${definition.routeSlug}/`),
      );
      if (pages.length === 0) {
        continue;
      }

      const nodes = buildGroupedSidebarNodes(resolverId, pages);

      expect(nodes.length).toBeGreaterThan(0);
      expect(getSeparatorLabels(nodes).length).toBeGreaterThan(0);
    }
  });

  test("concepts subgroups follow Harnesses → Industrial engineering → Model inference with every published page assigned", () => {
    const pages = loadPublishedDocsPagesSync("en").filter((page) =>
      page.docsSlug.startsWith("concepts/"),
    );
    const nodes = buildGroupedSidebarNodes("concepts", pages);
    const separators = getSeparatorLabels(nodes);
    const byGroup = collectGroupedPageUrls(nodes);

    expect(separators).toEqual([
      "Harnesses",
      "Industrial engineering",
      "Model inference",
    ]);

    const expectedByGroup: Record<string, string[]> = {
      Harnesses: [],
      "Industrial engineering": [],
      "Model inference": [],
    };

    for (const page of pages) {
      const slug = page.docsSlug.slice("concepts/".length);
      const groupId =
        FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG[
          slug as keyof typeof FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG
        ];
      expect(
        groupId,
        `${slug} must have an explicit Concepts subgroup`,
      ).toBeDefined();
      if (!groupId) {
        continue;
      }
      expectedByGroup[getSidebarGroupLabel("concepts", groupId)].push(page.url);
    }

    for (const [label, urls] of Object.entries(expectedByGroup)) {
      expect(byGroup[label]?.slice().sort()).toEqual(urls.slice().sort());
    }

    expect(countPageNodes(nodes)).toBe(pages.length);
  });

  test("Program documentation emits three-level nesting without FAQ, W18 stubs, pending Mode A overviews, deferred-membership, or PS-100 demotions", () => {
    const allDocumentationPages = loadPublishedDocsPagesSync("en").filter(
      (page) => page.docsSlug.startsWith("documentation/"),
    );
    const factoriesConfiguringPages = loadPublishedDocsPagesSync("en").filter(
      (page) =>
        page.docsSlug === "factories/configuration" ||
        page.docsSlug === "factories/global-configuration",
    );
    const pages = allDocumentationPages.filter((page) => {
      if (isDocsExplorerTopLevelFaqPage(page.docsSlug)) {
        return false;
      }
      if (isDocumentationRouteMigrationOldBrowsePath(page.docsSlug)) {
        return false;
      }
      if (isModeAProgramOverviewPendingExplorerMembership(page.docsSlug)) {
        return false;
      }
      const slug = page.docsSlug.slice("documentation/".length);
      if (isDeferredDocumentationExplorerMembershipSlug(slug)) {
        return false;
      }
      if (
        (PROGRAM_DOCUMENTATION_DEMOTED_SLUGS as readonly string[]).includes(
          slug,
        )
      ) {
        return false;
      }
      return (
        FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG[
          slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG
        ] !== undefined
      );
    });
    const nodes = buildGroupedSidebarNodes("documentation", [
      ...allDocumentationPages,
      ...factoriesConfiguringPages,
    ]);
    const separators = getSeparatorLabels(nodes);
    const byGroup = collectGroupedPageUrls(nodes);

    expect(separators).toEqual([
      "Orientation",
      "Capabilities",
      "Interfaces",
      "Operations",
    ]);

    expect(secondaryFolderNamesAfterSeparator(nodes, "Operations")).toEqual(
      Object.values(DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations),
    );
    expect(secondaryFolderNamesAfterSeparator(nodes, "Orientation")).toEqual(
      [],
    );
    expect(secondaryFolderNamesAfterSeparator(nodes, "Capabilities")).toEqual(
      [],
    );
    expect(secondaryFolderNamesAfterSeparator(nodes, "Interfaces")).toEqual([]);

    const expectedByGroup: Record<string, string[]> = {
      Orientation: [],
      Capabilities: [],
      Interfaces: [],
      Operations: [],
    };

    for (const page of pages) {
      const slug = page.docsSlug.slice("documentation/".length);
      expect(slug).not.toBe("faq");
      expect(isDeferredDocumentationExplorerMembershipSlug(slug)).toBe(false);
      const membership =
        FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG[
          slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_MEMBERSHIP_BY_SLUG
        ];
      expect(
        membership,
        `${slug} must have an explicit Program documentation membership`,
      ).toBeDefined();
      if (!membership) {
        continue;
      }
      expectedByGroup[
        getSidebarGroupLabel("documentation", membership.group)
      ].push(page.url);
      expect(
        FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
          slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
        ],
      ).toBe(membership.group);
    }

    for (const page of factoriesConfiguringPages) {
      expectedByGroup.Operations.push(page.url);
    }

    for (const [label, urls] of Object.entries(expectedByGroup)) {
      expect(byGroup[label]?.slice().sort()).toEqual(urls.slice().sort());
    }

    const exactDirectTopGroupSlugs = {
      Orientation: ["what-is-you-agent-factory"],
      Capabilities: [
        "harness-support",
        "replays-records",
        "submitting-work",
        "packaged-documents",
      ],
      Interfaces: ["cli", "mcp"],
      Operations: [
        "logs",
        "metrics",
        "dashboard-ui-overview",
        "resources",
        "factories/configuration",
        "factories/global-configuration",
      ],
    } as const;

    for (const [label, slugs] of Object.entries(exactDirectTopGroupSlugs)) {
      const urls = byGroup[label] ?? [];
      expect(
        urls
          .map((url) =>
            url.startsWith("/docs/documentation/")
              ? url.slice("/docs/documentation/".length)
              : url.slice("/docs/".length),
          )
          .sort(),
      ).toEqual([...slugs].sort());
    }

    const configuringLabel =
      DOCUMENTATION_SIDEBAR_SECONDARY_LABELS.operations.configuring;
    const configuringUrls = pageUrlsInSecondaryFolderAfterSeparator(
      nodes,
      "Operations",
      configuringLabel,
    );
    expect(configuringUrls.sort()).toEqual(
      [
        "/docs/documentation/resources",
        "/docs/factories/configuration",
        "/docs/factories/global-configuration",
      ].sort(),
    );

    for (const demoted of [
      "install",
      "throttling-and-limits",
      "architecture-of-system",
      "petri",
      "troubleshooting",
      "security-trust-boundaries",
      "contributing-to-these-docs",
    ] as const) {
      expect(
        Object.values(byGroup)
          .flat()
          .some((url) => url.endsWith(`/docs/documentation/${demoted}`)),
        `${demoted} must not appear in Program documentation explorer`,
      ).toBe(false);
    }

    for (const excluded of [
      "configuration",
      "workers",
      "throttling-and-limits",
    ] as const) {
      expect(
        byGroup.Capabilities?.some((url) =>
          url.endsWith(`/docs/documentation/${excluded}`),
        ),
      ).toBe(false);
    }

    for (const oldRoute of listDocumentationRouteMigrationOldRoutes()) {
      expect(
        Object.values(byGroup)
          .flat()
          .some((url) => url.endsWith(oldRoute)),
        `${oldRoute} must not appear in Program documentation explorer`,
      ).toBe(false);
    }

    for (const overviewSlug of [
      "factory-session",
      "dynamic-workflows",
      "packaged-factories",
    ] as const) {
      expect(
        Object.values(byGroup)
          .flat()
          .some((url) => url.endsWith(`/docs/documentation/${overviewSlug}`)),
        `${overviewSlug} Mode A overview must not appear until PS-300`,
      ).toBe(false);
    }

    expect(countPageNodes(nodes)).toBe(
      pages.length + factoriesConfiguringPages.length,
    );
    expect(
      FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
        "faq" as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
      ],
    ).toBeUndefined();
    expect(
      nodes.some(
        (node) =>
          node.type === "page" &&
          "url" in node &&
          typeof node.url === "string" &&
          node.url.endsWith("/docs/documentation/faq"),
      ),
    ).toBe(false);
  });

  test("rejects unsupported and retired Atlas resolver ids at runtime", () => {
    expect(() => assertSupportedSidebarGroupingResolverId("models")).toThrow(
      /Unsupported docs sidebar grouping resolver id: models/,
    );
    expect(() => assertSupportedSidebarGroupingResolverId("modules")).toThrow(
      /Unsupported docs sidebar grouping resolver id: modules/,
    );
    expect(() =>
      buildGroupedSidebarNodes(
        "modules" as Parameters<typeof buildGroupedSidebarNodes>[0],
        [],
      ),
    ).toThrow(/Unsupported docs sidebar grouping resolver id: modules/);
  });
});
