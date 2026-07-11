import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import {
  buildExplorerTreeSignature,
  folderSignatureByName,
  pageEntriesInFolder,
  pageEntriesUnderSeparator,
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
});
