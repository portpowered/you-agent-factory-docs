/**
 * Page-owned render proof for documentation/cli.
 *
 * Locks the command matrix against the installed `@you-agent-factory/api`
 * CLI contract: every row names a command group that exists in
 * `generated/cli/commands.json`, and no row names a retired or invented one.
 * Related / References footer chrome must stay absent (PF-L-strip).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import type { SiteLocale } from "@/lib/i18n/locale-routing";
import { loadCliReferenceInventory } from "@/lib/references/load-cli-reference-inventory";

/** Command groups the matrix advertises, as `you`-prefixed paths. */
const ADVERTISED_COMMAND_PATHS = [
  "you init",
  "you run",
  "you server",
  "you factory list",
  "you factory create",
  "you factory update",
  "you factory delete",
  "you factory config validate",
  "you factory config expand",
  "you factory config flatten",
  "you session list",
  "you session show",
  "you session create",
  "you session delete",
  "you session pause",
  "you session resume",
  "you session dispatches",
  "you submit",
  "you submit batch",
  "you work list",
  "you work show",
  "you work move",
  "you work visualize",
  "you workers list",
  "you workers acp add",
  "you workers acp delete",
  "you models list",
  "you models inspect",
  "you models pull",
  "you models invoke",
  "you mcp serve",
  "you serve acp",
  "you docs",
] as const;

/** Surfaces the 0.0.0-era page advertised that no longer exist. */
const RETIRED_SURFACES = [
  "you workflow status",
  "you logs",
  "you worker add",
  "you config validate",
  "--executor",
] as const;

function publishedCommandPaths(): Set<string> {
  const inventory = loadCliReferenceInventory();
  if (inventory.state !== "success") {
    throw new Error(
      `Expected a resolvable CLI contract, got "${inventory.state}".`,
    );
  }
  return new Set(inventory.commands.map((command) => command.commandPath));
}

describe("cli documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("every advertised command group exists in the installed CLI contract", () => {
    const published = publishedCommandPaths();
    const missing = ADVERTISED_COMMAND_PATHS.filter(
      (path) => !published.has(path),
    );
    expect(missing).toEqual([]);
  });

  test("renders the command matrix without retired surfaces or Related chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "cli",
    });

    expect(loadedPage.messages.title).toBe("CLI");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();

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
    expect(screen.getByRole("heading", { name: "Commands" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Selecting A Factory" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Global Flags" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const commands = document.getElementById("commands")?.textContent ?? "";
    expect(commands).toContain("you run");
    expect(commands).toContain("you submit batch");
    expect(commands).toContain("you mcp serve");
    expect(commands).toContain("you serve acp");

    const body = document.body.textContent ?? "";
    for (const retired of RETIRED_SURFACES) {
      expect(body).not.toContain(retired);
    }

    const cliReference = screen.getAllByRole("link", {
      name: /CLI Reference/i,
    });
    expect(cliReference.length).toBeGreaterThan(0);
    expect(cliReference[0]?.getAttribute("href")).toBe("/docs/references/cli");
  });

  test.each([
    {
      locale: "ja" as SiteLocale,
      installHeading: "インストール",
      commandsHeading: "コマンド",
      proseNeedle: /十数個のコマンドグループ/,
      purposeHeader: "用途",
    },
    {
      locale: "zh-CN" as SiteLocale,
      installHeading: "安装",
      commandsHeading: "命令",
      proseNeedle: /十来个命令组/,
      purposeHeader: "用途",
    },
    {
      locale: "vi" as SiteLocale,
      installHeading: "Cài đặt",
      commandsHeading: "Lệnh",
      proseNeedle: /hơn chục nhóm lệnh/,
      purposeHeader: "Mục đích",
    },
  ])("renders $locale CLI with target-language prose and identical command literals", async ({
    locale,
    installHeading,
    commandsHeading,
    proseNeedle,
    purposeHeader,
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
    expect(Object.keys(localized.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(localized.messages.links ?? {}).sort()).toEqual(
      Object.keys(en.messages.links ?? {}).sort(),
    );
    // Command literals are syntax, not prose: identical in every locale.
    for (const key of [
      "matrixInitCommand",
      "matrixRunCommand",
      "matrixSubmitCommand",
      "matrixMcpCommand",
      "matrixDocsCommand",
    ]) {
      expect(localized.messages.links?.[key]).toBe(
        en.messages.links?.[key] as string,
      );
    }

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
    expect(screen.getByRole("heading", { name: commandsHeading })).toBeTruthy();
    expect(screen.getByText(purposeHeader)).toBeTruthy();
    expect(screen.getByText("you mcp serve")).toBeTruthy();
    expect(screen.getByText("you serve acp")).toBeTruthy();

    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/Model Atlas/i);
    for (const retired of RETIRED_SURFACES) {
      expect(body).not.toContain(retired);
    }
  });
});
