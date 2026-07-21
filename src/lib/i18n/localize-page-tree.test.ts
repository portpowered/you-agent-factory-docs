import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { localizePageTree } from "@/lib/i18n/localize-page-tree";
import { source } from "@/lib/source";

function collectLinks(children: Node[]): string[] {
  const links: string[] = [];

  for (const child of children) {
    if ("url" in child && typeof child.url === "string") {
      links.push(child.url);
    }

    if ("children" in child && Array.isArray(child.children)) {
      links.push(...collectLinks(child.children));
    }
  }

  return links;
}

function topLevelFolderNames(children: Node[]): string[] {
  return children
    .filter((child) => child.type === "folder")
    .map((folder) => String(folder.name));
}

function folderByName(children: Node[], name: string) {
  return children.find(
    (child) => child.type === "folder" && String(child.name) === name,
  );
}

function separatorNames(children: Node[]): string[] {
  return children
    .filter((child) => child.type === "separator")
    .map((separator) => String(separator.name));
}

describe("localizePageTree", () => {
  test("omits unshipped and retired Atlas docs links from the localized page tree", () => {
    const localizedTree = localizePageTree(source.pageTree, "vi");
    const links = collectLinks(localizedTree.children);

    expect(links).not.toContain("/docs/getting-started");
    expect(links).not.toContain("/vi/docs/getting-started");
    expect(links).not.toContain("/vi/docs/modules/multi-head-latent-attention");
    expect(links).not.toContain("/vi/docs/modules/sparse-attention");
    expect(links).not.toContain("/vi/docs/glossary/token");
  });

  test("localizes shipped factory docs links for vi page trees", () => {
    const localizedTree = localizePageTree(source.pageTree, "vi");
    const links = collectLinks(localizedTree.children);

    expect(links).toContain("/vi/docs/guides/getting-started");
    expect(links).toContain("/vi/docs/concepts/harness");
    expect(links).toContain("/vi/docs/techniques/ralph");
    expect(links).toContain("/vi/docs/documentation/what-is-you-agent-factory");
    expect(topLevelFolderNames(localizedTree.children)).not.toContain(
      "Glossary",
    );
  });

  test("localizes shipped factory docs links for japanese page trees", () => {
    const localizedTree = localizePageTree(source.pageTree, "ja");
    const links = collectLinks(localizedTree.children);

    expect(links).toContain("/ja/docs/guides/getting-started");
    expect(links).toContain("/ja/docs/concepts/harness");
    expect(links).toContain("/ja/docs/techniques/ralph");
    expect(links).toContain("/ja/docs/documentation/what-is-you-agent-factory");
    expect(links).not.toContain("/ja/docs/modules/attention");
    expect(links).not.toContain("/ja/docs/glossary/token");
    expect(topLevelFolderNames(localizedTree.children)).not.toContain(
      "Glossary",
    );
  });

  test("keeps explorer folders free of Glossary after locale pruning", async () => {
    const messages = await loadUiMessages("vi");
    const localizedTree = localizePageTree(source.pageTree, "vi", { messages });

    expect(topLevelFolderNames(localizedTree.children)).toEqual([
      messages.explorer.folders.guides,
      messages.explorer.folders.documentation,
      messages.explorer.folders.concepts,
      messages.explorer.folders.techniques,
      messages.explorer.folders.references,
      messages.explorer.virtualFolders.miscellanea,
    ]);
    expect(localizedTree.name).toBe("You Agent Factory");
    expect(localizedTree.children.at(-1)).toMatchObject({
      type: "page",
      url: "/vi/docs/documentation/faq",
    });
    expect(collectLinks(localizedTree.children)).toContain(
      "/vi/docs/documentation/faq",
    );
  });

  test("localizes collection, subgroup, and page labels for japanese explorer trees", async () => {
    const messages = await loadUiMessages("ja");
    const localizedTree = localizePageTree(source.pageTree, "ja", { messages });
    const folderNames = topLevelFolderNames(localizedTree.children);

    expect(folderNames.slice(0, 5)).toEqual([
      messages.explorer.folders.guides,
      messages.explorer.folders.documentation,
      messages.explorer.folders.concepts,
      messages.explorer.folders.techniques,
      messages.explorer.folders.references,
    ]);
    expect(folderNames).toContain(messages.explorer.virtualFolders.miscellanea);
    expect(folderNames).not.toContain(
      messages.explorer.virtualFolders["internal-architecture"],
    );
    expect(folderNames).not.toContain("Miscellanea");
    expect(folderNames).not.toContain("Internal architecture");
    // Factories / workers / workstations folders prune when no pages are
    // shipped for the locale (current shipped set includes references/api).
    expect(folderNames).not.toContain(messages.explorer.folders.factories);

    const concepts = folderByName(
      localizedTree.children,
      messages.explorer.folders.concepts,
    );
    expect(concepts?.type).toBe("folder");
    if (concepts?.type !== "folder") {
      throw new Error("expected Concepts folder");
    }

    expect(separatorNames(concepts.children)).toEqual([
      messages.explorer.conceptsGroups.harnesses,
      messages.explorer.conceptsGroups["industrial-engineering"],
      messages.explorer.conceptsGroups["model-inference"],
    ]);

    const guides = folderByName(
      localizedTree.children,
      messages.explorer.folders.guides,
    );
    expect(guides?.type).toBe("folder");
    if (guides?.type !== "folder") {
      throw new Error("expected Guides folder");
    }
    const gettingStartedNode = guides.children.find(
      (child) =>
        child.type === "page" &&
        "url" in child &&
        child.url === "/ja/docs/guides/getting-started",
    );
    expect(gettingStartedNode).toMatchObject({
      type: "page",
      name: "はじめに",
    });

    const documentation = folderByName(
      localizedTree.children,
      messages.explorer.folders.documentation,
    );
    expect(documentation?.type).toBe("folder");
    if (documentation?.type !== "folder") {
      throw new Error("expected Program documentation folder");
    }
    expect(separatorNames(documentation.children)[0]).toBe(
      messages.explorer.documentationGroups.orientation,
    );
    expect(separatorNames(documentation.children)).toContain(
      messages.explorer.documentationGroups.capabilities,
    );
    expect(separatorNames(documentation.children)).toContain(
      messages.explorer.documentationGroups.interfaces,
    );
    expect(separatorNames(documentation.children)).toContain(
      messages.explorer.documentationGroups.operations,
    );

    const operationsLabel = messages.explorer.documentationGroups.operations;
    expect(separatorNames(documentation.children)).toContain(operationsLabel);

    const links = collectLinks(documentation.children);
    if (
      links.some((link) => link.endsWith("/ja/docs/documentation/resources"))
    ) {
      const operationsIndex = separatorNames(documentation.children).indexOf(
        operationsLabel,
      );
      expect(operationsIndex).toBeGreaterThanOrEqual(0);
      const configuringFolder = documentation.children
        .slice(operationsIndex + 1)
        .find(
          (child) =>
            child.type === "folder" &&
            String(child.name) ===
              messages.explorer.documentationSecondaries.configuring,
        );
      expect(configuringFolder?.type).toBe("folder");
    }
  });

  test("preserves literal you-agent-factory identifiers in localized page labels", async () => {
    const messages = await loadUiMessages("ja");
    const localizedTree = localizePageTree(source.pageTree, "ja", { messages });
    const documentation = folderByName(
      localizedTree.children,
      messages.explorer.folders.documentation,
    );
    expect(documentation?.type).toBe("folder");
    if (documentation?.type !== "folder") {
      throw new Error("expected Program documentation folder");
    }

    const whatIs = documentation.children.find(
      (child) =>
        child.type === "page" &&
        "url" in child &&
        child.url === "/ja/docs/documentation/what-is-you-agent-factory",
    );
    expect(String(whatIs && "name" in whatIs ? whatIs.name : "")).toContain(
      "you-agent-factory",
    );
  });
});
