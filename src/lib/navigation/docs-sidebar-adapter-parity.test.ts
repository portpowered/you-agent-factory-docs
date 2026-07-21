import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { FACTORY_SIDEBAR_COLLECTION_IDS } from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  getDocsShellPageTreeSettings,
  listDocsShellSidebarDefinitions,
} from "@/lib/navigation/docs-sidebar-adapter";
import {
  collectSidebarPageLinks,
  findSidebarPageLink,
} from "@/lib/navigation/docs-sidebar-contract";
import { DOCS_SIDEBAR_SECTION_ORDER } from "@/lib/navigation/docs-sidebar-sections";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";
import { buildShellCollectionPageTree } from "@/lib/navigation/shell-collection-page-tree";
import {
  buildNonAiShellFixturePageTree,
  listNonAiShellFixtureCollectionDefinitions,
} from "@/tests/fixtures/non-ai-shell/fixture";

function getTopLevelFolderNames(pageTree: { children: Node[] }): string[] {
  return pageTree.children
    .filter((node) => node.type === "folder")
    .map((folder) => String(folder.name));
}

function getFolderChildren(
  pageTree: { children: Node[] },
  folderName: string,
): Node[] {
  const folder = pageTree.children.find(
    (node) => node.type === "folder" && node.name === folderName,
  );
  expect(folder?.type).toBe("folder");
  if (folder?.type !== "folder") {
    throw new Error(`expected ${folderName} folder in docs sidebar`);
  }

  return folder.children;
}

function getSeparatorLabels(nodes: Node[]): string[] {
  return nodes
    .filter((node) => node.type === "separator")
    .map((node) => String(node.name));
}

function findPrecedingSeparatorLabel(
  nodes: Node[],
  pageUrl: string,
): string | undefined {
  let currentSeparator: string | undefined;

  for (const node of nodes) {
    if (node.type === "separator" && typeof node.name === "string") {
      currentSeparator = node.name;
      continue;
    }

    if (
      node.type === "page" &&
      "url" in node &&
      node.url === pageUrl &&
      typeof currentSeparator === "string"
    ) {
      return currentSeparator;
    }
  }

  return undefined;
}

function getFolderPageLinks(
  pageTree: { children: Node[] },
  folderName: string,
) {
  return collectSidebarPageLinks(getFolderChildren(pageTree, folderName));
}

describe("docs sidebar adapter extraction parity", () => {
  test("adapter-wired collection folders match generated tree for factory collections", () => {
    const baseTree = { name: "Docs", children: [] };
    const generatedTree = buildGeneratedDocsPageTree(baseTree);
    const { definitions, groupingResolvers } = getDocsShellPageTreeSettings();
    const adapterTree = buildShellCollectionPageTree(baseTree, {
      pages: loadPublishedDocsPagesSync("en"),
      definitions,
      collectionIds: [...FACTORY_SIDEBAR_COLLECTION_IDS],
      groupingResolvers,
    });

    const factoryFolderNames = [
      "Guides",
      "Concepts",
      "Techniques",
      "Program documentation",
      "References",
      "Factories",
      "Workers",
      "Workstations",
    ] as const;

    expect(getTopLevelFolderNames(generatedTree)).toEqual([
      ...factoryFolderNames,
    ]);
    expect(
      DOCS_SIDEBAR_SECTION_ORDER.flatMap((section) =>
        section.kind === "collection" ? [section.id] : [],
      ),
    ).toEqual([...FACTORY_SIDEBAR_COLLECTION_IDS]);
    expect(DOCS_SIDEBAR_SECTION_ORDER.at(-1)).toEqual({
      kind: "page",
      docsSlug: "documentation/faq",
    });
    expect(getTopLevelFolderNames(generatedTree)).not.toContain("Glossary");
    expect(generatedTree.name).toBe("You Agent Factory");
    expect(generatedTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });
    expect(
      getFolderPageLinks(generatedTree, "Program documentation").some(
        (link) => link.url === "/docs/documentation/faq",
      ),
    ).toBe(false);

    for (const folderName of factoryFolderNames) {
      const generatedLinks = getFolderPageLinks(generatedTree, folderName);
      const adapterLinks = getFolderPageLinks(adapterTree, folderName).filter(
        (link) =>
          folderName !== "Program documentation" ||
          link.url !== "/docs/documentation/faq",
      );

      expect(generatedLinks).toEqual(adapterLinks);
    }
  });

  test("grouped concepts folder keeps separator label and representative page placement", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const children = getFolderChildren(pageTree, "Concepts");
    const links = collectSidebarPageLinks(children);
    const harnessUrl = "/docs/concepts/harness";

    expect(findSidebarPageLink(links, harnessUrl)).toEqual({
      name: "Harness",
      url: harnessUrl,
    });
    expect(findPrecedingSeparatorLabel(children, harnessUrl)).toBe("Harnesses");
    expect(getSeparatorLabels(children)).toEqual([
      "Harnesses",
      "Industrial engineering",
      "Model inference",
    ]);
  });

  test("grouped Program documentation folder keeps separator order and representative page placement", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const children = getFolderChildren(pageTree, "Program documentation");
    const links = collectSidebarPageLinks(children);
    const whatIsUrl = "/docs/documentation/what-is-you-agent-factory";
    const secondaryFolderNames = children
      .filter((node) => node.type === "folder")
      .map((node) => String(node.name));

    expect(findSidebarPageLink(links, whatIsUrl)?.url).toBe(whatIsUrl);
    expect(findPrecedingSeparatorLabel(children, whatIsUrl)).toBe(
      "Orientation",
    );
    expect(getSeparatorLabels(children)).toEqual([
      "Orientation",
      "Capabilities",
      "Interfaces",
      "Operations",
    ]);
    for (const former of [
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
    ] as const) {
      expect(getSeparatorLabels(children)).not.toContain(former);
    }
    expect(links.some((link) => link.url === "/docs/documentation/faq")).toBe(
      false,
    );
    expect(pageTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });
    expect(secondaryFolderNames).toContain("Configuring you-agent-factory");
    expect(secondaryFolderNames).not.toContain("Workers");
    expect(secondaryFolderNames).not.toContain("Observability");
    expect(
      findSidebarPageLink(links, "/docs/documentation/resources")?.url,
    ).toBe("/docs/documentation/resources");
    expect(
      findSidebarPageLink(links, "/docs/documentation/throttling-and-limits"),
    ).toBeUndefined();
    expect(
      findSidebarPageLink(links, "/docs/documentation/mock-workers"),
    ).toBeUndefined();
  });

  test("factory sidebar excludes retired Atlas collection destinations", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const folderNames = getTopLevelFolderNames(pageTree);
    const links = collectSidebarPageLinks(pageTree);

    for (const retired of [
      "Modules",
      "Models",
      "Papers",
      "Training",
      "Systems",
      "Model Types",
      "Inference",
      "Module Components",
    ] as const) {
      expect(folderNames).not.toContain(retired);
    }

    expect(findSidebarPageLink(links, "/docs/models/gpt-3")).toBeUndefined();
    expect(
      findSidebarPageLink(links, "/docs/modules/grouped-query-attention"),
    ).toBeUndefined();
    expect(
      findSidebarPageLink(links, "/docs/papers/deepseek-v4"),
    ).toBeUndefined();
  });

  test("non-AI fixture sidebar uses fixture labels instead of factory adapter labels", () => {
    const fixtureTree = buildNonAiShellFixturePageTree();
    const fixtureLabels = listNonAiShellFixtureCollectionDefinitions().map(
      (definition) => definition.sidebarLabel,
    );
    const factoryLabels = listDocsShellSidebarDefinitions().map(
      (definition) => definition.sidebarLabel,
    );

    expect(getTopLevelFolderNames(fixtureTree)).toEqual([...fixtureLabels]);
    for (const label of fixtureLabels) {
      expect(factoryLabels, label).not.toContain(label);
    }

    for (const collectionId of ["guides", "reference"] as const) {
      const definition =
        listNonAiShellFixtureCollectionDefinitions().find(
          (entry) => entry.id === collectionId,
        ) ?? null;
      expect(definition).not.toBeNull();
      if (!definition) {
        return;
      }

      const folderChildren = getFolderChildren(
        fixtureTree,
        definition.sidebarLabel,
      );
      expect(getSeparatorLabels(folderChildren)).toEqual([]);
    }
  });
});
