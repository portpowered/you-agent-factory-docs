/**
 * Page-owned render proof for guides/getting-started (PS-200).
 * Locks the merged install teaching contract: both OS release commands,
 * confirm-you + scaffold/init guidance, and no primary Install deep-dive
 * teaching dependence. Locale suites keep en / ja / zh-CN / vi key-shape
 * parity with target-language install-merge prose.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import type { SiteLocale } from "@/lib/i18n/locale-routing";

const INSTALL_SH =
  "curl -fsSL https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh | sh";
const INSTALL_PS1 =
  "irm https://github.com/portpowered/you-agent-factory/releases/latest/download/install.ps1 | iex";
const CLAUDE_INIT = "you init --executor claude";
const NAMED_RUN = "you run --named @goal/blah";

function assertMergedInstallTeaching(): void {
  const installSection = document.getElementById("install");
  expect(installSection).toBeTruthy();
  const install = within(installSection as HTMLElement);
  expect(install.getByText(INSTALL_SH)).toBeTruthy();
  expect(install.getByText(INSTALL_PS1)).toBeTruthy();
  expect(install.getByText(CLAUDE_INIT)).toBeTruthy();
}

function assertNoPrimaryInstallDeepDive(): void {
  expect(screen.queryByRole("link", { name: /Install deep-dive/i })).toBeNull();
  expect(screen.queryByRole("link", { name: /^Install$/i })).toBeNull();

  const pitfalls = document.getElementById("common-pitfalls");
  expect(pitfalls).toBeTruthy();
  const pitfallsScope = within(pitfalls as HTMLElement);
  const cliDocs = pitfallsScope.getByRole("link", { name: /CLI docs|CLI/i });
  expect(cliDocs.getAttribute("href")).toMatch(/\/docs\/documentation\/cli$/);
  expect(
    pitfallsScope.queryByRole("link", {
      name: /Install|インストール|安装|Cài đặt/i,
    }),
  ).toBeNull();
  expect(pitfalls?.textContent ?? "").not.toContain(
    "/docs/documentation/install",
  );
}

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

describe("getting-started guide page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders English merged install teaching without Install deep-dive dependence", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "guides",
      slug: "getting-started",
    });

    expect(loadedPage.messages.title).toBe("Getting Started");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.callouts?.confirmYouAvailable?.body).toMatch(
      /confirm you is available/i,
    );
    expect(loadedPage.messages.callouts?.scaffoldChoice?.body).toMatch(
      /Omitting --executor/i,
    );
    expect(loadedPage.messages.links?.claudeInitLabel).toBeTruthy();
    expect(loadedPage.messages.links?.cliDocs).toBe("CLI docs");
    expect(loadedPage.messages.links?.installDeepDive).toBeUndefined();

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

    assertMergedInstallTeaching();
    expect(
      screen.getByText(
        /confirm you is available in your shell before you continue/i,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Omitting --executor keeps the default Codex-backed starter scaffold/i,
      ),
    ).toBeTruthy();
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText("you")).toBeTruthy();
    expect(screen.getByText("you session list")).toBeTruthy();
    expect(
      screen.getByText(
        "you submit --name my-first-work --work-type-name idea --payload ./payload.md",
      ),
    ).toBeTruthy();
    expect(screen.getByText("you submit batch ./batch.json")).toBeTruthy();

    assertNoPrimaryInstallDeepDive();
    assertNoRelatedReferencesFooterChrome();
    const cliDocs = screen.getByRole("link", { name: "CLI docs" });
    expect(cliDocs.getAttribute("href")).toBe("/docs/documentation/cli");
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "はじめに",
      installHeading: "インストール",
      firstYouHeading: "最初の you",
      proseNeedle: /クイックスタート/,
      confirmYouNeedle: /シェルで you が使えることを確認/,
      scaffoldNeedle: /--executor を省略すると/,
      cliDocsName: /CLI/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "快速开始",
      installHeading: "安装",
      firstYouHeading: "第一次运行 you",
      proseNeedle: /快速入门/,
      confirmYouNeedle: /确认 shell 中可以使用 you/,
      scaffoldNeedle: /省略 --executor 会保留默认的 Codex/,
      cliDocsName: /CLI/,
    },
    {
      locale: "vi" as SiteLocale,
      title: "Bắt đầu",
      installHeading: "Cài đặt",
      firstYouHeading: "Lần you đầu tiên",
      proseNeedle: /Hướng dẫn nhanh/,
      confirmYouNeedle: /xác nhận you có sẵn trong shell/,
      scaffoldNeedle: /Bỏ qua --executor giữ scaffold starter mặc định/,
      cliDocsName: /CLI/,
    },
  ])("renders $locale getting-started with real target-language prose and copyable commands", async ({
    locale,
    title,
    installHeading,
    firstYouHeading,
    proseNeedle,
    confirmYouNeedle,
    scaffoldNeedle,
    cliDocsName,
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
    expect(Object.keys(localized.messages.sections ?? {}).sort()).toEqual(
      Object.keys(en.messages.sections ?? {}).sort(),
    );
    expect(Object.keys(localized.messages.links ?? {}).sort()).toEqual(
      Object.keys(en.messages.links ?? {}).sort(),
    );
    expect(Object.keys(localized.messages.callouts ?? {}).sort()).toEqual(
      Object.keys(en.messages.callouts ?? {}).sort(),
    );
    expect(localized.messages.links?.installDeepDive).toBeUndefined();

    // Install-merge keys from PS-200 must stay target-language, not English leftovers.
    expect(localized.messages.sections?.install?.title).toBe(installHeading);
    expect(localized.messages.sections?.install?.body).not.toBe(
      en.messages.sections?.install?.body,
    );
    expect(localized.messages.callouts?.confirmYouAvailable?.body).not.toBe(
      en.messages.callouts?.confirmYouAvailable?.body,
    );
    expect(localized.messages.callouts?.scaffoldChoice?.body).not.toBe(
      en.messages.callouts?.scaffoldChoice?.body,
    );
    expect(localized.messages.links?.claudeInitLabel).not.toBe(
      en.messages.links?.claudeInitLabel,
    );
    expect(localized.messages.sections?.commonPitfalls?.body).not.toBe(
      en.messages.sections?.commonPitfalls?.body,
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
    assertMergedInstallTeaching();
    expect(screen.getByText(confirmYouNeedle)).toBeTruthy();
    expect(screen.getByText(scaffoldNeedle)).toBeTruthy();
    expect(screen.getByText(NAMED_RUN)).toBeTruthy();
    expect(screen.getByText("you session list")).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toContain(
      "This quickstart walks install",
    );
    expect(document.body.textContent ?? "").not.toContain(
      "After install, open a new terminal if needed",
    );
    expect(document.body.textContent ?? "").not.toContain(
      "Omitting --executor keeps the default Codex-backed starter scaffold",
    );

    assertNoPrimaryInstallDeepDive();
    assertNoRelatedReferencesFooterChrome();
    const pitfalls = document.getElementById("common-pitfalls");
    expect(
      within(pitfalls as HTMLElement).getByRole("link", { name: cliDocsName }),
    ).toBeTruthy();
  });
});
