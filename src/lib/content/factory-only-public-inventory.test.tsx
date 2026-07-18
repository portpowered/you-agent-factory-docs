/**
 * End-to-end shell/navigation proof that the public docs inventory is
 * factory-only (guides, concepts, techniques, documentation, glossary) while
 * Blog and Search remain reachable as separate non-collection surfaces.
 *
 * Kept under `src/lib/content/` so it stays in required `bun run test`.
 */
import { describe, expect, test } from "bun:test";
import type { SharedProps } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  renderBlogIndexPage,
  renderBrowseIndexPage,
  renderSectionKindIndexPage,
} from "@/app/(site)/site-renderers";
import { DocsHeader } from "@/components/layout/docs-header";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { DOCS_BROWSE_COLLECTION_IDS } from "@/lib/docs/browse-collection-sections";
import { DOCS_COLLECTION_IDS } from "@/lib/docs/collection-definition-contract";
import { buildLocalizedRoute } from "@/lib/i18n/locale-routing";
import { collectSidebarPageLinks } from "@/lib/navigation/docs-sidebar-contract";
import { buildGeneratedDocsPageTree } from "@/lib/navigation/generated-docs-page-tree";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
import { source } from "@/lib/source";

const FACTORY_DOCS_COLLECTION_IDS = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
  "glossary",
  "references",
  "factories",
  "workers",
  "workstations",
] as const;

const FACTORY_BROWSE_COLLECTION_IDS = [
  "guides",
  "concepts",
  "techniques",
  "documentation",
] as const;

const RETIRED_ATLAS_COLLECTION_IDS = [
  "models",
  "modules",
  "papers",
  "training",
  "systems",
] as const;

const RETIRED_ATLAS_BROWSE_LABELS = [
  "Models",
  "Modules",
  "Papers",
  "Training",
  "Systems",
  "Model Types",
  "Inference",
  "Module Components",
] as const;

const FACTORY_SIDEBAR_FOLDER_NAMES = [
  "Guides",
  "Concepts",
  "Techniques",
  "Program documentation",
] as const;

const FACTORY_SECTION_INDEX_CASES = [
  {
    kind: "guide" as const,
    title: "Guides",
    pageHref: "/docs/guides/getting-started",
  },
  {
    kind: "concept" as const,
    title: "Concepts",
    pageHref: "/docs/concepts/harness",
  },
  {
    kind: "technique" as const,
    title: "Techniques",
    pageHref: "/docs/techniques/ralph",
  },
  {
    kind: "documentation" as const,
    title: "Documentation",
    pageHref: "/docs/documentation/what-is-you-agent-factory",
  },
] as const;

function topLevelFolderNames(
  pageTree: ReturnType<typeof buildGeneratedDocsPageTree>,
): string[] {
  return pageTree.children
    .filter((node) => node.type === "folder")
    .map((folder) => String(folder.name));
}

describe("factory-only public inventory end-to-end", () => {
  test("public docs collection contract is factory-only", () => {
    expect([...DOCS_COLLECTION_IDS]).toEqual([...FACTORY_DOCS_COLLECTION_IDS]);
    expect([...DOCS_BROWSE_COLLECTION_IDS]).toEqual([
      ...FACTORY_BROWSE_COLLECTION_IDS,
    ]);

    for (const retiredId of RETIRED_ATLAS_COLLECTION_IDS) {
      expect(DOCS_COLLECTION_IDS).not.toContain(retiredId);
      expect(DOCS_BROWSE_COLLECTION_IDS).not.toContain(retiredId);
    }
  });

  test("browse hub and section indexes expose factory collections only", async () => {
    const browseHtml = renderToStaticMarkup(await renderBrowseIndexPage());

    for (const label of ["Guides", "Concepts", "Techniques", "Documentation"]) {
      expect(browseHtml).toContain(label);
    }
    for (const href of [
      "/docs/guides",
      "/docs/concepts",
      "/docs/techniques",
      "/docs/documentation",
    ]) {
      expect(browseHtml).toContain(`href="${href}"`);
    }
    for (const label of RETIRED_ATLAS_BROWSE_LABELS) {
      expect(browseHtml).not.toContain(`>${label}<`);
    }
    for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
      expect(browseHtml).not.toContain(`id="${id}-heading"`);
      expect(browseHtml).not.toContain(`href="/docs/${id}"`);
    }

    for (const section of FACTORY_SECTION_INDEX_CASES) {
      const html = renderToStaticMarkup(
        await renderSectionKindIndexPage(section.kind),
      );
      expect(html).toContain(section.title);
      expect(html).toContain(section.pageHref);
    }
  });

  test("docs sidebar folders stay factory-only without Atlas destinations", () => {
    const pageTree = buildGeneratedDocsPageTree({
      name: "Docs",
      children: [],
    });
    const folderNames = topLevelFolderNames(pageTree);

    expect(folderNames).toEqual([...FACTORY_SIDEBAR_FOLDER_NAMES]);
    expect(folderNames).toEqual(topLevelFolderNames(source.pageTree));

    for (const retired of [
      "Models",
      "Modules",
      "Papers",
      "Training",
      "Systems",
      "Model Types",
      "Inference",
      "Module Components",
    ]) {
      expect(folderNames).not.toContain(retired);
    }

    const links = collectSidebarPageLinks(source.pageTree);
    expect(links.some((link) => link.url.startsWith("/docs/guides/"))).toBe(
      true,
    );
    expect(links.some((link) => link.url.startsWith("/docs/concepts/"))).toBe(
      true,
    );
    for (const id of RETIRED_ATLAS_COLLECTION_IDS) {
      expect(links.some((link) => link.url.startsWith(`/docs/${id}/`))).toBe(
        false,
      );
    }
  });

  test("Blog and Search remain reachable as separate surfaces outside DocsCollectionId", async () => {
    expect(youAgentFactorySiteConfig.routeSurfaces).toMatchObject({
      blogIndex: { surface: "blog-index" },
      search: { surface: "search" },
    });
    expect((DOCS_COLLECTION_IDS as readonly string[]).includes("blog")).toBe(
      false,
    );
    expect((DOCS_COLLECTION_IDS as readonly string[]).includes("search")).toBe(
      false,
    );
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).toContain("blogIndex");
    expect(
      youAgentFactorySiteConfig.primaryNav.map((entry) => entry.routeSurface),
    ).not.toContain("search");

    const messages = await loadUiMessages();
    const primaryNav = getPrimaryNavItems(messages);
    expect(primaryNav.map((item) => item.label)).toEqual([
      "Home",
      "Guides",
      "Docs",
      "Glossary",
      "Blog",
    ]);
    expect(primaryNav.map((item) => item.href)).toEqual([
      "/",
      "/docs/guides",
      "/browse",
      "/docs/glossary",
      "/blog",
    ]);

    const SearchDialog: ComponentType<SharedProps> = () => null;
    const headerHtml = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <DocsHeader
          messages={messages}
          pageTree={source.pageTree}
          siteConfig={youAgentFactorySiteConfig}
        />
      </RootProvider>,
    );
    expect(headerHtml).toContain('href="/blog"');
    expect(headerHtml).toContain(">Blog<");
    expect(headerHtml).toContain('data-search=""');
    expect(headerHtml).toContain(`aria-label="${messages.search.open}"`);
    expect(headerHtml).not.toMatch(
      /<nav\b[^>]*\baria-label="Primary"[^>]*>[\s\S]*href="\/search"/i,
    );

    const blogHtml = renderToStaticMarkup(await renderBlogIndexPage());
    expect(blogHtml).toContain(messages.blogIndex.title);
    expect(blogHtml).toContain(messages.blogIndex.description);
    expect(
      buildLocalizedRoute(youAgentFactorySiteConfig.routeSurfaces.blogIndex),
    ).toBe("/blog");
    expect(
      buildLocalizedRoute(youAgentFactorySiteConfig.routeSurfaces.search),
    ).toBe("/search");
    expect(messages.searchEntry.title.length).toBeGreaterThan(0);
    expect(messages.searchEntry.description.length).toBeGreaterThan(0);
    expect(messages.search.open.length).toBeGreaterThan(0);
  });
});
