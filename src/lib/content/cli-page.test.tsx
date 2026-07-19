/**
 * Page-owned render proof for documentation/cli.
 * Covers newly shipped ja / zh-CN / vi prose beyond English stubs and keeps
 * install command literals + command matrix commands copyable.
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

describe("cli documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders install commands, command matrix, and core section headings", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "cli",
    });

    expect(loadedPage.messages.title).toBe("CLI");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.openingSummary).toMatch(
      /you-agent-factory CLI is the command-line entrypoint/i,
    );
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();

    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    expect(limits).toMatch(/CLI coverage here is install entrypoints/i);
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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(document.getElementById("how-to-use")).toBeNull();
    expect(screen.getByRole("heading", { name: "Install" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Commands" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();

    expect(screen.getByText(INSTALL_SH)).toBeTruthy();
    expect(screen.getByText(INSTALL_PS1)).toBeTruthy();
    expect(screen.getByText("you")).toBeTruthy();
    expect(screen.getByText("you submit")).toBeTruthy();
    expect(screen.getByText("you docs / you docs <topic>")).toBeTruthy();
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      installHeading: "インストール",
      commandsHeading: "コマンド",
      proseNeedle: /コマンドライン入口/,
      purposeHeader: "目的",
      youPurposeNeedle: /デフォルトのローカルファクトリー/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      installHeading: "安装",
      commandsHeading: "命令",
      proseNeedle: /命令行入口/,
      purposeHeader: "用途",
      youPurposeNeedle: /从当前项目启动默认本地工厂/,
    },
    {
      locale: "vi" as SiteLocale,
      installHeading: "Cài đặt",
      commandsHeading: "Lệnh",
      proseNeedle: /điểm vào dòng lệnh/,
      purposeHeader: "Mục đích",
      youPurposeNeedle: /Khởi động factory cục bộ mặc định/,
    },
  ])("renders $locale CLI with real target-language prose and copyable commands", async ({
    locale,
    installHeading,
    commandsHeading,
    proseNeedle,
    purposeHeader,
    youPurposeNeedle,
  }) => {
    const en = await loadLocalDocsPage({
      section: "documentation",
      slug: "cli",
    });
    const localized = await loadLocalDocsPage(
      { section: "documentation", slug: "cli" },
      locale,
    );

    expect(localized.messages.title).toBe("CLI");
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
    expect(localized.messages.links?.installMacosLinuxLabel).toBe(
      "macOS / Linux",
    );
    expect(localized.messages.links?.installWindowsLabel).toBe(
      "Windows (PowerShell)",
    );
    expect(localized.messages.links?.installMacosLinuxCommand).toBe(INSTALL_SH);
    expect(localized.messages.links?.installWindowsCommand).toBe(INSTALL_PS1);
    expect(localized.messages.links?.commandMatrixYouCommand).toBe("you");
    expect(localized.messages.links?.commandMatrixYouSubmitCommand).toBe(
      "you submit",
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

    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "使い方" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "如何使用" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Cách dùng" })).toBeNull();
    expect(screen.getByRole("heading", { name: installHeading })).toBeTruthy();
    expect(screen.getByRole("heading", { name: commandsHeading })).toBeTruthy();
    expect(screen.getByText(purposeHeader)).toBeTruthy();
    expect(screen.getByText(youPurposeNeedle)).toBeTruthy();
    expect(screen.getByText(INSTALL_SH)).toBeTruthy();
    expect(screen.getByText(INSTALL_PS1)).toBeTruthy();
    expect(screen.getByText("you")).toBeTruthy();
    expect(screen.getByText("you submit")).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toContain(
      "This reference covers the you-agent-factory CLI: how to install the you binary",
    );
  });
});
