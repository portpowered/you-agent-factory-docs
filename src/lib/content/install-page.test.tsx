/**
 * Page-owned render proof for documentation/install.
 * Covers localized ja / zh-CN / vi prose beyond English stubs and keeps
 * install command literals copyable in the MDX body.
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

  test("renders OS install commands, Claude init, Codex default, and next-step hrefs", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "install",
    });

    expect(loadedPage.messages.title).toBe("Install you-agent-factory");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    expect(whatItCovers).toMatch(
      /Install gets you-agent-factory onto a machine/i,
    );
    expect(limits).toMatch(/Install covers getting the CLI onto a machine/i);
    expect(whatItCovers).not.toMatch(
      /This page|on this page|Install is the reference for|reader.?shortcut/i,
    );
    expect(limits).not.toMatch(
      /This page|on this page|web .+ reference|reader.?shortcut/i,
    );

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

    expect(screen.getByText(INSTALL_SH)).toBeTruthy();
    expect(screen.getByText(INSTALL_PS1)).toBeTruthy();
    expect(screen.getByText(CLAUDE_INIT)).toBeTruthy();
    expect(
      screen.getByText(/omit it for the default Codex-backed scaffold/i),
    ).toBeTruthy();

    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    const cliDocs = screen.getByRole("link", {
      name: "CLI docs",
    });
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(cliDocs.getAttribute("href")).toBe("/docs/documentation/cli");
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "you-agent-factory のインストール",
      howToUseHeading: "使い方",
      proseNeedle: /インストールは、you-agent-factory/,
      gettingStartedLabel: "はじめに",
      cliDocsLabel: "CLI ドキュメント",
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "安装 you-agent-factory",
      howToUseHeading: "如何使用",
      proseNeedle: /安装是将 you-agent-factory/,
      gettingStartedLabel: "快速开始",
      cliDocsLabel: "CLI 文档",
    },
    {
      locale: "vi" as SiteLocale,
      title: "Cài đặt you-agent-factory",
      howToUseHeading: "Cách dùng",
      proseNeedle: /Cài đặt là tài liệu tham chiếu/,
      gettingStartedLabel: "Bắt đầu",
      cliDocsLabel: "Tài liệu CLI",
    },
  ])("renders $locale install with real target-language prose and copyable commands", async ({
    locale,
    title,
    howToUseHeading,
    proseNeedle,
    gettingStartedLabel,
    cliDocsLabel,
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
      String(localized.messages.sections?.whatItCovers?.body ?? ""),
    ).toMatch(proseNeedle);
    expect(localized.messages.links?.macosLinuxLabel).toBe("macOS / Linux");
    expect(localized.messages.links?.windowsLabel).toBe("Windows (PowerShell)");
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
    expect(screen.getByText(INSTALL_SH)).toBeTruthy();
    expect(screen.getByText(INSTALL_PS1)).toBeTruthy();
    expect(screen.getByText(CLAUDE_INIT)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: gettingStartedLabel }),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: cliDocsLabel })).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toContain(
      "Install is the reference for getting you-agent-factory onto a machine",
    );
  });
});
