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

  test("Program documentation emits three-level nesting without FAQ or W18 move stubs", () => {
    const allDocumentationPages = loadPublishedDocsPagesSync("en").filter(
      (page) => page.docsSlug.startsWith("documentation/"),
    );
    const pages = allDocumentationPages.filter(
      (page) =>
        !isDocsExplorerTopLevelFaqPage(page.docsSlug) &&
        !isDocumentationRouteMigrationOldBrowsePath(page.docsSlug),
    );
    const nodes = buildGroupedSidebarNodes(
      "documentation",
      allDocumentationPages,
    );
    const separators = getSeparatorLabels(nodes);
    const byGroup = collectGroupedPageUrls(nodes);

    expect(separators).toEqual([
      "System feature set",
      "Interfaces",
      "Packaged factories",
      "Factory Configuration",
      "System Operations",
      "Internal Architecture",
      "Additional references",
    ]);

    expect(
      secondaryFolderNamesAfterSeparator(nodes, "Factory Configuration"),
    ).toEqual(["Resources"]);
    expect(
      secondaryFolderNamesAfterSeparator(nodes, "System Operations"),
    ).toEqual(
      Object.values(
        DOCUMENTATION_SIDEBAR_SECONDARY_LABELS["system-operations"],
      ),
    );
    expect(
      secondaryFolderNamesAfterSeparator(nodes, "System feature set"),
    ).toEqual([]);
    expect(secondaryFolderNamesAfterSeparator(nodes, "Interfaces")).toEqual([]);

    const expectedByGroup: Record<string, string[]> = {
      "System feature set": [],
      Interfaces: [],
      "Packaged factories": [],
      "Factory Configuration": [],
      "System Operations": [],
      "Internal Architecture": [],
      "Additional references": [],
    };

    for (const page of pages) {
      const slug = page.docsSlug.slice("documentation/".length);
      expect(slug).not.toBe("faq");
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

    for (const [label, urls] of Object.entries(expectedByGroup)) {
      expect(byGroup[label]?.slice().sort()).toEqual(urls.slice().sort());
    }

    const exactDirectTopGroupSlugs = {
      "System feature set": [
        "harness-support",
        "replays-records",
        "submitting-work",
      ],
      Interfaces: ["cli", "mcp"],
      "Packaged factories": ["packaged-documents"],
      "Internal Architecture": ["architecture-of-system", "petri"],
      "Additional references": [
        "what-is-you-agent-factory",
        "install",
        "contributing-to-these-docs",
        "dashboard-ui-overview",
        "security-trust-boundaries",
        "troubleshooting",
      ],
    } as const;

    for (const [label, slugs] of Object.entries(exactDirectTopGroupSlugs)) {
      const urls = byGroup[label] ?? [];
      expect(
        urls.map((url) => url.slice("/docs/documentation/".length)).sort(),
      ).toEqual([...slugs].sort());
    }

    const exactSecondarySlugs = {
      "Factory Configuration": {
        Resources: ["resources", "throttling-and-limits"],
      },
      "System Operations": {
        Observability: ["logs", "metrics"],
      },
    } as const;

    for (const [groupLabel, secondaries] of Object.entries(
      exactSecondarySlugs,
    )) {
      for (const [secondaryLabel, slugs] of Object.entries(secondaries)) {
        const urls = pageUrlsInSecondaryFolderAfterSeparator(
          nodes,
          groupLabel,
          secondaryLabel,
        );
        expect(
          urls.map((url) => url.slice("/docs/documentation/".length)).sort(),
        ).toEqual([...slugs].sort());
      }
    }

    expect(
      pageUrlsInSecondaryFolderAfterSeparator(
        nodes,
        "System Operations",
        "Observability",
      ).some((url) => url.endsWith("/docs/documentation/replays-records")),
    ).toBe(false);
    expect(
      byGroup["System feature set"]?.some((url) =>
        url.endsWith("/docs/documentation/replays-records"),
      ),
    ).toBe(true);

    for (const excluded of [
      "configuration",
      "workers",
      "logs",
      "metrics",
      "throttling-and-limits",
    ] as const) {
      expect(
        byGroup["System feature set"]?.some((url) =>
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

    expect(countPageNodes(nodes)).toBe(pages.length);
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
