import { describe, expect, test } from "bun:test";
import type { Node, Root } from "fumadocs-core/page-tree";
import {
  collectSidebarPageLinks,
  findSidebarPageLink,
} from "@/lib/navigation/docs-sidebar-contract";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";
import { source } from "@/lib/source";

const EXPECTED_TOP_LEVEL_FOLDER_NAMES = [
  "Guides",
  "Concepts",
  "Techniques",
  "Program documentation",
  "References",
  "Factories",
  "Workers",
  "Workstations",
] as const;

const RETIRED_ATLAS_FOLDER_NAMES = [
  "Model Types",
  "Inference",
  "Module Components",
  "Modules",
  "Models",
  "Papers",
  "Training",
  "Systems",
] as const;

const REPRESENTATIVE_FACTORY_PAGES = [
  {
    folderName: "Guides",
    url: "/docs/guides/getting-started",
    name: "Getting Started",
  },
  {
    folderName: "Concepts",
    url: "/docs/concepts/harness",
    name: "Harness",
    separatorLabel: "Harnesses",
  },
  {
    folderName: "Program documentation",
    url: "/docs/documentation/what-is-you-agent-factory",
    name: "What is you-agent-factory",
    separatorLabel: "Orientation",
  },
  {
    folderName: "References",
    url: "/docs/references/api",
    name: "API",
  },
  {
    folderName: "Factories",
    url: "/docs/factories/configuration",
    name: "Configuration",
  },
  {
    folderName: "Workers",
    url: "/docs/workers/agent",
    name: "Agent worker",
  },
  {
    folderName: "Workstations",
    url: "/docs/workstations/inference-run",
    name: "Inference-run workstation",
  },
] as const;

function buildVerificationPageTree(): Root {
  return buildGeneratedDocsPageTree({
    name: "Docs",
    children: [],
  });
}

function getTopLevelFolderNames(pageTree: Root): string[] {
  return pageTree.children
    .filter((node) => node.type === "folder")
    .map((folder) => String(folder.name));
}

function getFolderChildren(pageTree: Root, folderName: string): Node[] {
  const folder = pageTree.children.find(
    (node) => node.type === "folder" && node.name === folderName,
  );
  expect(folder?.type).toBe("folder");
  if (folder?.type !== "folder") {
    throw new Error(`expected ${folderName} folder in docs sidebar`);
  }

  return folder.children;
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

function getSeparatorLabels(nodes: Node[]): string[] {
  return nodes
    .filter((node) => node.type === "separator")
    .map((node) => String(node.name));
}

describe("collection-driven docs sidebar verification", () => {
  test("buildGeneratedDocsPageTree exposes factory-only folder names and order", () => {
    const pageTree = buildVerificationPageTree();

    expect(getTopLevelFolderNames(pageTree)).toEqual([
      ...EXPECTED_TOP_LEVEL_FOLDER_NAMES,
    ]);
    expect(
      pageTree.children.filter((node) => node.type === "folder"),
    ).toHaveLength(EXPECTED_TOP_LEVEL_FOLDER_NAMES.length);
    expect(pageTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });
    expect(
      getFolderChildren(pageTree, "Program documentation").some(
        (node) =>
          node.type === "page" &&
          "url" in node &&
          node.url === "/docs/documentation/faq",
      ),
    ).toBe(false);

    for (const retiredFolder of RETIRED_ATLAS_FOLDER_NAMES) {
      expect(getTopLevelFolderNames(pageTree)).not.toContain(retiredFolder);
    }
  });

  test("buildGeneratedDocsPageTree matches source page-tree folder contract", () => {
    const generatedTree = buildVerificationPageTree();

    expect(getTopLevelFolderNames(generatedTree)).toEqual(
      getTopLevelFolderNames(source.pageTree),
    );
    expect(collectSidebarPageLinks(generatedTree)).toEqual(
      collectSidebarPageLinks(source.pageTree),
    );
  });

  test("representative factory pages stay under the correct folders", () => {
    const pageTree = buildVerificationPageTree();

    for (const representative of REPRESENTATIVE_FACTORY_PAGES) {
      const children = getFolderChildren(pageTree, representative.folderName);
      const link = findSidebarPageLink(
        collectSidebarPageLinks(children),
        representative.url,
      );

      expect(link, representative.folderName).toEqual({
        name: representative.name,
        url: representative.url,
      });

      if ("separatorLabel" in representative) {
        expect(
          findPrecedingSeparatorLabel(children, representative.url),
          representative.folderName,
        ).toBe(representative.separatorLabel);
        expect(
          getSeparatorLabels(children),
          representative.folderName,
        ).toContain(representative.separatorLabel);
      }
    }
  });

  test("ungrouped factory folders keep page links without Atlas destinations", () => {
    const pageTree = buildVerificationPageTree();
    const links = collectSidebarPageLinks(pageTree);

    for (const folderName of ["Guides", "Techniques"] as const) {
      const children = getFolderChildren(pageTree, folderName);
      expect(getSeparatorLabels(children), folderName).toEqual([]);
    }

    expect(findSidebarPageLink(links, "/docs/models/gpt-3")).toBeUndefined();
    expect(
      findSidebarPageLink(links, "/docs/modules/grouped-query-attention"),
    ).toBeUndefined();
    expect(
      findSidebarPageLink(links, "/docs/papers/deepseek-v4"),
    ).toBeUndefined();
  });

  test("Program documentation subgroups follow declared order without FAQ", () => {
    const pageTree = buildVerificationPageTree();
    const children = getFolderChildren(pageTree, "Program documentation");
    const secondaryFolderNames = children
      .filter((node) => node.type === "folder")
      .map((node) => String(node.name));

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
    expect(
      collectSidebarPageLinks(children).some(
        (link) => link.url === "/docs/documentation/faq",
      ),
    ).toBe(false);
    expect(pageTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });
    expect(secondaryFolderNames).toContain("Configuring you-agent-factory");
    expect(secondaryFolderNames).not.toContain("Workers");
    expect(secondaryFolderNames).not.toContain("Observability");
  });
});
