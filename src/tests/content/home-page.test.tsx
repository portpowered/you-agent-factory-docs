import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeArticle } from "@/components/home/home-article";
import { loadUiMessages } from "@/lib/content/ui-messages";
import { PLACEHOLDER_SIDEBAR_DESCRIPTION } from "@/lib/navigation/docs-sidebar-contract";
import { buildHomeTableOfContents } from "@/lib/navigation/home-page-toc";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";
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
    expect(home.title).toBe("you-agent-factory");
    expect(home.subtitle).toBe("Docs for the agent factory CLI");
    expect(home.intro).toContain("you-agent-factory");
    expect(home.title).not.toMatch(/Model Atlas/i);
    expect(home.subtitle).not.toMatch(/Model Atlas/i);
    expect(home.intro).not.toMatch(/Model Atlas/i);
    expect(home.intro).not.toMatch(/Search by alias/i);
    expect(home.intro).not.toMatch(/search by tag/i);
    expect(home.browseSectionTitle.length).toBeGreaterThan(0);
    expect(home.installSectionTitle).toBe("Install");
    expect(home.installMacosLinuxCommand).toContain("install.sh");
    expect(home.installWindowsCommand).toContain("install.ps1");
    expect(home.runSectionTitle).toBe("Run a named goal");
    expect(home.runCommand).toContain("you run --named");
    expect(home.runCommand).toContain("@goal/");
    expect(home.onThisPageInstall).toBe("Install");
    expect(home.onThisPageRun).toBe("Run");
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
    expect(youAgentFactorySiteConfig.homeFeaturedLinks).toEqual([]);
  });
});

describe("home page render", () => {
  async function renderHomeArticleHtml(): Promise<string> {
    const messages = await loadUiMessages();
    return renderToStaticMarkup(
      <HomeArticle
        messages={messages}
        siteConfig={youAgentFactorySiteConfig}
      />,
    );
  }

  it("renders you-agent-factory identity without Atlas module featured destinations", async () => {
    const html = await renderHomeArticleHtml();
    expect(html).toContain("you-agent-factory");
    expect(html).toContain("Docs for the agent factory CLI");
    expect(html).not.toContain("Model Atlas");
    expect(html).toContain('id="install"');
    expect(html).toContain('id="run"');
    expect(html).toContain('id="browse"');
    for (const href of ATLAS_MODULE_FEATURED_HREFS) {
      expect(html).not.toContain(`href="${href}"`);
    }
    expect(html).not.toContain('href="/browse"');
  });

  it("renders a dedicated install CTA with macOS/Linux and Windows commands", async () => {
    const html = await renderHomeArticleHtml();
    expect(html).toContain('id="install"');
    expect(html).toContain('id="home-install-heading"');
    expect(html).toContain("Install");
    expect(html).toContain("macOS / Linux");
    expect(html).toContain("Windows (PowerShell)");
    expect(html).toContain(
      "curl -fsSL https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh | sh",
    );
    expect(html).toContain(
      "irm https://github.com/portpowered/you-agent-factory/releases/latest/download/install.ps1 | iex",
    );
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
  });

  it("renders a first-run you run --named example with an @goal target", async () => {
    const html = await renderHomeArticleHtml();
    expect(html).toContain('id="run"');
    expect(html).toContain('id="home-run-heading"');
    expect(html).toContain("Run a named goal");
    expect(html).toContain("First run");
    expect(html).toContain("you run --named @goal/blah");
    expect(html).toContain("<pre");
    expect(html).toContain("<code");
  });

  it("preserves browse section structure on the vietnamese route surface without Atlas module links", async () => {
    const messages = await loadUiMessages("vi");
    const html = renderToStaticMarkup(
      <HomeArticle
        messages={messages}
        siteConfig={youAgentFactorySiteConfig}
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
        siteConfig={youAgentFactorySiteConfig}
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

  it("defines On this page Install, Run, and Browse anchors without a removed #search target", async () => {
    const { home } = await loadUiMessages();
    const toc = buildHomeTableOfContents(home);
    const html = await renderHomeArticleHtml();

    expect(toc.some((item) => item.url === "#install")).toBe(true);
    expect(toc.some((item) => item.url === "#run")).toBe(true);
    expect(toc.some((item) => item.url === "#browse")).toBe(true);
    expect(toc.some((item) => item.url === "#search")).toBe(false);
    expect(html).toContain('id="install"');
    expect(html).toContain('id="run"');
    expect(html).toContain('id="browse"');
    expect(html).not.toContain('id="search"');
  });
});
