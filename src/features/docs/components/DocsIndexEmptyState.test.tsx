import { describe, expect, test } from "bun:test";
import type { SharedProps } from "fumadocs-ui/contexts/search";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocsIndexEmptyState } from "@/features/docs/components/DocsIndexEmptyState";
import { loadUiMessages } from "@/lib/content/ui-messages";
import type { UiMessages } from "@/lib/content/ui-messages.types";

const ATLAS_PRODUCT_COPY =
  /Model Atlas|Browse the Atlas|the atlas|アトラス|Duyệt Atlas|浏览图谱|图谱|coming soon/i;

function renderEmptyState(
  messages: UiMessages,
  title: string,
  description: string,
  homeLinkLabel: string,
  options: {
    includeBlogLink?: boolean;
    locale?: "en" | "ja" | "vi" | "zh-CN";
  } = {},
) {
  const SearchDialog: ComponentType<SharedProps> = () => null;

  return renderToStaticMarkup(
    <RootProvider search={{ SearchDialog, enabled: true }}>
      <DocsIndexEmptyState
        title={title}
        description={description}
        homeLinkLabel={homeLinkLabel}
        messages={messages}
        locale={options.locale}
        includeBlogLink={options.includeBlogLink}
      />
    </RootProvider>,
  );
}

describe("DocsIndexEmptyState", () => {
  test("renders factory recovery links for home, browse, and search", async () => {
    const messages = await loadUiMessages();
    const html = renderEmptyState(
      messages,
      "No entries yet",
      "Try search or return home.",
      "Back to home",
    );

    expect(html).toContain("<output");
    expect(html).toContain("No entries yet");
    expect(html).toContain("Try search or return home.");
    expect(html).toContain('href="/"');
    expect(html).toContain("Back to home");
    expect(html).toContain('href="/browse"');
    expect(html).toContain(messages.browseIndex.title);
    expect(html).toContain("data-search");
    expect(html).toContain(messages.search.open);
    expect(html).toContain("focus-visible:ring-2");
    expect(html).not.toContain('href="/blog"');
    expect(html).not.toMatch(ATLAS_PRODUCT_COPY);
  });

  test("includes blog recovery when includeBlogLink is set", async () => {
    const messages = await loadUiMessages();
    const html = renderEmptyState(
      messages,
      messages.conceptsIndex.emptyTitle,
      messages.conceptsIndex.emptyDescription,
      messages.conceptsIndex.emptyHomeLink,
      { includeBlogLink: true },
    );

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/browse"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain(messages.nav.blog);
    expect(html).toContain("data-search");
    expect(html).not.toMatch(ATLAS_PRODUCT_COPY);
  });

  test("keeps shipped index empty-state message fields Atlas-free across locales", async () => {
    const indexKeys = [
      "conceptsIndex",
      "guidesIndex",
      "techniquesIndex",
      "documentationIndex",
      "architectureIndex",
      "blogIndex",
    ] as const;

    for (const locale of ["en", "ja", "vi", "zh-CN"] as const) {
      const messages = await loadUiMessages(locale);
      for (const key of indexKeys) {
        const index = messages[key];
        expect(index.emptyTitle).not.toMatch(ATLAS_PRODUCT_COPY);
        expect(index.emptyDescription).not.toMatch(ATLAS_PRODUCT_COPY);
        expect(index.emptyHomeLink).not.toMatch(ATLAS_PRODUCT_COPY);
      }
    }
  });
});
