/**
 * Page-owned render proof for documentation/install.
 *
 * Locks the canonical install teaching against the installed
 * `@you-agent-factory/api` CLI contract: both OS release commands, the
 * `you init --provider` provider step (never the retired `--executor` flag),
 * packaged-factory install, and forward links to Run Your First Factory plus
 * the CLI reference. Locale suites keep en / ja / zh-CN / vi key-shape parity
 * with target-language prose.
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
const INIT_PROVIDER = "you init --provider codex";
const INIT_PACKAGE = "you init --package @you/goal";

/** Retired 0.0.0-era surface that must not come back. */
const RETIRED_EXECUTOR_FLAG = /--executor/;

function assertCopyableInstallCommands(): void {
  const installSection = document.getElementById("install");
  expect(installSection).toBeTruthy();
  const install = within(installSection as HTMLElement);
  expect(install.getByText(INSTALL_SH)).toBeTruthy();
  expect(install.getByText(INSTALL_PS1)).toBeTruthy();
}

function assertProviderAndPackagedFactorySteps(): void {
  expect(screen.getByText("you -h")).toBeTruthy();
  expect(screen.getByText("you init")).toBeTruthy();
  expect(screen.getByText(INIT_PROVIDER)).toBeTruthy();
  expect(screen.getByText("you workers list")).toBeTruthy();
  expect(screen.getByText(INIT_PACKAGE)).toBeTruthy();
  expect(
    screen.getByText("you factory list --dir ~/.you-agent-factory/factories"),
  ).toBeTruthy();
  expect(document.body.textContent ?? "").not.toMatch(RETIRED_EXECUTOR_FLAG);
}

describe("install documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders canonical install teaching aligned with the CLI contract", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "install",
    });

    expect(loadedPage.messages.title).toBe("Install you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Getting Started/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(Object.keys(loadedPage.messages.sections ?? {}).sort()).toEqual([
      "chooseAProvider",
      "commonPitfalls",
      "confirmTheInstall",
      "install",
      "installAPackagedFactory",
      "nextSteps",
      "whereThingsLand",
    ]);
    expect(loadedPage.messages.links?.gettingStarted).toBeUndefined();

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

    expect(screen.getByRole("heading", { name: "Install" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Choose A Provider" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Install A Packaged Factory" }),
    ).toBeTruthy();

    assertCopyableInstallCommands();
    assertProviderAndPackagedFactorySteps();

    const runFirst = screen.getByRole("link", {
      name: "Run your first factory",
    });
    expect(runFirst.getAttribute("href")).toBe(
      "/docs/guides/run-your-first-factory",
    );
    const cliReference = screen.getByRole("link", {
      name: /CLI Reference/i,
    });
    expect(cliReference.getAttribute("href")).toBe("/docs/references/cli");
    const packagedReference = screen.getByRole("link", {
      name: /Packaged Factory Reference/i,
    });
    expect(packagedReference.getAttribute("href")).toBe(
      "/docs/references/packaged-factories-index",
    );
    expect(screen.queryByRole("link", { name: /getting started/i })).toBeNull();
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      title: "you-agent-factory のインストール",
      installHeading: "インストール",
      providerHeading: "プロバイダーを選ぶ",
      proseNeedle: /単一のバイナリ/,
    },
    {
      locale: "zh-CN" as SiteLocale,
      title: "安装 you-agent-factory",
      installHeading: "安装",
      providerHeading: "选择提供方",
      proseNeedle: /单个二进制文件/,
    },
    {
      locale: "vi" as SiteLocale,
      title: "Cài đặt you-agent-factory",
      installHeading: "Cài đặt",
      providerHeading: "Chọn nhà cung cấp",
      proseNeedle: /tệp nhị phân duy nhất/,
    },
  ])("renders $locale install page with target-language prose and copyable commands", async ({
    locale,
    title,
    installHeading,
    providerHeading,
    proseNeedle,
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
    expect(String(localized.messages.openingSummary ?? "")).toMatch(
      proseNeedle,
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
    expect(localized.messages.sections?.install?.body).not.toBe(
      en.messages.sections?.install?.body,
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
    expect(screen.getByRole("heading", { name: providerHeading })).toBeTruthy();
    assertCopyableInstallCommands();
    assertProviderAndPackagedFactorySteps();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
