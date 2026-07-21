import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import {
  buildExplorerTreeSignature,
  folderSignatureByName,
  pageEntriesInFolder,
  pageEntriesInSecondaryFolderUnderSeparator,
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
          separator("Orientation"),
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
          separator("Orientation"),
          page(
            "What is you-agent-factory",
            "/docs/documentation/what-is-you-agent-factory",
          ),
          separator("Capabilities"),
          page("Harness support", "/docs/documentation/harness-support"),
          separator("Interfaces"),
          page("CLI", "/docs/documentation/cli"),
          separator("Operations"),
          folder("Configuring you-agent-factory", [
            page("Resources", "/docs/documentation/resources"),
            page("Configuration", "/docs/factories/configuration"),
            page(
              "Global Configuration",
              "/docs/factories/global-configuration",
            ),
          ]),
          page("Logs", "/docs/documentation/logs"),
          page("Metrics", "/docs/documentation/metrics"),
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
      "Orientation",
      "Capabilities",
      "Interfaces",
      "Operations",
    ]);
    expect(
      secondaryFolderNamesUnderSeparator(documentation, "Operations"),
    ).toEqual(["Configuring you-agent-factory"]);
    expect(
      secondaryFolderNamesUnderSeparator(documentation, "Orientation"),
    ).toEqual([]);
    expect(
      secondaryFolderNamesUnderSeparator(documentation, "Capabilities"),
    ).toEqual([]);
    expect(pageEntriesUnderSeparator(documentation, "Operations")).toEqual([
      { name: "Resources", url: "/docs/documentation/resources" },
      { name: "Configuration", url: "/docs/factories/configuration" },
      {
        name: "Global Configuration",
        url: "/docs/factories/global-configuration",
      },
      { name: "Logs", url: "/docs/documentation/logs" },
      { name: "Metrics", url: "/docs/documentation/metrics" },
    ]);
    expect(
      pageEntriesInSecondaryFolderUnderSeparator(
        documentation,
        "Operations",
        "Configuring you-agent-factory",
      ),
    ).toEqual([
      { name: "Resources", url: "/docs/documentation/resources" },
      { name: "Configuration", url: "/docs/factories/configuration" },
      {
        name: "Global Configuration",
        url: "/docs/factories/global-configuration",
      },
    ]);
    expect(
      pageEntriesInSecondaryFolderUnderSeparator(
        documentation,
        "Operations",
        "Missing",
      ),
    ).toEqual([]);
    expect(pageEntriesInFolder(documentation)).toEqual([
      {
        name: "What is you-agent-factory",
        url: "/docs/documentation/what-is-you-agent-factory",
      },
      { name: "Harness support", url: "/docs/documentation/harness-support" },
      { name: "CLI", url: "/docs/documentation/cli" },
      { name: "Resources", url: "/docs/documentation/resources" },
      { name: "Configuration", url: "/docs/factories/configuration" },
      {
        name: "Global Configuration",
        url: "/docs/factories/global-configuration",
      },
      { name: "Logs", url: "/docs/documentation/logs" },
      { name: "Metrics", url: "/docs/documentation/metrics" },
    ]);
  });
});
