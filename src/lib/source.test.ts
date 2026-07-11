import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import { source } from "@/lib/source";

const SECTION_FOLDER_NAMES = {
  guides: "Guides",
  concepts: "Concepts",
  techniques: "Techniques",
  documentation: "Program documentation",
} as const;

const RETIRED_ATLAS_FOLDER_NAMES = [
  "Modules",
  "Models",
  "Papers",
  "Training",
  "Systems",
  "Model Types",
  "Inference",
  "Module Components",
] as const;

const REPRESENTATIVE_SECTION_URLS = {
  guides: ["/docs/guides/getting-started"],
  concepts: ["/docs/concepts/harness", "/docs/concepts/compaction"],
  techniques: ["/docs/techniques/ralph", "/docs/techniques/writer-reviewer"],
  documentation: ["/docs/documentation/what-is-you-agent-factory"],
} as const;

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

function collectSeparatorNames(nodes: Node[]): string[] {
  const names: string[] = [];

  for (const node of nodes) {
    if (node.type === "separator" && typeof node.name === "string") {
      names.push(node.name);
    }
    if (node.type === "folder" && "children" in node) {
      names.push(...collectSeparatorNames(node.children));
    }
  }

  return names;
}

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

function docsSlugFromUrl(url: string): string[] {
  return url.replace("/docs/", "").split("/");
}

function countUnique(values: string[]): number {
  return new Set(values).size;
}

describe("docs navigation source", () => {
  test("page tree keeps only factory docs folders", () => {
    const folderNames = source.pageTree.children
      .filter((node) => node.type === "folder")
      .map((node) => String(node.name));

    expect(folderNames).toEqual(Object.values(SECTION_FOLDER_NAMES));
    expect(folderNames).not.toContain("Glossary");
    expect(source.pageTree.name).toBe("You Agent Factory");
    for (const retiredFolder of RETIRED_ATLAS_FOLDER_NAMES) {
      expect(folderNames).not.toContain(retiredFolder);
    }
  });

  test("generated folder URLs stay within their published section contract without exact inventories", () => {
    const publishedPages = loadPublishedDocsPagesSync("en");

    for (const [section, folderName] of Object.entries(SECTION_FOLDER_NAMES)) {
      const folderUrls = collectPageUrls(getFolderChildren(folderName));
      const publishedSectionUrls = new Set(
        publishedPages
          .filter((page) => page.docsSlug.startsWith(`${section}/`))
          .map((page) => page.url),
      );
      const sectionPrefix = `/docs/${section}/`;

      expect(
        countUnique(folderUrls),
        `${folderName} should not repeat sidebar routes`,
      ).toBe(folderUrls.length);

      for (const url of folderUrls) {
        expect(
          url.startsWith(sectionPrefix),
          `${folderName} route ${url} should stay in ${sectionPrefix}`,
        ).toBe(true);
        expect(
          publishedSectionUrls.has(url),
          `${folderName} route ${url} should resolve from the published docs runtime`,
        ).toBe(true);
        expect(
          source.getPage(docsSlugFromUrl(url)),
          `${folderName} route ${url} should resolve through the Fumadocs source`,
        ).toBeDefined();
      }

      if (publishedSectionUrls.size > 0) {
        expect(
          folderUrls.length,
          `${folderName} should expose published routes`,
        ).toBeGreaterThan(0);
      }
    }
  });

  test("published factory sections keep representative anchors in the sidebar", () => {
    const publishedPages = loadPublishedDocsPagesSync("en");

    for (const [section, folderName] of Object.entries(SECTION_FOLDER_NAMES)) {
      const folderUrls = collectPageUrls(getFolderChildren(folderName));
      const publishedSectionUrls = publishedPages
        .filter((page) => page.docsSlug.startsWith(`${section}/`))
        .map((page) => page.url);

      if (publishedSectionUrls.length === 0) {
        expect(folderUrls).toEqual([]);
        continue;
      }

      expect(
        folderUrls,
        `${folderName} should surface the first published route as a representative anchor`,
      ).toContain(publishedSectionUrls[0] as string);
      expect(
        folderUrls,
        `${folderName} should surface the last published route as a representative anchor`,
      ).toContain(publishedSectionUrls.at(-1) as string);
    }
  });

  test("representative factory discovery routes resolve through the Fumadocs source", () => {
    for (const [section, urls] of Object.entries(REPRESENTATIVE_SECTION_URLS)) {
      const folderUrls = collectPageUrls(
        getFolderChildren(
          SECTION_FOLDER_NAMES[section as keyof typeof SECTION_FOLDER_NAMES],
        ),
      );

      for (const url of urls) {
        expect(folderUrls).toContain(url);
        expect(source.getPage(docsSlugFromUrl(url))).toBeDefined();
      }
    }
  });

  test("page tree exposes factory concepts grouping separators without Atlas folders", () => {
    const separatorNames = collectSeparatorNames(source.pageTree.children);
    const folderNames = source.pageTree.children
      .filter((node) => node.type === "folder")
      .map((node) => String(node.name));

    expect(separatorNames).toContain("Reference Samples");
    for (const retiredFolder of RETIRED_ATLAS_FOLDER_NAMES) {
      expect(folderNames).not.toContain(retiredFolder);
    }
  });
});
