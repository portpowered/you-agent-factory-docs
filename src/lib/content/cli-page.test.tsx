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

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    expect(whatItCovers).toMatch(
      /The you-agent-factory CLI installs the you binary/i,
    );
    expect(limits).toMatch(/CLI coverage here is install entrypoints/i);
    expect(whatItCovers).not.toMatch(
      /This reference covers|This page|on this page|reader.?shortcut/i,
    );
    expect(limits).not.toMatch(
      /This page|on this page|web .+ reference|reader.?shortcut/i,
    );
    expect(whatItCovers).not.toContain(
      "This reference covers the you-agent-factory CLI: how to install the you binary",
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
    expect(screen.getByRole("heading", { name: "Install" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
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
      howToUseHeading: "使い方",
      commandsHeading: "コマンド",
      proseNeedle: /このリファレンスは you-agent-factory CLI/,
      purposeHeader: "目的",
      youPurposeNeedle: /デフォルトのローカルファクトリー/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      howToUseHeading: "如何使用",
      commandsHeading: "命令",
      proseNeedle: /本参考说明涵盖 you-agent-factory CLI/,
      purposeHeader: "用途",
      youPurposeNeedle: /从当前项目启动默认本地工厂/,
    },
    {
      locale: "vi" as SiteLocale,
      howToUseHeading: "Cách dùng",
      commandsHeading: "Lệnh",
      proseNeedle: /Tài liệu tham chiếu này gồm CLI you-agent-factory/,
      purposeHeader: "Mục đích",
      youPurposeNeedle: /Khởi động factory cục bộ mặc định/,
    },
  ])("renders $locale CLI with real target-language prose and copyable commands", async ({
    locale,
    howToUseHeading,
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
    expect(
      String(localized.messages.sections?.whatItCovers?.body ?? ""),
    ).toMatch(proseNeedle);
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

    expect(screen.getByRole("heading", { name: howToUseHeading })).toBeTruthy();
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
