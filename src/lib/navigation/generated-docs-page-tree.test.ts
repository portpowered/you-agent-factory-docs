import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import {
  getSidebarGroupIdsForSection,
  getSidebarGroupLabel,
  type SidebarGroupingSection,
} from "@/lib/content/sidebar-grouping";
import { source } from "@/lib/source";

const REQUIRED_SUBGROUP_LABELS = {
  Concepts: ["Harnesses", "Industrial engineering", "Model inference"],
  "Program documentation": [
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
  ],
} as const;

const REPRESENTATIVE_SUBGROUP_PLACEMENTS = [
  {
    folderName: "Concepts",
    separator: "Harnesses",
    url: "/docs/concepts/harness",
  },
  {
    folderName: "Concepts",
    separator: "Industrial engineering",
    url: "/docs/concepts/checklist",
  },
  {
    folderName: "Concepts",
    separator: "Model inference",
    url: "/docs/concepts/tokens",
  },
  {
    folderName: "Program documentation",
    separator: "Basics",
    url: "/docs/documentation/what-is-you-agent-factory",
  },
  {
    folderName: "Program documentation",
    separator: "CLI",
    url: "/docs/documentation/cli",
  },
  {
    folderName: "Program documentation",
    separator: "Additional reference",
    url: "/docs/documentation/install",
  },
] as const;

const GROUPED_SECTION_BY_FOLDER = {
  Concepts: "concepts",
  "Program documentation": "documentation",
} as const satisfies Record<
  keyof typeof REQUIRED_SUBGROUP_LABELS,
  SidebarGroupingSection
>;

function getFolderChildren(folderName: string): Node[] {
  const folder = source.pageTree.children.find(
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

function findNodeIndex(
  nodes: Node[],
  target: { name?: string; url?: string },
): number {
  return nodes.findIndex((node) => {
    if (target.name) {
      return node.name === target.name;
    }

    return node.type === "page" && "url" in node && node.url === target.url;
  });
}

function expectIndex(targetLabel: string, index: number): number {
  if (index < 0) {
    throw new Error(`expected page tree entry for ${targetLabel}`);
  }

  return index;
}

function expectSeparatorsInConfiguredOrder(
  section: SidebarGroupingSection,
  actualLabels: string[],
): void {
  const configuredLabels = getSidebarGroupIdsForSection(section).map(
    (groupId) => getSidebarGroupLabel(section, groupId),
  );
  const actualConfiguredLabels = actualLabels.filter((label) =>
    configuredLabels.includes(label as (typeof configuredLabels)[number]),
  );
  const expectedOrder = configuredLabels.filter((label) =>
    actualLabels.includes(label),
  );

  expect(
    actualConfiguredLabels,
    `${section} subgroup labels should follow configured order`,
  ).toEqual(expectedOrder);
}

describe("generated docs page tree", () => {
  test("grouped factory docs folders expose required subgroup labels in configured order", () => {
    for (const [folderName, requiredLabels] of Object.entries(
      REQUIRED_SUBGROUP_LABELS,
    )) {
      const actualLabels = getSeparatorLabels(getFolderChildren(folderName));

      for (const requiredLabel of requiredLabels) {
        expect(
          actualLabels,
          `${folderName} should expose subgroup separator ${requiredLabel}`,
        ).toContain(requiredLabel);
      }

      expectSeparatorsInConfiguredOrder(
        GROUPED_SECTION_BY_FOLDER[
          folderName as keyof typeof GROUPED_SECTION_BY_FOLDER
        ],
        actualLabels,
      );
    }
  });

  test("representative subgroup pages appear after the correct separator", () => {
    for (const placement of REPRESENTATIVE_SUBGROUP_PLACEMENTS) {
      const children = getFolderChildren(placement.folderName);
      const separatorIndex = expectIndex(
        `${placement.folderName} separator ${placement.separator}`,
        findNodeIndex(children, { name: placement.separator }),
      );
      const pageIndex = expectIndex(
        `${placement.folderName} representative page ${placement.url}`,
        findNodeIndex(children, { url: placement.url }),
      );

      expect(
        pageIndex,
        `${placement.folderName} ${placement.separator}`,
      ).toBeGreaterThan(separatorIndex);
    }
  });

  test("factory sidebar folders exclude retired Atlas collection destinations", () => {
    const folderNames = source.pageTree.children
      .filter((node) => node.type === "folder")
      .map((folder) => String(folder.name));

    expect(folderNames).toEqual([
      "Guides",
      "Concepts",
      "Techniques",
      "Program documentation",
    ]);
    expect(folderNames).not.toContain("Glossary");
    expect(source.pageTree.name).toBe("You Agent Factory");
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
  });
});
