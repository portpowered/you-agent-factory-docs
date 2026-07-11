/**
 * Page-owned render proof for guides/getting-started.
 * Covers localized ja / zh-CN / vi prose beyond English stubs and keeps
 * install/run command literals copyable in the MDX body.
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
const NAMED_RUN = "you run --named @goal/blah";

describe("getting-started guide page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders English quickstart identity, commands, and next-step hrefs", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "guides",
      slug: "getting-started",
    });

    expect(loadedPage.messages.title).toBe("Getting Started");
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
    expect(screen.getByRole("heading", { name: "Install" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "First You" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "First Submit" })).toBeTruthy();
    expect(screen.getByText(INSTALL_SH)).toBeTruthy();
    expect(screen.getByText(INSTALL_PS1)).toBeTruthy();
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText("you")).toBeTruthy();
    expect(screen.getByText("you session list")).toBeTruthy();
    expect(
      screen.getByText(
        "you submit --name my-first-work --work-type-name idea --payload ./payload.md",
      ),
    ).toBeTruthy();
    expect(screen.getByText("you submit batch ./batch.json")).toBeTruthy();

    const installDeepDive = screen.getByRole("link", {
      name: "Install deep-dive",
    });
    const cliDocs = screen.getByRole("link", { name: "CLI docs" });
    expect(installDeepDive.getAttribute("href")).toBe(
      "/docs/documentation/install",
    );
    expect(cliDocs.getAttribute("href")).toBe("/docs/documentation/cli");
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "はじめに",
      installHeading: "インストール",
      firstYouHeading: "最初の you",
      proseNeedle: /クイックスタート/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "快速开始",
      installHeading: "安装",
      firstYouHeading: "第一次运行 you",
      proseNeedle: /快速入门/,
    },
    {
      locale: "vi" as SiteLocale,
      title: "Bắt đầu",
      installHeading: "Cài đặt",
      firstYouHeading: "Lần you đầu tiên",
      proseNeedle: /Hướng dẫn nhanh/,
    },
  ])("renders $locale getting-started with real target-language prose and copyable commands", async ({
    locale,
    title,
    installHeading,
    firstYouHeading,
    proseNeedle,
  }) => {
    const en = await loadLocalDocsPage({
      section: "guides",
      slug: "getting-started",
    });
    const localized = await loadLocalDocsPage(
      { section: "guides", slug: "getting-started" },
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
    expect(localized.messages.links?.installMacosLinuxLabel).toBe(
      "macOS / Linux",
    );
    expect(localized.messages.links?.installWindowsLabel).toBe(
      "Windows (PowerShell)",
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

    expect(screen.getByRole("heading", { name: installHeading })).toBeTruthy();
    expect(screen.getByRole("heading", { name: firstYouHeading })).toBeTruthy();
    expect(screen.getByText(INSTALL_SH)).toBeTruthy();
    expect(screen.getByText(INSTALL_PS1)).toBeTruthy();
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText("you session list")).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toContain(
      "This quickstart walks install",
    );
  });
});
