/**
 * Page-owned render proof for guides/cursor-dynamic-workflows.
 * Covers localized ja / zh-CN / vi prose beyond English stubs and keeps
 * MCP tool-name literals copyable in the MDX body.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

const VALIDATE = "you.factory_session.validate_source";
const START_ASYNC = "you.factory_session.start_async";
const GET = "you.factory_session.get";
const GET_RESULT = "you.factory_session.get_result";

/** PF-L-strip: trailing Related / References / RelatedDocs footer chrome must stay gone. */
function assertNoRelatedReferencesFooterChrome(): void {
  expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "Related" })).toBeNull();
  expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
  expect(document.getElementById("related")).toBeNull();
  expect(document.getElementById("references")).toBeNull();
  expect(screen.queryByTestId("curated-related-docs")).toBeNull();
  expect(screen.queryByTestId("derived-related-docs")).toBeNull();
}

describe("cursor-dynamic-workflows guide page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders English Cursor guide identity, tool names, and teaching hrefs without Related footer chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "guides",
      slug: "cursor-dynamic-workflows",
    });

    expect(loadedPage.messages.title).toBe("Cursor Dynamic Workflows");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "When To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Steps Or Workflow" }),
    ).toBeTruthy();
    expect(screen.getByText(VALIDATE)).toBeTruthy();
    expect(screen.getByText(START_ASYNC)).toBeTruthy();
    // get + get_result share one multi-line code fence in page.mdx
    expect(document.body.textContent ?? "").toContain(GET);
    expect(document.body.textContent ?? "").toContain(GET_RESULT);

    const mcpDocs = screen.getByRole("link", { name: "MCP documentation" });
    const dynamicDocs = screen.getByRole("link", {
      name: "Dynamic-workflows documentation",
    });
    expect(mcpDocs.getAttribute("href")).toBe("/docs/documentation/mcp");
    expect(dynamicDocs.getAttribute("href")).toBe(
      "/docs/factories/dynamic-workflows",
    );
    assertNoRelatedReferencesFooterChrome();
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "Cursor 動的ワークフロー",
      whatItIsHeading: "概要",
      proseNeedle: /Cursor 動的ワークフローとは/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "Cursor 动态工作流",
      whatItIsHeading: "是什么",
      proseNeedle: /Cursor 动态工作流是指/,
    },
    {
      locale: "vi" as SiteLocale,
      title: "Quy trình động Cursor",
      whatItIsHeading: "Nó là gì",
      proseNeedle: /Quy trình động Cursor nghĩa là/,
    },
  ])("renders $locale Cursor guide with real target-language prose and copyable tool names", async ({
    locale,
    title,
    whatItIsHeading,
    proseNeedle,
  }) => {
    const en = await loadLocalDocsPage({
      section: "guides",
      slug: "cursor-dynamic-workflows",
    });
    const localized = await loadLocalDocsPage(
      { section: "guides", slug: "cursor-dynamic-workflows" },
      locale,
    );

    expect(localized.messages.title).toBe(title);
    expect(localized.messages.title).not.toBe(en.messages.title);
    expect(localized.messages.description).not.toBe(en.messages.description);
    expect(localized.messages.openingSummary).not.toBe(
      en.messages.openingSummary,
    );
    expect(localized.messages.description).toContain("you-agent-factory");
    expect(String(localized.messages.sections?.whatItIs?.body ?? "")).toMatch(
      proseNeedle,
    );
    expect(Object.keys(localized.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );

    render(
      <main>
        <DocsPageProviders
          messages={localized.messages}
          assets={localized.assets}
          locale={locale}
        >
          {localized.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: whatItIsHeading })).toBeTruthy();
    expect(screen.getByText(VALIDATE)).toBeTruthy();
    expect(screen.getByText(START_ASYNC)).toBeTruthy();
    expect(document.body.textContent ?? "").toContain(GET);
    expect(document.body.textContent ?? "").toContain(GET_RESULT);
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toContain(
      "Cursor dynamic workflows mean using Cursor as a Model Context Protocol",
    );
    assertNoRelatedReferencesFooterChrome();
  });
});
