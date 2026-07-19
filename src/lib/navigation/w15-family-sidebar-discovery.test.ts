/**
 * W15 story 003: four route families are discoverable as top-level docs
 * explorer folders in topology order, with settled page children only
 * (no operation / event-variant / schema-definition inventory flood).
 */
import { describe, expect, test } from "bun:test";
import type { Node } from "fumadocs-core/page-tree";
import {
  FACTORY_EXPLORER_FOLDER_LABELS,
  FACTORY_SIDEBAR_COLLECTION_IDS,
} from "@/lib/content/factory-breadcrumb-sidebar";
import { loadPublishedDocsPagesSync } from "@/lib/content/pages";
import { DIRECT_DOCS_ROUTE_FAMILY_IDS } from "@/lib/docs/collection-definition-contract";
import {
  collectSidebarPageLinks,
  findSidebarPageLink,
} from "@/lib/navigation/docs-sidebar-contract";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";

const W15_FAMILY_FOLDER_ORDER = [
  FACTORY_EXPLORER_FOLDER_LABELS.references,
  FACTORY_EXPLORER_FOLDER_LABELS.factories,
  FACTORY_EXPLORER_FOLDER_LABELS.workers,
  FACTORY_EXPLORER_FOLDER_LABELS.workstations,
] as const;

const SETTLED_FAMILY_PAGE_PROOFS = [
  {
    folderName: FACTORY_EXPLORER_FOLDER_LABELS.references,
    url: "/docs/references/api",
    name: "API",
  },
  {
    folderName: FACTORY_EXPLORER_FOLDER_LABELS.factories,
    url: "/docs/factories/configuration",
    name: "Configuration",
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

describe("W15 family sidebar discovery", () => {
  test("explorer collection ids append W15 families after CLI collections in topology order", () => {
    expect([...FACTORY_SIDEBAR_COLLECTION_IDS]).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
      ...DIRECT_DOCS_ROUTE_FAMILY_IDS,
    ]);
    expect([...DIRECT_DOCS_ROUTE_FAMILY_IDS]).toEqual([
      "references",
      "factories",
      "workers",
      "workstations",
    ]);
  });

  test("generated page tree exposes the four families as top-level folders in topology relative order", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const folderNames = getTopLevelFolderNames(pageTree);

    expect(folderNames).toEqual([
      FACTORY_EXPLORER_FOLDER_LABELS.guides,
      FACTORY_EXPLORER_FOLDER_LABELS.concepts,
      FACTORY_EXPLORER_FOLDER_LABELS.techniques,
      FACTORY_EXPLORER_FOLDER_LABELS.documentation,
      ...W15_FAMILY_FOLDER_ORDER,
    ]);

    const familyIndexes = W15_FAMILY_FOLDER_ORDER.map((name) =>
      folderNames.indexOf(name),
    );
    expect(familyIndexes.every((index) => index >= 0)).toBe(true);
    expect(familyIndexes).toEqual([...familyIndexes].sort((a, b) => a - b));
    expect(folderNames).not.toContain("Glossary");
    expect(pageTree.children.at(-1)).toEqual({
      type: "page",
      name: "FAQ",
      url: "/docs/documentation/faq",
    });
  });

  test("family folders list settled published pages only, without inventory path flood", () => {
    const pageTree = buildGeneratedDocsPageTree({ name: "Docs", children: [] });
    const publishedPages = loadPublishedDocsPagesSync("en");

    for (const familyId of DIRECT_DOCS_ROUTE_FAMILY_IDS) {
      const folderName = FACTORY_EXPLORER_FOLDER_LABELS[familyId];
      const children = getFolderChildren(pageTree, folderName);
      const links = collectSidebarPageLinks(children);
      const publishedFamilyUrls = publishedPages
        .filter((page) => page.docsSlug.startsWith(`${familyId}/`))
        .map((page) => page.url)
        .sort();

      expect(getSeparatorLabels(children)).toEqual([]);
      expect(links.map((link) => link.url).sort()).toEqual(publishedFamilyUrls);

      for (const link of links) {
        const pathAfterDocs = link.url.replace(/^\/docs\//, "");
        const segments = pathAfterDocs.split("/");
        // Settled family pages are /docs/<family>/<page> only — not deeper
        // operation / event-variant / schema-definition inventory routes.
        expect(segments).toHaveLength(2);
        expect(segments[0]).toBe(familyId);
        expect(link.url.includes("#")).toBe(false);
      }
    }

    for (const proof of SETTLED_FAMILY_PAGE_PROOFS) {
      const links = collectSidebarPageLinks(
        getFolderChildren(pageTree, proof.folderName),
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
