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

  test("renders purpose lead, limits, and next-step hrefs without intro chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "what-is-you-agent-factory",
    });

    expect(loadedPage.messages.title).toBe("What is you-agent-factory");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.openingSummary).toMatch(
      /command-line interface \(CLI\) and agent-factory workflow system/i,
    );
    expect(loadedPage.messages.openingSummary).toMatch(
      /long-running agent work/i,
    );
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();

    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    expect(limits).toMatch(/not Model Atlas/i);
    expect(limits).toMatch(/getting started|architecture of system/i);

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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(document.getElementById("how-to-use")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
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
      limitsHeading: "限界と前提",
      proseNeedle:
        /コマンドラインインターフェース（CLI）およびエージェントファクトリー/,
      gettingStartedLabel: "はじめに",
      architectureLabel: "システムのアーキテクチャ",
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "什么是 you-agent-factory",
      limitsHeading: "限制与假设",
      proseNeedle: /命令行界面（CLI）与代理工厂工作流系统/,
      gettingStartedLabel: "快速开始",
      architectureLabel: "系统架构",
    },
    {
      locale: "vi" as SiteLocale,
      title: "you-agent-factory là gì",
      limitsHeading: "Giới hạn và giả định",
      proseNeedle:
        /giao diện dòng lệnh \(CLI\) và hệ thống workflow agent-factory/,
      gettingStartedLabel: "Bắt đầu",
      architectureLabel: "Kiến trúc hệ thống",
    },
  ])("renders $locale what-is with real target-language prose", async ({
    locale,
    title,
    limitsHeading,
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
    expect(String(localized.messages.openingSummary ?? "")).toMatch(
      proseNeedle,
    );
    expect(localized.messages.sections?.whatItCovers).toBeUndefined();
    expect(localized.messages.sections?.keyConcepts).toBeUndefined();
    expect(localized.messages.sections?.howToUse).toBeUndefined();
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

    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(screen.getByRole("heading", { name: limitsHeading })).toBeTruthy();
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
