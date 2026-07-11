import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  HOME_ARTICLE_CLASS,
  HOME_ARTICLE_CONTENT_COLUMN_SURFACE,
  HomeArticle,
} from "@/components/home/home-article";
import { bulletlessListClassName } from "@/features/docs/components/list-decoration";
import { loadUiMessages } from "@/lib/content/ui-messages";
import {
  CONTENT_COLUMN_CONSUMER_SURFACES,
  CONTENT_COLUMN_INSET_CLASS,
  usesNegativeMarginCompensation,
} from "@/lib/layout/content-column-alignment";
import { youAgentFactorySiteConfig } from "@/lib/site/you-agent-factory-site-config";

describe("home article + Browse content-column alignment", () => {
  test("registers home-article-browse as a shared content-column consumer", () => {
    expect(CONTENT_COLUMN_CONSUMER_SURFACES).toContain(
      HOME_ARTICLE_CONTENT_COLUMN_SURFACE,
    );
    expect(HOME_ARTICLE_CONTENT_COLUMN_SURFACE).toBe("home-article-browse");
  });

  test("article width omits nested horizontal inset and negative-margin compensation", () => {
    expect(HOME_ARTICLE_CLASS).toBe("max-w-3xl");
    expect(HOME_ARTICLE_CLASS).not.toMatch(/\bpx-/);
    expect(HOME_ARTICLE_CLASS).not.toContain(CONTENT_COLUMN_INSET_CLASS);
    expect(usesNegativeMarginCompensation(HOME_ARTICLE_CLASS)).toBe(false);
  });

  test("body text and Browse share one left edge without list/card inset drift", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(
      <HomeArticle
        messages={messages}
        siteConfig={youAgentFactorySiteConfig}
      />,
    );

    expect(html).toContain(
      `data-content-column-surface="${HOME_ARTICLE_CONTENT_COLUMN_SURFACE}"`,
    );
    expect(html).toContain(HOME_ARTICLE_CLASS);
    expect(html).toContain('id="browse"');
    expect(html).toContain(`aria-label="${messages.home.browseSectionTitle}"`);

    // Browse (and features) lists zero prose padding-inline-start at the source.
    expect(html).toContain(bulletlessListClassName("mt-4"));
    expect(html).toContain("list-none");
    expect(html).toContain("ps-0");
    expect(html).not.toContain("list-disc");
    expect(html).not.toMatch(/(?:^|[\s"'])-m[trblxy]?-/);

    // Article itself must not add a second horizontal inset under DocsPage.
    expect(html).not.toMatch(/<article[^>]*\bpx-/);
    expect(usesNegativeMarginCompensation(HOME_ARTICLE_CLASS)).toBe(false);
  });

  test("Browse card links stay keyboard-focusable and visually distinct", async () => {
    const messages = await loadUiMessages();
    const html = renderToStaticMarkup(
      <HomeArticle
        messages={messages}
        siteConfig={youAgentFactorySiteConfig}
      />,
    );

    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("rounded-lg border border-border");
    expect(html).toContain('href="/docs/guides"');
    expect(html).toContain('href="/browse"');
  });
});
