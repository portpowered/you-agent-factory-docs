import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import {
  buildExplorerTreeSignature,
  folderSignatureByName,
  pageEntriesInFolder,
  pageEntriesUnderSeparator,
  secondaryFolderNamesUnderSeparator,
  separatorNamesInFolder,
  topLevelFolderNames,
  topLevelPageEntries,
} from "@/lib/navigation/explorer-tree-signature";

function page(name: string, url: string): Node {
  return { type: "page", name, url };
}

function folder(name: string, children: Node[]): Node {
  return {
    type: "folder",
    name,
    children,
    root: false,
    defaultOpen: false,
  };
}

function separator(name: string): Node {
  return { type: "separator", name };
}

describe("explorer-tree-signature", () => {
  test("serializes top-level folders, FAQ page, and subgroup membership", () => {
    const signature = buildExplorerTreeSignature({
      name: "You Agent Factory",
      children: [
        folder("Concepts", [
          separator("Harnesses"),
          page("Harness", "/docs/concepts/harness"),
          separator("Model inference"),
          page("Tokens", "/docs/concepts/tokens"),
        ]),
        folder("Program documentation", [
          separator("Basics"),
          page(
            "What is you-agent-factory",
            "/docs/documentation/what-is-you-agent-factory",
          ),
        ]),
        page("FAQ", "/docs/documentation/faq"),
      ],
    });

    expect(signature.rootName).toBe("You Agent Factory");
    expect(topLevelFolderNames(signature)).toEqual([
      "Concepts",
      "Program documentation",
    ]);
    expect(topLevelPageEntries(signature)).toEqual([
      { name: "FAQ", url: "/docs/documentation/faq" },
    ]);

    const concepts = folderSignatureByName(signature, "Concepts");
    expect(concepts).toBeTruthy();
    if (!concepts) {
      throw new Error("expected Concepts folder");
    }
    expect(separatorNamesInFolder(concepts)).toEqual([
      "Harnesses",
      "Model inference",
    ]);
    expect(pageEntriesInFolder(concepts)).toEqual([
      { name: "Harness", url: "/docs/concepts/harness" },
      { name: "Tokens", url: "/docs/concepts/tokens" },
    ]);
    expect(pageEntriesUnderSeparator(concepts, "Harnesses")).toEqual([
      { name: "Harness", url: "/docs/concepts/harness" },
    ]);
    expect(pageEntriesUnderSeparator(concepts, "Model inference")).toEqual([
      { name: "Tokens", url: "/docs/concepts/tokens" },
    ]);
    expect(pageEntriesUnderSeparator(concepts, "Missing")).toEqual([]);
  });

  test("collects pages and secondary folder names under nested Program documentation groups", () => {
    const signature = buildExplorerTreeSignature({
      name: "You Agent Factory",
      children: [
        folder("Program documentation", [
          separator("System feature set"),
          page("Dynamic workflows", "/docs/documentation/dynamic-workflows"),
          separator("Factory Configuration"),
          folder("Workers", [
            page("Workers", "/docs/documentation/workers"),
            page("Mock workers", "/docs/documentation/mock-workers"),
          ]),
          folder("Resources", [
            page("Resources", "/docs/documentation/resources"),
          ]),
          separator("System Operations"),
          folder("Observability", [
            page("Logs", "/docs/documentation/logs"),
            page("Metrics", "/docs/documentation/metrics"),
          ]),
        ]),
      ],
    });

    const documentation = folderSignatureByName(
      signature,
      "Program documentation",
    );
    expect(documentation).toBeTruthy();
    if (!documentation) {
      throw new Error("expected Program documentation folder");
    }

    expect(separatorNamesInFolder(documentation)).toEqual([
      "System feature set",
      "Factory Configuration",
      "System Operations",
    ]);
    expect(
      secondaryFolderNamesUnderSeparator(
        documentation,
        "Factory Configuration",
      ),
    ).toEqual(["Workers", "Resources"]);
    expect(
      secondaryFolderNamesUnderSeparator(documentation, "System Operations"),
    ).toEqual(["Observability"]);
    expect(
      secondaryFolderNamesUnderSeparator(documentation, "System feature set"),
    ).toEqual([]);
    expect(
      pageEntriesUnderSeparator(documentation, "Factory Configuration"),
    ).toEqual([
      { name: "Workers", url: "/docs/documentation/workers" },
      { name: "Mock workers", url: "/docs/documentation/mock-workers" },
      { name: "Resources", url: "/docs/documentation/resources" },
    ]);
    expect(pageEntriesInFolder(documentation)).toEqual([
      {
        name: "Dynamic workflows",
        url: "/docs/documentation/dynamic-workflows",
      },
      { name: "Workers", url: "/docs/documentation/workers" },
      { name: "Mock workers", url: "/docs/documentation/mock-workers" },
      { name: "Resources", url: "/docs/documentation/resources" },
      { name: "Logs", url: "/docs/documentation/logs" },
      { name: "Metrics", url: "/docs/documentation/metrics" },
    ]);
  });
});
