import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
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

  test("keeps explorer folders free of Glossary after locale pruning", () => {
    const localizedTree = localizePageTree(source.pageTree, "vi");

    expect(topLevelFolderNames(localizedTree.children)).toEqual([
      "Guides",
      "Concepts",
      "Techniques",
      "Program documentation",
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
});
