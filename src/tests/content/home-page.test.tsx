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
    expect(home.whySectionTitle).toBe("Why you-agent-factory");
    expect(home.whyBody).toMatch(/hundreds of agents/i);
    expect(home.featuresSectionTitle).toBe("What you get");
    expect(home.featuresIntro).toMatch(/harness/i);
    expect(home.featureHarnesses).toMatch(/harness/i);
    expect(home.featureLoop).toContain("loop");
    expect(home.featureReview).toContain("review");
    expect(home.featurePlanner).toContain("planner");
    expect(home.featureCrons).toContain("crons");
    expect(home.featureEventStreams).toContain("event streams");
    expect(home.onThisPageInstall).toBe("Install");
    expect(home.onThisPageRun).toBe("Run");
    expect(home.onThisPageWhy).toBe("Why");
    expect(home.onThisPageFeatures).toBe("Features");
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
    expect(html).toContain('id="why"');
    expect(html).toContain('id="features"');
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

  it("renders why and feature-list sections in the docs article flow", async () => {
    const html = await renderHomeArticleHtml();
    expect(html).toContain('id="why"');
    expect(html).toContain('id="home-why-heading"');
    expect(html).toContain("Why you-agent-factory");
    expect(html).toContain("hundreds of agents");
    expect(html).toContain('id="features"');
    expect(html).toContain('id="home-features-heading"');
    expect(html).toContain("What you get");
    expect(html).toMatch(/harness/i);
    expect(html).toContain("loop");
    expect(html).toContain("review");
    expect(html).toContain("planner");
    expect(html).toContain("crons");
    expect(html).toContain("event streams");
    expect(html).toContain("list-none");
    expect(html).not.toContain("list-disc");
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

  it("defines On this page Install, Run, Why, Features, and Browse anchors without a removed #search target", async () => {
    const { home } = await loadUiMessages();
    const toc = buildHomeTableOfContents(home);
    const html = await renderHomeArticleHtml();

    expect(toc.map((item) => item.url)).toEqual([
      "#install",
      "#run",
      "#why",
      "#features",
      "#browse",
    ]);
    expect(toc.some((item) => item.url === "#search")).toBe(false);
    expect(html).toContain('id="install"');
    expect(html).toContain('id="run"');
    expect(html).toContain('id="why"');
    expect(html).toContain('id="features"');
    expect(html).toContain('id="browse"');
    expect(html).not.toContain('id="search"');
  });
});
