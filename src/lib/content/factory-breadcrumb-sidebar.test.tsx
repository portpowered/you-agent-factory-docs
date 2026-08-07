/**
 * Story converge-factory-search-navigation-005 proof: breadcrumbs and sidebar
 * follow factory collection definitions only.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildDocsBreadcrumbSegments,
  DocsPageBreadcrumb,
} from "@/features/docs/components/DocsPageBreadcrumb";
import {
  assertFactoryBreadcrumbSegments,
  assertFactoryExplorerSectionOrder,
  assertFactoryNavCollectionId,
  assertFactorySidebarFolderLabel,
  assertFactorySidebarFolderLabels,
  assertFactorySidebarPageUrl,
  assertFactorySidebarPageUrls,
  assertFactorySidebarSectionOrder,
  DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG,
  DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
  DOCS_PAGE_TREE_ROOT_NAME,
  FACTORY_EXPLORER_FOLDER_LABELS,
  FACTORY_EXPLORER_SECTION_ORDER,
  FACTORY_NAV_COLLECTION_IDS,
  FACTORY_SIDEBAR_COLLECTION_IDS,
  FACTORY_SIDEBAR_FOLDER_LABELS,
  isFactoryNavCollectionId,
  isRetiredAtlasNavCollectionId,
  RETIRED_ATLAS_NAV_COLLECTION_IDS,
  RETIRED_ATLAS_NAV_FOLDER_LABELS,
  resolveFactorySidebarFolderLabel,
} from "@/lib/content/factory-breadcrumb-sidebar";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { DOCS_COLLECTION_IDS } from "@/lib/docs/collection-definition-contract";
import {
  collectSidebarPageLinks,
  findSidebarPageLink,
} from "@/lib/navigation/docs-sidebar-contract";
import { DOCS_SIDEBAR_TOP_LEVEL_GROUPS } from "@/lib/navigation/docs-sidebar-sections";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";

const REPRESENTATIVE_FACTORY_PAGES = [
  {
    collectionId: "guides" as const,
    slug: ["guides", "run-your-first-factory"],
    title: "Run Your First Factory",
    href: "/docs/guides/run-your-first-factory",
    folderLabel: "Guides",
  },
  {
    collectionId: "concepts" as const,
    slug: ["concepts", "harness"],
    title: "Harness",
    href: "/docs/concepts/harness",
    folderLabel: "Concepts",
  },
  {
    collectionId: "techniques" as const,
    slug: ["techniques", "ralph"],
    title: "Ralph",
    href: "/docs/techniques/ralph",
    folderLabel: "Techniques",
  },
  {
    collectionId: "documentation" as const,
    slug: ["documentation", "what-is-you-agent-factory"],
    title: "What is you-agent-factory",
    href: "/docs/documentation/what-is-you-agent-factory",
    folderLabel: "Program documentation",
  },
] as const;

/** Folder names one level below the four reader-facing groups. */
function collectionFolderNames(
  pageTree: ReturnType<typeof buildGeneratedDocsPageTree>,
): string[] {
  return pageTree.children
    .filter((node) => node.type === "folder")
    .flatMap((group) =>
      group.children
        .filter((node) => node.type === "folder")
        .map((folder) => String(folder.name)),
    );
}

describe("factory breadcrumbs and sidebar collections", () => {
  test("factory nav contract matches docs collections and excludes Atlas ids", () => {
    expect([...FACTORY_NAV_COLLECTION_IDS]).toEqual([...DOCS_COLLECTION_IDS]);
    expect([...FACTORY_SIDEBAR_COLLECTION_IDS]).toEqual([
      "guides",
      "references",
      "documentation",
      "concepts",
      "techniques",
      "factories",
      "workers",
      "workstations",
    ]);
    expect([...FACTORY_NAV_COLLECTION_IDS]).toEqual([
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
    expect(
      FACTORY_SIDEBAR_COLLECTION_IDS.map((id) =>
        resolveFactorySidebarFolderLabel(id),
      ),
      // Collection order now follows the four reader-facing groups: How-tos
      // (Guides), References (Reference), Information (Program documentation,
      // Concepts, Techniques).
    ).toEqual([
      "Guides",
      "Reference",
      "Program documentation",
      "Concepts",
      "Techniques",
      "Factories",
      "Workers",
      "Workstations",
    ]);
    expect(Object.values(FACTORY_EXPLORER_FOLDER_LABELS)).toEqual([
      "Guides",
      "Concepts",
      "Techniques",
      "Program documentation",
      "Reference",
      "Factories",
      "Workers",
      "Workstations",
    ]);
    expect(FACTORY_SIDEBAR_FOLDER_LABELS.documentation).toBe(
      "Program documentation",
    );
    expect(FACTORY_SIDEBAR_FOLDER_LABELS.references).toBe("Reference");
    expect(FACTORY_SIDEBAR_FOLDER_LABELS.glossary).toBe("Glossary");
    expect(DOCS_PAGE_TREE_ROOT_NAME).toBe("You Agent Factory");

    for (const id of FACTORY_NAV_COLLECTION_IDS) {
      expect(isFactoryNavCollectionId(id)).toBe(true);
      expect(isRetiredAtlasNavCollectionId(id)).toBe(false);
      expect(() => assertFactoryNavCollectionId(id)).not.toThrow();
    }

    for (const id of RETIRED_ATLAS_NAV_COLLECTION_IDS) {
      expect(isFactoryNavCollectionId(id)).toBe(false);
      expect(isRetiredAtlasNavCollectionId(id)).toBe(true);
      expect(() => assertFactoryNavCollectionId(id)).toThrow(
        /outside the factory nav set/,
      );
    }

    for (const label of RETIRED_ATLAS_NAV_FOLDER_LABELS) {
      expect(() => assertFactorySidebarFolderLabel(label)).toThrow(
        /retired Atlas navigation label/,
      );
    }

    expect(() =>
      assertFactoryBreadcrumbSegments([
        { label: "Home", href: "/" },
        { label: "Modules", href: "/docs/modules" },
        { label: "ReLU" },
      ]),
    ).toThrow(/retired Atlas navigation label/);

    expect(() =>
      assertFactoryBreadcrumbSegments([
        { label: "Home", href: "/" },
        { label: "Modules", href: "/docs/modules/grouped-query-attention" },
        { label: "GQA" },
      ]),
    ).toThrow(/retired Atlas|deleted Atlas/);

    expect(() =>
      assertFactorySidebarPageUrl("/docs/modules/grouped-query-attention"),
    ).toThrow(/deleted Atlas inventory/);
    expect(() =>
      assertFactorySidebarPageUrls(["/docs/concepts/harness"]),
    ).not.toThrow();
    expect(() =>
      assertFactorySidebarSectionOrder([
        "guides",
        "references",
        "documentation",
        "concepts",
        "techniques",
      ]),
    ).not.toThrow();
    expect(() =>
      assertFactorySidebarSectionOrder([...FACTORY_SIDEBAR_COLLECTION_IDS]),
    ).toThrow(/section order/);
    expect(() =>
      assertFactorySidebarSectionOrder([...FACTORY_NAV_COLLECTION_IDS]),
    ).toThrow(/section order/);
    expect(() =>
      assertFactorySidebarSectionOrder(["guides", "models"]),
    ).toThrow(/section order/);
    expect(() =>
      assertFactoryExplorerSectionOrder([...FACTORY_EXPLORER_SECTION_ORDER]),
    ).not.toThrow();
    expect(() => assertFactoryExplorerSectionOrder([])).toThrow(
      /explorer section order/,
    );
  });

  test("breadcrumbs resolve Home → factory collection → page for each live collection", async () => {
    const messages = await loadUiMessages();

    for (const page of REPRESENTATIVE_FACTORY_PAGES) {
      const segments = buildDocsBreadcrumbSegments(
        [...page.slug],
        page.title,
        messages,
      );
      const html = renderToStaticMarkup(
        <DocsPageBreadcrumb
          messages={messages}
          slug={[...page.slug]}
          title={page.title}
        />,
      );

      expect(segments.map((segment) => segment.label)).toEqual([
        "Home",
        page.folderLabel,
        page.title,
      ]);
      expect(segments[1]?.href).toBe(`/docs/${page.collectionId}`);
      expect(html).toContain('href="/"');
      expect(html).toContain(`href="/docs/${page.collectionId}"`);
      expect(html).toContain(`>${page.folderLabel}<`);
      expect(html).toContain(`>${page.title}<`);

      for (const retired of RETIRED_ATLAS_NAV_FOLDER_LABELS) {
        expect(html).not.toContain(`>${retired}<`);
      }
      for (const id of RETIRED_ATLAS_NAV_COLLECTION_IDS) {
        expect(html).not.toContain(`href="/docs/${id}"`);
      }
    }
  });

  test("retired Atlas section slugs never become breadcrumb collection crumbs", async () => {
    const messages = await loadUiMessages();
    const segments = buildDocsBreadcrumbSegments(
      ["modules", "grouped-query-attention"],
      "Grouped Query Attention",
      messages,
    );

    expect(segments.map((segment) => segment.label)).toEqual([
      "Home",
      "Grouped Query Attention",
    ]);
    expect(segments.some((segment) => segment.href === "/docs/modules")).toBe(
      false,
    );
  });

  test("docs sidebar folders and page links stay factory-only", () => {
    const sections = DOCS_SIDEBAR_TOP_LEVEL_GROUPS.flatMap(
      (group) => group.sections,
    );

    expect(sections).toEqual([...FACTORY_EXPLORER_SECTION_ORDER]);
    assertFactoryExplorerSectionOrder(sections);
    assertFactorySidebarSectionOrder(
      sections.flatMap((section) =>
        section.kind === "collection" || section.kind === "inlined-collection"
          ? [section.id]
          : [],
      ),
    );

    const pageTree = buildGeneratedDocsPageTree({
      name: "Docs",
      children: [],
    });
    const folderNames = collectionFolderNames(pageTree);
    // FAQ and the collection folders now live inside the Information group
    // rather than at the tree's top level.
    const informationGroup = pageTree.children.find(
      (node) => node.type === "folder" && node.name === "Information",
    );
    const informationChildren =
      informationGroup?.type === "folder" ? informationGroup.children : [];
    const topLevelFaq = informationChildren.find(
      (node) =>
        node.type === "page" &&
        "url" in node &&
        node.url === DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
    );
    const documentationFolder = informationChildren.find(
      (node) => node.type === "folder" && node.name === "Program documentation",
    );

    expect(pageTree.name).toBe(DOCS_PAGE_TREE_ROOT_NAME);
    expect(pageTree.children.map((node) => String(node.name))).toEqual([
      "Quick starts",
      "How-tos",
      "References",
      "Information",
    ]);
    expect(folderNames).toEqual([
      // How-tos
      "Guides",
      // References — the Reference collection folder is inlined into the group,
      // so its nested route families surface here directly.
      "Factories",
      "Workers",
      "Workstations",
      // Information
      "Program documentation",
      "Concepts",
      "Techniques",
      "Internal architecture",
      "Miscellanea",
    ]);
    expect(folderNames).not.toContain("Glossary");
    // The route families sit under the References group rather than beside it.
    const referencesGroup = pageTree.children.find(
      (node) => node.type === "folder" && node.name === "References",
    );
    const referenceChildNames =
      referencesGroup?.type === "folder"
        ? referencesGroup.children.map((node) => String(node.name))
        : [];
    for (const label of [
      FACTORY_EXPLORER_FOLDER_LABELS.factories,
      FACTORY_EXPLORER_FOLDER_LABELS.workers,
      FACTORY_EXPLORER_FOLDER_LABELS.workstations,
    ]) {
      expect(referenceChildNames).toContain(label);
    }
    assertFactorySidebarFolderLabels(folderNames);
    expect(topLevelFaq).toEqual({
      type: "page",
      name: "FAQ",
      url: DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
    });
    expect(informationChildren.at(-1)).toEqual(topLevelFaq);
    expect(DOCS_EXPLORER_TOP_LEVEL_FAQ_DOCS_SLUG).toBe("documentation/faq");
    if (documentationFolder?.type === "folder") {
      expect(
        documentationFolder.children.some(
          (node) =>
            node.type === "page" &&
            "url" in node &&
            node.url === DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
        ),
      ).toBe(false);
    }

    for (const retired of RETIRED_ATLAS_NAV_FOLDER_LABELS) {
      expect(folderNames).not.toContain(retired);
    }

    const links = collectSidebarPageLinks(pageTree);
    assertFactorySidebarPageUrls(links.map((link) => link.url));
    expect(findSidebarPageLink(links, DOCS_EXPLORER_TOP_LEVEL_FAQ_URL)).toEqual(
      {
        name: "FAQ",
        url: DOCS_EXPLORER_TOP_LEVEL_FAQ_URL,
      },
    );

    for (const page of REPRESENTATIVE_FACTORY_PAGES) {
      expect(findSidebarPageLink(links, page.href)).toEqual({
        name: page.title,
        url: page.href,
      });
    }

    for (const id of RETIRED_ATLAS_NAV_COLLECTION_IDS) {
      expect(links.some((link) => link.url.startsWith(`/docs/${id}/`))).toBe(
        false,
      );
    }

    expect(
      findSidebarPageLink(links, "/docs/modules/grouped-query-attention"),
    ).toBeUndefined();
    expect(findSidebarPageLink(links, "/docs/models/gpt-3")).toBeUndefined();
  });
});
