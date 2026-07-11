import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";

function collectPageUrls(nodes: Node[]): string[] {
  const urls: string[] = [];

  for (const node of nodes) {
    if (node.type === "page" && "url" in node && typeof node.url === "string") {
      urls.push(node.url);
    }
    if (node.type === "folder" && "children" in node) {
      urls.push(...collectPageUrls(node.children));
    }
  }

  return urls;
}

describe("generated docs page tree wiring", () => {
  test("preserves base tree children replacement while setting explorer brand name", () => {
    const baseTree = {
      name: "Fixture Docs Root",
      children: [
        {
          type: "page" as const,
          name: "Placeholder",
          url: "/docs/placeholder",
        },
      ],
    };
    const pageTree = buildGeneratedDocsPageTree(baseTree);

    expect(pageTree.name).toBe("You Agent Factory");
    expect(pageTree.children).not.toEqual(baseTree.children);
    expect(
      pageTree.children.every(
        (node) => node.type === "folder" || node.type === "page",
      ),
    ).toBe(true);
    expect(
      pageTree.children.some(
        (node) => node.type === "folder" && node.name === "Glossary",
      ),
    ).toBe(false);
    expect(
      pageTree.children.some(
        (node) =>
          node.type === "page" &&
          "url" in node &&
          node.url === "/docs/documentation/faq",
      ),
    ).toBe(true);
  });

  test("lists every published page exactly once in the explorer tree", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const publishedPages = loadPublishedDocsPagesSync("en");
    const sidebarUrls = collectPageUrls(pageTree.children).sort();
    const documentationFolder = pageTree.children.find(
      (node) => node.type === "folder" && node.name === "Program documentation",
    );

    expect(sidebarUrls).toEqual(
      [...publishedPages].map((page) => page.url).sort(),
    );
    expect(new Set(sidebarUrls).size).toBe(sidebarUrls.length);
    expect(pageTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });
    if (documentationFolder?.type === "folder") {
      expect(collectPageUrls(documentationFolder.children)).not.toContain(
        "/docs/documentation/faq",
      );
    }
  });
});
