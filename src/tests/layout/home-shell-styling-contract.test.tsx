import { describe, expect, test } from "bun:test";
import type { SharedProps } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  HomeBrowseLink,
  HomeBrowseList,
} from "@/components/home/home-browse-link";
import { HomeBrushHeader } from "@/components/home/home-brush-header";
import { getPrimaryNavItems } from "@/components/layout/primary-nav";
import { DocsIndexEntryList } from "@/features/docs/components/DocsIndexEntryList";
import { searchInlineResultsListClassName } from "@/features/docs/components/list-decoration";
import { proseAutoLinkClassName } from "@/features/docs/components/prose-auto-link-class";
import { TagResourceList } from "@/features/docs/components/TagResourceList";
import { SearchTrigger } from "@/features/docs/search/SearchTrigger";
import {
  DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS,
  DOCS_CHROME_TOKEN_MAP_SURFACES,
} from "@/features/docs/styles/docs-chrome-highlighting-token-map-contract";
import { TagsIndexList } from "@/features/docs/tags/TagsIndexList";
import type { TagResourceKindGroup } from "@/lib/content/tag-resources";
import type { TagIndexCategoryGroup } from "@/lib/content/tags";
import { loadUiMessages } from "@/lib/content/ui-messages";

const sampleTagGroups: TagIndexCategoryGroup[] = [
  {
    category: "module-type",
    categoryLabel: "Module type",
    tags: [
      {
        slug: "attention",
        title: "Attention",
        summary: "Attention mechanisms",
        url: "/tags/attention",
        category: "module-type",
        categoryLabel: "Module type",
      },
    ],
  },
];

const sampleTagResourceGroups: TagResourceKindGroup[] = [
  {
    kind: "module",
    kindLabel: "Module",
    resources: [
      {
        title: "Grouped-query attention",
        summary: "GQA module",
        url: "/docs/modules/grouped-query-attention",
        slug: "grouped-query-attention",
        kind: "module",
      },
    ],
  },
];

describe("Phase 1 home shell styling contracts", () => {
  test("primary nav, brush header, search trigger, prose link accent, and tag lists meet shared class contracts", async () => {
    const messages = await loadUiMessages();

    expect(getPrimaryNavItems(messages).map((item) => item.href)).toEqual([
      "/blog",
      "/browse",
      "/docs/guides",
      "/docs/references",
    ]);
    expect(
      getPrimaryNavItems(messages).some((item) => item.href === "/search"),
    ).toBe(false);
    expect(getPrimaryNavItems(messages).some((item) => item.href === "/")).toBe(
      false,
    );
    expect(
      getPrimaryNavItems(messages).some(
        (item) => item.href === "/docs/glossary",
      ),
    ).toBe(false);
    expect(
      getPrimaryNavItems(messages).some((item) => item.href === "/topology"),
    ).toBe(false);
    expect(
      getPrimaryNavItems(messages).some(
        (item) => item.href === "/docs/timeline",
      ),
    ).toBe(false);

    const brushHtml = renderToStaticMarkup(
      <HomeBrushHeader title="Model Atlas" subtitle="Reference" />,
    );
    expect(brushHtml).not.toContain("mb-8");

    const browseListHtml = renderToStaticMarkup(
      <HomeBrowseList ariaLabel="Browse">
        <HomeBrowseLink href="/tags" title="Tags" description="Browse by tag" />
      </HomeBrowseList>,
    );
    expect(browseListHtml).toContain("list-none");
    expect(browseListHtml).toContain("ps-0");
    expect(browseListHtml).not.toContain("list-disc");
    expect(browseListHtml).not.toMatch(/(?:^|[\s"'])-m[trblxy]?-/);

    const browseLinkHtml = renderToStaticMarkup(
      <HomeBrowseLink
        href="/docs/architecture"
        title="Architecture"
        description="System overview"
      />,
    );
    expect(browseLinkHtml).toContain("no-underline");
    expect(browseLinkHtml).toContain("hover:no-underline");
    expect(browseLinkHtml).toContain("focus-visible:ring-2");
    const withoutNoUnderline = browseLinkHtml.replaceAll("no-underline", "");
    expect(withoutNoUnderline).not.toMatch(/\bunderline\b/);

    const SearchDialog: ComponentType<SharedProps> = () => null;
    const searchHtml = renderToStaticMarkup(
      <RootProvider search={{ SearchDialog, enabled: true }}>
        <SearchTrigger messages={messages} />
      </RootProvider>,
    );
    expect(searchHtml).toContain('data-search=""');
    expect(searchHtml).toContain("!bg-background");
    expect(searchHtml).not.toContain("bg-secondary/50");
    expect(searchHtml).toContain("group-hover:text-primary-foreground");
    expect(searchHtml).toContain("group-focus-visible:text-primary-foreground");
    expect(searchHtml).toContain("focus-visible:ring-2");
    expect(searchHtml).toContain("focus-visible:ring-ring");
    expect(searchHtml).toContain(
      "hover:!bg-[var(--docs-chrome-primary-yellow)]",
    );
    expect(searchHtml).not.toContain("hover:!bg-accent");
    expect(searchHtml).not.toContain("group-hover:text-accent-foreground");

    // Locked chrome highlighting token map: five surfaces, primary-yellow hover.
    expect([...DOCS_CHROME_TOKEN_MAP_SURFACES]).toEqual([
      "searchGlobeGitHub",
      "toc",
      "sidebarRow",
      "headerTextIcons",
      "breadcrumb",
    ]);
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.searchGlobeGitHub
        .hoverActiveProof,
    ).toBe("#f5c76f");
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.sidebarRow.hoverActiveKind,
    ).toBe("background");
    expect(DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.toc.restProofs).toEqual([
      "#507f8c",
      "#8aaeb8",
    ]);
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.headerTextIcons.restProofs[0],
    ).toBe("#f7f2e8");
    expect(
      DOCS_CHROME_TOKEN_MAP_SURFACE_EXPECTATIONS.breadcrumb.restProofs[0],
    ).toBe("#8aaeb8");

    // Shared prose/chrome underline accent: secondary blue, not primary yellow.
    expect(proseAutoLinkClassName).toContain("text-secondary");
    expect(proseAutoLinkClassName).toContain("decoration-secondary");
    expect(proseAutoLinkClassName).toContain("hover:underline");
    expect(proseAutoLinkClassName).not.toContain("text-primary");
    expect(proseAutoLinkClassName).not.toContain("decoration-primary");

    const tagsIndexHtml = renderToStaticMarkup(
      <TagsIndexList groups={sampleTagGroups} listLabel="Tags" />,
    );
    expect(tagsIndexHtml).not.toContain("mt-8");
    expect(tagsIndexHtml).toContain("list-none");
    expect(tagsIndexHtml).not.toContain("list-disc");

    const tagResourceHtml = renderToStaticMarkup(
      <TagResourceList
        groups={sampleTagResourceGroups}
        listLabel="Resources"
      />,
    );
    expect(tagResourceHtml).not.toContain("mt-8");
    expect(tagResourceHtml).toContain("list-none");
    expect(tagResourceHtml).not.toContain("list-disc");
    expect(tagResourceHtml).toContain("no-underline");
    expect(tagResourceHtml).toContain("hover:no-underline");
    const tagResourceWithoutNoUnderline = tagResourceHtml.replaceAll(
      "no-underline",
      "",
    );
    expect(tagResourceWithoutNoUnderline).not.toMatch(/\bunderline\b/);
    expect(tagResourceHtml).toContain("focus-visible:ring-2");

    expect(searchInlineResultsListClassName).toContain("list-none");
    expect(searchInlineResultsListClassName).not.toContain("list-disc");

    const docsIndexHtml = renderToStaticMarkup(
      <DocsIndexEntryList
        entries={[
          {
            slug: "glossary/token",
            title: "Token",
            summary: "The smallest unit a model reads or writes.",
            url: "/docs/glossary/token",
          },
        ]}
        listLabel="Architecture entries"
      />,
    );
    expect(docsIndexHtml).toContain("list-none");
    expect(docsIndexHtml).not.toContain("list-disc");
  });
});
