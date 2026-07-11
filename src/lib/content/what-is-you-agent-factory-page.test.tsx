/**
 * Page-owned render proof for documentation/what-is-you-agent-factory.
 * Covers localized ja / zh-CN / vi prose beyond English stubs.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

describe("what-is-you-agent-factory documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders framing sections, product identity, and next-step hrefs", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "what-is-you-agent-factory",
    });

    expect(loadedPage.messages.title).toBe("What is you-agent-factory");
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

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();

    expect(
      screen.getByText(/software you install and run from a terminal/i),
    ).toBeTruthy();
    expect(screen.getByText(/persistent factory work/i)).toBeTruthy();
    expect(screen.getByText(/not Model Atlas/i)).toBeTruthy();

    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    const architecture = screen.getByRole("link", {
      name: "Architecture of system",
    });
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(architecture.getAttribute("href")).toBe(
      "/docs/documentation/architecture-of-system",
    );
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "you-agent-factory とは",
      howToUseHeading: "使い方",
      proseNeedle: /ターミナルからインストールして実行するソフトウェア/,
      gettingStartedLabel: "はじめに",
      architectureLabel: "システムのアーキテクチャ",
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "什么是 you-agent-factory",
      howToUseHeading: "如何使用",
      proseNeedle: /从终端安装并运行的软件/,
      gettingStartedLabel: "快速开始",
      architectureLabel: "系统架构",
    },
    {
      locale: "vi" as SiteLocale,
      title: "you-agent-factory là gì",
      howToUseHeading: "Cách dùng",
      proseNeedle: /phần mềm bạn cài đặt và chạy từ terminal/,
      gettingStartedLabel: "Bắt đầu",
      architectureLabel: "Kiến trúc hệ thống",
    },
  ])("renders $locale what-is with real target-language prose", async ({
    locale,
    title,
    howToUseHeading,
    proseNeedle,
    gettingStartedLabel,
    architectureLabel,
  }) => {
    const en = await loadLocalDocsPage({
      section: "documentation",
      slug: "what-is-you-agent-factory",
    });
    const localized = await loadLocalDocsPage(
      { section: "documentation", slug: "what-is-you-agent-factory" },
      locale,
    );

    expect(localized.messages.title).toBe(title);
    expect(localized.messages.title).not.toBe(en.messages.title);
    expect(localized.messages.description).not.toBe(en.messages.description);
    expect(localized.messages.openingSummary).not.toBe(
      en.messages.openingSummary,
    );
    expect(localized.messages.description).toContain("you-agent-factory");
    expect(
      String(localized.messages.sections?.whatItCovers?.body ?? ""),
    ).toMatch(proseNeedle);
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

    expect(screen.getByRole("heading", { name: howToUseHeading })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: gettingStartedLabel }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: architectureLabel })).toBeTruthy();
    expect(document.body.textContent ?? "").toMatch(/Model Atlas/);
    expect(document.body.textContent ?? "").not.toContain(
      "software you install and run from a terminal",
    );
  });
});
