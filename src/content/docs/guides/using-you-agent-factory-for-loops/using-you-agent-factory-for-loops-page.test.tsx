/**
 * Page-owned render proof for guides/using-you-agent-factory-for-loops.
 * Covers localized ja / zh-CN / vi prose beyond English stubs and keeps
 * named-run / session / submit command literals copyable in the MDX body.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

const NAMED_RUN = "you run --named @goal/blah";
const SESSION_LIST = "you session list";
const SUBMIT =
  "you submit --name loop-pass --work-type-name idea --payload ./payload.md";
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

describe("using-you-agent-factory-for-loops guide page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders English loop guide identity, commands, and teaching hrefs without Related footer chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "guides",
      slug: "using-you-agent-factory-for-loops",
    });

    expect(loadedPage.messages.title).toBe("Using you-agent-factory for Loops");
    expect(loadedPage.messages.description).toContain("factory loops");
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
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText(SESSION_LIST)).toBeTruthy();
    expect(screen.getByText(SUBMIT)).toBeTruthy();
    expect(screen.getByText(SUBMIT_BATCH)).toBeTruthy();

    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    const writeReview = screen.getByRole("link", {
      name: "Write-Review Loops",
    });
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(writeReview.getAttribute("href")).toBe(
      "/docs/guides/write-review-loops",
    );
    assertNoRelatedReferencesFooterChrome();
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "you-agent-factory でループを使う",
      whatItIsHeading: "概要",
      proseNeedle: /ファクトリーループとは/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "用 you-agent-factory 做循环",
      whatItIsHeading: "是什么",
      proseNeedle: /工厂循环是指/,
    },
    {
      locale: "vi" as SiteLocale,
      title: "Dùng you-agent-factory cho vòng lặp",
      whatItIsHeading: "Nó là gì",
      proseNeedle: /Vòng lặp factory là công việc/,
    },
  ])("renders $locale loops guide with real target-language prose and copyable commands", async ({
    locale,
    title,
    whatItIsHeading,
    proseNeedle,
  }) => {
    const en = await loadLocalDocsPage({
      section: "guides",
      slug: "using-you-agent-factory-for-loops",
    });
    const localized = await loadLocalDocsPage(
      { section: "guides", slug: "using-you-agent-factory-for-loops" },
      locale,
    );

    expect(localized.messages.title).toBe(title);
    expect(localized.messages.title).not.toBe(en.messages.title);
    expect(localized.messages.description).not.toBe(en.messages.description);
    expect(localized.messages.openingSummary).not.toBe(
      en.messages.openingSummary,
    );
    expect(String(localized.messages.openingSummary ?? "")).toContain(
      "you-agent-factory",
    );
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
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText(SESSION_LIST)).toBeTruthy();
    expect(screen.getByText(SUBMIT)).toBeTruthy();
    expect(screen.getByText(SUBMIT_BATCH)).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toContain(
      "A factory loop is work that keeps iterating",
    );
    assertNoRelatedReferencesFooterChrome();
  });
});
