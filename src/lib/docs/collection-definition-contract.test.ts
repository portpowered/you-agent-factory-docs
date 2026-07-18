import { describe, expect, test } from "bun:test";
import {
  DIRECT_DOCS_ROUTE_FAMILY_IDS,
  DOCS_COLLECTION_IDS,
  DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS,
  type DocsCollectionDefinition,
  isDocsCollectionSidebarGroupingResolverId,
} from "@/lib/docs/collection-definition-contract";

const glossaryDefinition: DocsCollectionDefinition = {
  id: "glossary",
  routeSlug: "glossary",
  registryKind: "concept",
  frontmatterKind: "glossary",
  starterSlugs: ["glossary/token"],
  messageKeys: {
    browse: {
      sectionTitle: "browseIndex.glossarySectionTitle",
      sectionDescription: "browseIndex.glossarySectionDescription",
      sectionLinkLabel: "browseIndex.glossarySectionLinkLabel",
    },
    index: {
      title: "glossaryIndex.title",
      description: "glossaryIndex.description",
      listLabel: "glossaryIndex.listLabel",
      emptyTitle: "glossaryIndex.emptyTitle",
      emptyDescription: "glossaryIndex.emptyDescription",
      emptyHomeLink: "glossaryIndex.emptyHomeLink",
    },
  },
  sidebarGroupingResolverId: "glossary",
};

const guidesDefinition: DocsCollectionDefinition = {
  id: "guides",
  routeSlug: "guides",
  registryKind: "guide",
  frontmatterKind: "guide",
  starterSlugs: [],
  messageKeys: {
    browse: {
      sectionTitle: "browseIndex.guidesSectionTitle",
      sectionDescription: "browseIndex.guidesSectionDescription",
      sectionLinkLabel: "browseIndex.guidesSectionLinkLabel",
    },
    index: {
      title: "guidesIndex.title",
      description: "guidesIndex.description",
      listLabel: "guidesIndex.listLabel",
      emptyTitle: "guidesIndex.emptyTitle",
      emptyDescription: "guidesIndex.emptyDescription",
      emptyHomeLink: "guidesIndex.emptyHomeLink",
    },
  },
};

describe("collection definition contract", () => {
  test("allows route slug and frontmatter kind to diverge for glossary", () => {
    expect(glossaryDefinition.routeSlug).toBe("glossary");
    expect(glossaryDefinition.frontmatterKind).toBe("glossary");
    expect(glossaryDefinition.registryKind).toBe("concept");
  });

  test("allows collections without sidebar grouping resolver ids", () => {
    expect(guidesDefinition.sidebarGroupingResolverId).toBeUndefined();
  });

  test("allows empty starter slug lists for CLI collections", () => {
    expect(guidesDefinition.starterSlugs).toEqual([]);
  });

  test("exports the factory-only docs collection ids", () => {
    expect(DOCS_COLLECTION_IDS).toEqual([
      "guides",
      "concepts",
      "techniques",
      "documentation",
      "glossary",
      "references",
      "factories",
      "workers",
      "workstations",
    ]);
    expect(DIRECT_DOCS_ROUTE_FAMILY_IDS).toEqual([
      "references",
      "factories",
      "workers",
      "workstations",
    ]);
    for (const retiredId of [
      "modules",
      "models",
      "papers",
      "training",
      "systems",
    ] as const) {
      expect(DOCS_COLLECTION_IDS).not.toContain(retiredId);
      expect(DIRECT_DOCS_ROUTE_FAMILY_IDS).not.toContain(retiredId);
    }
  });

  test("constrains sidebar grouping resolver ids to factory collections", () => {
    expect(isDocsCollectionSidebarGroupingResolverId("glossary")).toBe(true);
    expect(isDocsCollectionSidebarGroupingResolverId("concepts")).toBe(true);
    expect(isDocsCollectionSidebarGroupingResolverId("documentation")).toBe(
      true,
    );
    expect(isDocsCollectionSidebarGroupingResolverId("modules")).toBe(false);
    expect(isDocsCollectionSidebarGroupingResolverId("models")).toBe(false);
    expect(isDocsCollectionSidebarGroupingResolverId("guides")).toBe(false);
    expect(DOCS_COLLECTION_SIDEBAR_GROUPING_RESOLVER_IDS).toEqual([
      "glossary",
      "concepts",
      "documentation",
    ]);
  });
});
