/**
 * Page-owned render proof for documentation/install (PS-200 stub).
 * Asserts thin compatibility behavior: points at Getting Started and does not
 * re-teach OS scripts + Claude init as the primary page job.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

const INSTALL_SH =
  "curl -fsSL https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh | sh";
const INSTALL_PS1 =
  "irm https://github.com/portpowered/you-agent-factory/releases/latest/download/install.ps1 | iex";
const CLAUDE_INIT = "you init --executor claude";

describe("install documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders Getting Started stub without OS+Claude install teaching", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "install",
    });

    expect(loadedPage.messages.title).toBe("Install you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/Getting Started/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.openingSummary).toMatch(/Getting Started/i);
    expect(Object.keys(loadedPage.messages.sections ?? {}).sort()).toEqual([
      "installPath",
    ]);
    expect(Object.keys(loadedPage.messages.links ?? {}).sort()).toEqual([
      "gettingStarted",
    ]);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.links?.macosLinuxLabel).toBeUndefined();
    expect(loadedPage.messages.links?.claudeInitLabel).toBeUndefined();
    expect(loadedPage.messages.callouts).toBeUndefined();

    const installPath = String(
      loadedPage.messages.sections?.installPath?.body ?? "",
    );
    expect(installPath).toMatch(/Getting Started/i);
    expect(installPath).toMatch(/install path/i);
    expect(installPath).not.toMatch(/This page|on this page|reader.?shortcut/i);
    expect(installPath).not.toMatch(/install\.sh|install\.ps1|--executor/i);

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
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(document.getElementById("how-to-use")).toBeNull();
    expect(document.getElementById("install-path")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Install path" })).toBeTruthy();
    expect(screen.queryByText(INSTALL_SH)).toBeNull();
    expect(screen.queryByText(INSTALL_PS1)).toBeNull();
    expect(screen.queryByText(CLAUDE_INIT)).toBeNull();

    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(screen.queryByRole("link", { name: "CLI docs" })).toBeNull();
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "you-agent-factory のインストール",
      installPathHeading: "インストールの経路",
      proseNeedle: /はじめに/,
      gettingStartedLabel: "はじめに",
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "安装 you-agent-factory",
      installPathHeading: "安装路径",
      proseNeedle: /快速开始/,
      gettingStartedLabel: "快速开始",
    },
    {
      locale: "vi" as SiteLocale,
      title: "Cài đặt you-agent-factory",
      installPathHeading: "Đường dẫn cài đặt",
      proseNeedle: /Bắt đầu/,
      gettingStartedLabel: "Bắt đầu",
    },
  ])("renders $locale install stub with target-language prose and Getting Started link", async ({
    locale,
    title,
    installPathHeading,
    proseNeedle,
    gettingStartedLabel,
  }) => {
    const en = await loadLocalDocsPage({
      section: "documentation",
      slug: "install",
    });
    const localized = await loadLocalDocsPage(
      { section: "documentation", slug: "install" },
      locale,
    );

    expect(localized.messages.title).toBe(title);
    expect(localized.messages.title).not.toBe(en.messages.title);
    expect(localized.messages.description).not.toBe(en.messages.description);
    expect(localized.messages.description).toContain("you-agent-factory");
    expect(
      String(localized.messages.sections?.installPath?.body ?? ""),
    ).toMatch(proseNeedle);
    expect(localized.messages.sections?.howToUse).toBeUndefined();
    expect(Object.keys(localized.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(localized.messages.sections ?? {}).sort()).toEqual(
      Object.keys(en.messages.sections ?? {}).sort(),
    );
    expect(Object.keys(localized.messages.links ?? {}).sort()).toEqual(
      Object.keys(en.messages.links ?? {}).sort(),
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

    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.getByRole("heading", { name: installPathHeading }),
    ).toBeTruthy();
    expect(screen.queryByText(INSTALL_SH)).toBeNull();
    expect(screen.queryByText(INSTALL_PS1)).toBeNull();
    expect(screen.queryByText(CLAUDE_INIT)).toBeNull();
    const gettingStarted = screen.getByRole("link", {
      name: gettingStartedLabel,
    });
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
