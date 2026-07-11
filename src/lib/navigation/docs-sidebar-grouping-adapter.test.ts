import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { isDocsExplorerTopLevelFaqPage } from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  FACTORY_CONCEPTS_SIDEBAR_GROUP_BY_SLUG,
  FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG,
  getSidebarGroupLabel,
} from "@/lib/content/sidebar-grouping";
import { listDocsCollectionDefinitions } from "@/lib/docs/docs-collection-definitions";
import {
  assertSupportedSidebarGroupingResolverId,
  buildGroupedSidebarNodes,
} from "@/lib/navigation/docs-sidebar-grouping-adapter";

function getSeparatorLabels(nodes: Node[]): string[] {
  return nodes
    .filter((node) => node.type === "separator")
    .map((node) => String(node.name));
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

    if (node.type === "page" && "url" in node && typeof node.url === "string") {
      if (!currentGroup) {
        throw new Error(`ungrouped page at ${node.url}`);
      }
      byGroup[currentGroup].push(node.url);
    }
  }

  return byGroup;
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

    const pageNodeCount = nodes.filter((node) => node.type === "page").length;
    expect(pageNodeCount).toBe(pages.length);
  });

  test("Program documentation subgroups follow declared order with every published page except FAQ assigned", () => {
    const pages = loadPublishedDocsPagesSync("en").filter(
      (page) =>
        page.docsSlug.startsWith("documentation/") &&
        !isDocsExplorerTopLevelFaqPage(page.docsSlug),
    );
    const nodes = buildGroupedSidebarNodes("documentation", pages);
    const separators = getSeparatorLabels(nodes);
    const byGroup = collectGroupedPageUrls(nodes);

    expect(separators).toEqual([
      "Basics",
      "Feature support",
      "Functions",
      "Configuration",
      "API",
      "CLI",
      "MCP",
      "Operational",
      "Internal architecture",
      "Additional reference",
    ]);

    const expectedByGroup: Record<string, string[]> = {
      Basics: [],
      "Feature support": [],
      Functions: [],
      Configuration: [],
      API: [],
      CLI: [],
      MCP: [],
      Operational: [],
      "Internal architecture": [],
      "Additional reference": [],
    };

    for (const page of pages) {
      const slug = page.docsSlug.slice("documentation/".length);
      expect(slug).not.toBe("faq");
      const groupId =
        FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
          slug as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
        ];
      expect(
        groupId,
        `${slug} must have an explicit Program documentation subgroup`,
      ).toBeDefined();
      if (!groupId) {
        continue;
      }
      expectedByGroup[getSidebarGroupLabel("documentation", groupId)].push(
        page.url,
      );
    }

    for (const [label, urls] of Object.entries(expectedByGroup)) {
      expect(byGroup[label]?.slice().sort()).toEqual(urls.slice().sort());
    }

    const pageNodeCount = nodes.filter((node) => node.type === "page").length;
    expect(pageNodeCount).toBe(pages.length);
    expect(
      FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG[
        "faq" as keyof typeof FACTORY_DOCUMENTATION_SIDEBAR_GROUP_BY_SLUG
      ],
    ).toBeUndefined();
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
