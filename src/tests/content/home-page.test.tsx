import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeArticle } from "@/components/home/home-article";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { PLACEHOLDER_SIDEBAR_DESCRIPTION } from "@/lib/navigation/docs-sidebar-contract";
import { buildHomeTableOfContents } from "@/lib/navigation/home-page-toc";
import { modelAtlasSiteConfig } from "@/lib/site/model-atlas-site-config";
import { expectHomeArticleHeaderOnlySearchEntry } from "@/tests/discovery/home-search-entry-contract";

/** Atlas module destinations must not appear on the default home featured list. */
const ATLAS_MODULE_FEATURED_HREFS = [
  "/docs/modules/grouped-query-attention",
  "/docs/modules/swiglu",
  "/docs/modules/relu",
] as const;

describe("home page messages", () => {
  it("loads localized copy for title, search, and browse sections", async () => {
    const { home } = await loadUiMessages();
    expect(home.title).toBe("Model Atlas");
    expect(home.subtitle.length).toBeGreaterThan(0);
    expect(home.intro.length).toBeGreaterThan(0);
    expect(home.intro).not.toMatch(/Search by alias/i);
    expect(home.intro).not.toMatch(/search by tag/i);
    expect(home.browseSectionTitle.length).toBeGreaterThan(0);
    expect(home.onThisPageBrowse).toBe("Browse");
  });

  it("keeps legacy Atlas featured-link message keys available for B01 without requiring them in site config", async () => {
    const { home } = await loadUiMessages();
    expect(home.atlasLinkTitle.length).toBeGreaterThan(0);
    expect(home.gqaLinkTitle.length).toBeGreaterThan(0);
    expect(home.swigluLinkTitle.length).toBeGreaterThan(0);
    expect(home.reluLinkTitle.length).toBeGreaterThan(0);
    expect(home.atlasLinkDescription.length).toBeGreaterThan(0);
    expect(home.gqaLinkDescription.length).toBeGreaterThan(0);
    expect(home.swigluLinkDescription.length).toBeGreaterThan(0);
    expect(home.reluLinkDescription.length).toBeGreaterThan(0);
    expect(modelAtlasSiteConfig.homeFeaturedLinks).toEqual([]);
  });
});

describe("home page render", () => {
  async function renderHomeArticleHtml(): Promise<string> {
    const messages = await loadUiMessages();
    return renderToStaticMarkup(
      <HomeArticle messages={messages} siteConfig={modelAtlasSiteConfig} />,
    );
  }

  it("renders the browse section without Atlas module featured destinations", async () => {
    const html = await renderHomeArticleHtml();
    expect(html).toContain("Model Atlas");
    expect(html).toContain('id="browse"');
    for (const href of ATLAS_MODULE_FEATURED_HREFS) {
      expect(html).not.toContain(`href="${href}"`);
    }
    expect(html).not.toContain('href="/browse"');
  });

  it("preserves browse section structure on the vietnamese route surface without Atlas module links", async () => {
    const messages = await loadUiMessages("vi");
    const html = renderToStaticMarkup(
      <HomeArticle
        messages={messages}
        siteConfig={modelAtlasSiteConfig}
        locale="vi"
      />,
    );

    expect(html).toContain("Cẩm nang về các mô hình và module AI hiện đại");
    expect(html).toContain('id="browse"');
    expect(html).not.toContain('href="/vi/browse"');
    expect(html).not.toContain(
      'href="/vi/docs/modules/grouped-query-attention"',
    );
    expect(html).not.toContain('href="/docs/modules/swiglu"');
    expect(html).not.toContain('href="/docs/modules/relu"');
  });

  it("preserves browse section structure on the japanese route surface without Atlas module links", async () => {
    const messages = await loadUiMessages("ja");
    const html = renderToStaticMarkup(
      <HomeArticle
        messages={messages}
        siteConfig={modelAtlasSiteConfig}
        locale="ja"
      />,
    );

    expect(html).toContain(
      "現代の AI モデルとモジュールのためのフィールドガイド",
    );
    expect(html).toContain('id="browse"');
    expect(html).not.toContain('href="/ja/browse"');
    expect(html).not.toContain(
      'href="/ja/docs/modules/grouped-query-attention"',
    );
    expect(html).not.toContain('href="/docs/modules/swiglu"');
    expect(html).not.toContain('href="/docs/modules/relu"');
  });

  it("omits verbose search handoff prose and inline /search link", async () => {
    const html = await renderHomeArticleHtml();
    expect(html).not.toContain("Search entry page");
    expect(html).not.toContain(
      "Use the Search control in the header to jump to modules",
    );
    expect(html).not.toContain("Search by alias or tag");
    expectHomeArticleHeaderOnlySearchEntry(html);
  });

  it("does not render placeholder scaffold copy in the article body", async () => {
    const html = await renderHomeArticleHtml();
    expect(html).not.toContain(PLACEHOLDER_SIDEBAR_DESCRIPTION);
    expect(html).not.toContain("lorem");
  });

  it("renders an empty browse list without persistent underlines", async () => {
    const html = await renderHomeArticleHtml();

    expect(html).toContain("list-none");
    expect(html).not.toContain("list-disc");
    const withoutNoUnderline = html.replaceAll("no-underline", "");
    expect(withoutNoUnderline).not.toMatch(/\bunderline\b/);
  });

  it("defines On this page Browse anchor without a removed #search target", async () => {
    const { home } = await loadUiMessages();
    const toc = buildHomeTableOfContents(home);
    const html = await renderHomeArticleHtml();

    expect(toc.some((item) => item.url === "#browse")).toBe(true);
    expect(toc.some((item) => item.url === "#search")).toBe(false);
    expect(html).toContain('id="browse"');
    expect(html).not.toContain('id="search"');
  });
});
