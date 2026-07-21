/**
 * Page-owned render proof for guides/write-review-loops.
 * Covers localized ja / zh-CN / vi prose beyond English stubs and keeps
 * session / run / submit command literals copyable in the MDX body.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

const SESSION_LIST = "you session list";
const YOU = "you";
const NAMED_RUN = "you run --named @goal/blah";
const SUBMIT =
  "you submit --name my-write-review-work --work-type-name task --payload ./payload.md";
const SUBMIT_BATCH = "you submit batch ./batch.json";

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

describe("write-review-loops guide page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders English write-review guide identity, commands, and teaching href without Related footer chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "guides",
      slug: "write-review-loops",
    });

    expect(loadedPage.messages.title).toBe("Write-Review Loops");
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
    expect(screen.getByText(SESSION_LIST)).toBeTruthy();
    expect(screen.getByText(YOU)).toBeTruthy();
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText(SUBMIT)).toBeTruthy();
    expect(screen.getByText(SUBMIT_BATCH)).toBeTruthy();

    const writerReviewer = screen.getByRole("link", {
      name: "Writer-reviewer technique",
    });
    expect(writerReviewer.getAttribute("href")).toBe(
      "/docs/techniques/writer-reviewer",
    );
    assertNoRelatedReferencesFooterChrome();
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "書き込み・レビューループ",
      whatItIsHeading: "概要",
      proseNeedle: /書き込み・レビューループは/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "写-审循环",
      whatItIsHeading: "是什么",
      proseNeedle: /写-审循环是一种工厂工作流/,
    },
    {
      locale: "vi" as SiteLocale,
      title: "Vòng lặp viết-duyệt",
      whatItIsHeading: "Nó là gì",
      proseNeedle: /Vòng lặp viết-duyệt là quy trình factory/,
    },
  ])("renders $locale write-review guide with real target-language prose and copyable commands", async ({
    locale,
    title,
    whatItIsHeading,
    proseNeedle,
  }) => {
    const en = await loadLocalDocsPage({
      section: "guides",
      slug: "write-review-loops",
    });
    const localized = await loadLocalDocsPage(
      { section: "guides", slug: "write-review-loops" },
      locale,
    );

    expect(localized.messages.title).toBe(title);
    expect(localized.messages.title).not.toBe(en.messages.title);
    expect(localized.messages.description).not.toBe(en.messages.description);
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
    expect(screen.getByText(SESSION_LIST)).toBeTruthy();
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText(SUBMIT)).toBeTruthy();
    expect(screen.getByText(SUBMIT_BATCH)).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toContain(
      "A write-review loop is a factory workflow",
    );
    assertNoRelatedReferencesFooterChrome();
  });
});
