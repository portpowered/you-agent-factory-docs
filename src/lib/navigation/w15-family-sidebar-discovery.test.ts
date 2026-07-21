/**
 * W15 story 003 (updated PS-100): four route families remain discoverable —
 * Reference is top-level; Factories / Workers / Workstations nest under
 * Reference. Settled page children only (no inventory path flood).
 */
import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import {
  FACTORY_EXPLORER_FOLDER_LABELS,
  FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS,
  FACTORY_REFERENCE_NESTED_COLLECTION_IDS,
  FACTORY_SIDEBAR_COLLECTION_IDS,
} from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import {
  hasDocumentationSidebarMembership,
  hasReferenceSidebarMembership,
  SIDEBAR_GROUP_LABELS,
} from "@/lib/content/sidebar-grouping";
import { DIRECT_DOCS_ROUTE_FAMILY_IDS } from "@/lib/docs/collection-definition-contract";
import {
  collectSidebarPageLinks,
  findSidebarPageLink,
} from "@/lib/navigation/docs-sidebar-contract";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";

const SETTLED_NESTED_FAMILY_PAGE_PROOFS = [
  {
    folderName: FACTORY_EXPLORER_FOLDER_LABELS.factories,
    url: "/docs/factories/sessions",
    name: "Factory Sessions",
  },
  {
    folderName: FACTORY_EXPLORER_FOLDER_LABELS.workers,
    url: "/docs/workers/agent",
    name: "Agent worker",
  },
  {
    folderName: FACTORY_EXPLORER_FOLDER_LABELS.workstations,
    url: "/docs/workstations/inference-run",
    name: "Inference-run workstation",
  },
] as const;

function getTopLevelFolderNames(pageTree: { children: Node[] }): string[] {
  return pageTree.children
    .filter((node) => node.type === "folder")
    .map((folder) => String(folder.name));
}

function getFolderChildren(
  pageTree: { children: Node[] },
  folderName: string,
): Node[] {
  const folder = pageTree.children.find(
    (node) => node.type === "folder" && node.name === folderName,
  );
  expect(folder?.type).toBe("folder");
  if (folder?.type !== "folder") {
    throw new Error(`expected ${folderName} folder in docs sidebar`);
  }
  return folder.children;
}

function getNestedFolderChildren(
  parentChildren: Node[],
  folderName: string,
): Node[] {
  const folder = parentChildren.find(
    (node) => node.type === "folder" && node.name === folderName,
  );
  expect(folder?.type).toBe("folder");
  if (folder?.type !== "folder") {
    throw new Error(`expected nested ${folderName} folder under Reference`);
  }
  return folder.children;
}

describe("W15 family sidebar discovery", () => {
  test("explorer collection ids keep W15 families after CLI with Reference nesting", () => {
    expect([...FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS]).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
      "references",
    ]);
    expect([...FACTORY_REFERENCE_NESTED_COLLECTION_IDS]).toEqual([
      "factories",
      "workers",
      "workstations",
    ]);
    expect([...FACTORY_SIDEBAR_COLLECTION_IDS]).toEqual([
      ...FACTORY_EXPLORER_TOP_LEVEL_COLLECTION_IDS,
      ...FACTORY_REFERENCE_NESTED_COLLECTION_IDS,
    ]);
    expect([...DIRECT_DOCS_ROUTE_FAMILY_IDS]).toEqual([
      "references",
      "factories",
      "workers",
      "workstations",
    ]);
  });

  test("generated page tree nests Factories / Workers / Workstations under Reference", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const folderNames = getTopLevelFolderNames(pageTree);

    expect(folderNames).toEqual([
      FACTORY_EXPLORER_FOLDER_LABELS.guides,
      FACTORY_EXPLORER_FOLDER_LABELS.concepts,
      FACTORY_EXPLORER_FOLDER_LABELS.techniques,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
      FACTORY_EXPLORER_FOLDER_LABELS.references,
    ]);
    expect(folderNames).not.toContain(FACTORY_EXPLORER_FOLDER_LABELS.factories);
    expect(folderNames).not.toContain(FACTORY_EXPLORER_FOLDER_LABELS.workers);
    expect(folderNames).not.toContain(
      FACTORY_EXPLORER_FOLDER_LABELS.workstations,
    );
    expect(folderNames).not.toContain("Glossary");
    expect(pageTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });

    const referenceChildren = getFolderChildren(
      pageTree,
      FACTORY_EXPLORER_FOLDER_LABELS.references,
    );
    expect(getSeparatorLabels(referenceChildren)).toEqual([
      SIDEBAR_GROUP_LABELS.references.contracts,
      SIDEBAR_GROUP_LABELS.references.schemas,
      SIDEBAR_GROUP_LABELS.references.limits,
    ]);
    expect(
      referenceChildren
        .filter((node) => node.type === "folder")
        .map((node) => String(node.name)),
    ).toEqual([
      FACTORY_EXPLORER_FOLDER_LABELS.factories,
      FACTORY_EXPLORER_FOLDER_LABELS.workers,
      FACTORY_EXPLORER_FOLDER_LABELS.workstations,
    ]);
  });

  test("family folders list settled published pages only, without inventory path flood", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const publishedPages = loadPublishedDocsPagesSync("en");
    const referenceChildren = getFolderChildren(
      pageTree,
      FACTORY_EXPLORER_FOLDER_LABELS.references,
    );

    const referenceLinks = collectSidebarPageLinks(referenceChildren).filter(
      (link) => link.url.startsWith("/docs/references/"),
    );
    const publishedReferenceUrls = publishedPages
      .filter(
        (page) =>
          page.docsSlug.startsWith("references/") &&
          hasReferenceSidebarMembership(page.docsSlug),
      )
      .map((page) => page.url)
      .sort();
    expect(referenceLinks.map((link) => link.url).sort()).toEqual(
      publishedReferenceUrls,
    );

    for (const familyId of FACTORY_REFERENCE_NESTED_COLLECTION_IDS) {
      const folderName = FACTORY_EXPLORER_FOLDER_LABELS[familyId];
      const children = getNestedFolderChildren(referenceChildren, folderName);
      const links = collectSidebarPageLinks(children);
      const publishedFamilyUrls = publishedPages
        .filter(
          (page) =>
            page.docsSlug.startsWith(`${familyId}/`) &&
            !hasDocumentationSidebarMembership(page.docsSlug),
        )
        .map((page) => page.url)
        .sort();

      expect(getSeparatorLabels(children)).toEqual([]);
      expect(links.map((link) => link.url).sort()).toEqual(publishedFamilyUrls);

      for (const link of links) {
        const pathAfterDocs = link.url.replace(/^\/docs\//, "");
        const segments = pathAfterDocs.split("/");
        expect(segments).toHaveLength(2);
        expect(segments[0]).toBe(familyId);
        expect(link.url.includes("#")).toBe(false);
      }
    }

    expect(
      findSidebarPageLink(
        collectSidebarPageLinks(referenceChildren),
        "/docs/references/api",
      ),
    ).toEqual({
      name: "API",
      url: "/docs/references/api",
    });
    expect(
      findSidebarPageLink(
        collectSidebarPageLinks(referenceChildren),
        "/docs/documentation/throttling-and-limits",
      ),
    ).toMatchObject({
      url: "/docs/documentation/throttling-and-limits",
    });

    for (const proof of SETTLED_NESTED_FAMILY_PAGE_PROOFS) {
      const links = collectSidebarPageLinks(
        getNestedFolderChildren(referenceChildren, proof.folderName),
      );
      expect(findSidebarPageLink(links, proof.url)).toEqual({
        name: proof.name,
        url: proof.url,
      });
    }

    const allLinks = collectSidebarPageLinks(pageTree);
    expect(
      findSidebarPageLink(
        allLinks,
        "/docs/references/api/submitWorkBySessionId",
      ),
    ).toBeUndefined();
    expect(
      findSidebarPageLink(
        allLinks,
        "/docs/references/events/session.completed",
      ),
    ).toBeUndefined();
    expect(
      findSidebarPageLink(allLinks, "/docs/references/factory-schema/Factory"),
    ).toBeUndefined();
  });
});

function getSeparatorLabels(nodes: Node[]): string[] {
  return nodes
    .filter((node) => node.type === "separator")
    .map((node) => String(node.name));
}
