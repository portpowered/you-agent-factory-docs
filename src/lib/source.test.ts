import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import { hasDocumentationSidebarMembership } from "@/lib/content/sidebar-grouping";
import { source } from "@/lib/source";

const TOP_LEVEL_FOLDER_NAMES = {
  guides: "Guides",
  documentation: "Program documentation",
  concepts: "Concepts",
  techniques: "Techniques",
  references: "Reference",
  "internal-architecture": "Internal architecture",
  miscellanea: "Miscellanea",
} as const;

const NESTED_REFERENCE_FOLDER_NAMES = {
  factories: "Factories",
  workers: "Workers",
  workstations: "Workstations",
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

function getNestedFolderChildren(
  parentFolderName: string,
  nestedFolderName: string,
): Node[] {
  const nested = getFolderChildren(parentFolderName).find(
    (node) => node.type === "folder" && node.name === nestedFolderName,
  );
  expect(nested?.type).toBe("folder");
  if (nested?.type !== "folder") {
    throw new Error(
      `expected nested ${nestedFolderName} folder under ${parentFolderName}`,
    );
  }
  return nested.children;
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

    expect(folderNames).toEqual(Object.values(TOP_LEVEL_FOLDER_NAMES));
    expect(folderNames).not.toContain("Glossary");
    expect(folderNames).not.toContain("Factories");
    expect(source.pageTree.name).toBe("You Agent Factory");
    for (const retiredFolder of RETIRED_ATLAS_FOLDER_NAMES) {
      expect(folderNames).not.toContain(retiredFolder);
    }

    const nestedNames = getFolderChildren(TOP_LEVEL_FOLDER_NAMES.references)
      .filter((node) => node.type === "folder")
      .map((node) => String(node.name));
    expect(nestedNames).toEqual(Object.values(NESTED_REFERENCE_FOLDER_NAMES));
  });

  test("generated folder URLs stay within their published section contract without exact inventories", () => {
    const publishedPages = loadPublishedDocsPagesSync("en");
    const publishedByUrl = new Map(
      publishedPages.map((page) => [page.url, page] as const),
    );

    for (const [section, folderName] of Object.entries(
      TOP_LEVEL_FOLDER_NAMES,
    )) {
      if (
        section === "references" ||
        section === "internal-architecture" ||
        section === "miscellanea"
      ) {
        continue;
      }

      const folderUrls = collectPageUrls(getFolderChildren(folderName));
      const sectionPrefix = `/docs/${section}/`;

      expect(
        countUnique(folderUrls),
        `${folderName} should not repeat sidebar routes`,
      ).toBe(folderUrls.length);

      for (const url of folderUrls) {
        const page = publishedByUrl.get(url);
        expect(
          page,
          `${folderName} route ${url} should resolve from the published docs runtime`,
        ).toBeDefined();
        if (!page) {
          continue;
        }

        if (section === "documentation") {
          expect(
            hasDocumentationSidebarMembership(page.docsSlug),
            `${folderName} route ${url} should have Program documentation membership`,
          ).toBe(true);
        } else {
          expect(
            url.startsWith(sectionPrefix),
            `${folderName} route ${url} should stay in ${sectionPrefix}`,
          ).toBe(true);
          expect(
            hasDocumentationSidebarMembership(page.docsSlug),
            `${folderName} route ${url} should not be claimed by Program membership`,
          ).toBe(false);
        }

        expect(
          source.getPage(docsSlugFromUrl(url)),
          `${folderName} route ${url} should resolve through the Fumadocs source`,
        ).toBeDefined();
      }

      if (
        publishedPages.some(
          (page) =>
            page.docsSlug.startsWith(`${section}/`) &&
            (section === "documentation"
              ? hasDocumentationSidebarMembership(page.docsSlug)
              : !hasDocumentationSidebarMembership(page.docsSlug)),
        )
      ) {
        expect(
          folderUrls.length,
          `${folderName} should expose published routes`,
        ).toBeGreaterThan(0);
      }
    }

    const referenceUrls = collectPageUrls(
      getFolderChildren(TOP_LEVEL_FOLDER_NAMES.references),
    );
    expect(
      referenceUrls.some((url) => url.startsWith("/docs/references/")),
    ).toBe(true);
    expect(
      referenceUrls.some((url) =>
        url.endsWith("/docs/documentation/throttling-and-limits"),
      ),
    ).toBe(true);
    expect(
      referenceUrls.some((url) => url.startsWith("/docs/factories/")),
    ).toBe(true);

    for (const [section, folderName] of Object.entries(
      NESTED_REFERENCE_FOLDER_NAMES,
    )) {
      const folderUrls = collectPageUrls(
        getNestedFolderChildren(TOP_LEVEL_FOLDER_NAMES.references, folderName),
      );
      for (const url of folderUrls) {
        expect(url.startsWith(`/docs/${section}/`)).toBe(true);
        expect(
          hasDocumentationSidebarMembership(
            publishedByUrl.get(url)?.docsSlug ?? "",
          ),
        ).toBe(false);
      }
    }
  });

  test("published factory sections keep representative anchors in the sidebar", () => {
    const publishedPages = loadPublishedDocsPagesSync("en");

    for (const [section, folderName] of Object.entries(
      TOP_LEVEL_FOLDER_NAMES,
    )) {
      if (
        section === "references" ||
        section === "internal-architecture" ||
        section === "miscellanea"
      ) {
        continue;
      }

      const folderUrls = collectPageUrls(getFolderChildren(folderName));
      const publishedSectionUrls = publishedPages
        .filter((page) => {
          if (section === "documentation") {
            return hasDocumentationSidebarMembership(page.docsSlug);
          }
          if (!page.docsSlug.startsWith(`${section}/`)) {
            return false;
          }
          // Cross-collection Program membership moves tree placement out of
          // the route-family folder (factories config → Configuring). Mode A
          // pending / deferred / demoted documentation pages also lack
          // membership and stay out of Program.
          return !hasDocumentationSidebarMembership(page.docsSlug);
        })
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

    const referenceUrls = collectPageUrls(
      getFolderChildren(TOP_LEVEL_FOLDER_NAMES.references),
    );
    expect(referenceUrls).toContain("/docs/references/api");
    expect(referenceUrls).toContain("/docs/factories/sessions");
    expect(referenceUrls).toContain("/docs/workers/agent");
    expect(referenceUrls).toContain("/docs/workstations/inference-run");
    expect(referenceUrls).toContain(
      "/docs/documentation/throttling-and-limits",
    );
  });

  test("representative factory discovery routes resolve through the Fumadocs source", () => {
    for (const [section, urls] of Object.entries(REPRESENTATIVE_SECTION_URLS)) {
      const folderUrls = collectPageUrls(
        getFolderChildren(
          TOP_LEVEL_FOLDER_NAMES[
            section as keyof typeof TOP_LEVEL_FOLDER_NAMES
          ],
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

    expect(separatorNames).toContain("Harnesses");
    expect(separatorNames).toContain("Industrial engineering");
    expect(separatorNames).toContain("Model inference");
    expect(separatorNames).not.toContain("Reference Samples");
    for (const retiredFolder of RETIRED_ATLAS_FOLDER_NAMES) {
      expect(folderNames).not.toContain(retiredFolder);
    }
  });

  test("page tree exposes Program documentation subgroups in declared order without FAQ nested inside", () => {
    const children = getFolderChildren("Program documentation");
    const separatorNames = children
      .filter((node) => node.type === "separator")
      .map((node) => String(node.name));
    const pageUrls = collectPageUrls(children);
    const secondaryFolderNames = children
      .filter((node) => node.type === "folder")
      .map((node) => String(node.name));

    expect(separatorNames).toEqual([
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
      expect(separatorNames).not.toContain(former);
    }
    expect(pageUrls).not.toContain("/docs/documentation/faq");
    expect(source.pageTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });
    expect(secondaryFolderNames).toContain("Configuring you-agent-factory");
    expect(secondaryFolderNames).not.toContain("Workers");
    expect(secondaryFolderNames).not.toContain("Observability");
    expect(pageUrls).toContain("/docs/documentation/what-is-you-agent-factory");
    expect(pageUrls).toContain("/docs/documentation/cli");
    expect(pageUrls).toContain("/docs/factories/configuration");
    expect(pageUrls).toContain("/docs/factories/global-configuration");
    expect(pageUrls).not.toContain("/docs/documentation/throttling-and-limits");
    expect(pageUrls).not.toContain("/docs/documentation/install");
    expect(pageUrls).not.toContain("/docs/documentation/mock-workers");
    expect(pageUrls).toContain("/docs/documentation/logs");
  });
});
