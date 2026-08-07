/**
 * Page-owned render proof for references/cli.
 * Covers the inventory-first shell (no What It Covers / Key Concepts / opening
 * summary, and no restated section preamble), the package-backed inventory
 * mount, family grouping, the published flags/arguments tables, and the
 * command-level right-rail table of contents.
 * Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { groupCliCommands } from "@/lib/references/cli-command-groups";
import { loadCliReferenceInventory } from "@/lib/references/load-cli-reference-inventory";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("cli reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/cli as a package-backed CLI inventory page",
    async () => {
      const fumadocsPage = source.getPage(["references", "cli"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/references/cli");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "cli",
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe("reference.cli");
      expect(loadedPage.messages.title).toBe("CLI");
      expect(loadedPage.messages.description).toMatch(/arguments, flags/i);
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
      // The page description is a one-liner, not a paragraph about docs routes.
      expect(loadedPage.messages.description.length).toBeLessThan(120);
      expect(loadedPage.messages.description).not.toMatch(
        /stable static docs route/i,
      );
      expect(String(loadedPage.messages.openingSummary ?? "").trim()).toBe("");
      expect(loadedPage.messages.sections).toBeUndefined();
      expect(loadedPage.messages.links).toBeUndefined();

      const inventory = loadCliReferenceInventory();
      expect(inventory.state).toBe("success");
      if (inventory.state !== "success") {
        return;
      }
      expect(inventory.commands.length).toBeGreaterThan(5);

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

      // The verbose "scan the published CLI commands below…" preamble is gone.
      expect(
        screen.queryByRole("heading", { name: "Command Inventory" }),
      ).toBeNull();
      expect(document.getElementById("command-inventory")).toBeNull();
      expect(screen.queryByText(/Scan the published CLI commands/i)).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByTestId("folded-summary")).toBeNull();
      expect(
        document.querySelector('[data-opening-summary="folded"]'),
      ).toBeNull();

      const inventoryRoot = document.querySelector(
        "[data-cli-command-inventory]",
      );
      expect(inventoryRoot).toBeTruthy();
      expect(inventoryRoot?.getAttribute("data-inventory-state")).toBe(
        "success",
      );
      expect(
        Number(inventoryRoot?.getAttribute("data-cli-command-count") ?? "0"),
      ).toBe(inventory.commands.length);

      // Every published command lands in exactly one rendered family group.
      const renderedGroups = [
        ...document.querySelectorAll("[data-cli-command-group]"),
      ].map((group) => group.getAttribute("data-cli-command-group"));
      expect(renderedGroups).toEqual(
        groupCliCommands(inventory.commands).map((group) => group.path),
      );
      expect(renderedGroups).toContain("you factory");
      expect(
        document.querySelectorAll("[data-cli-command-reference]").length,
      ).toBe(inventory.commands.length);
      expect(
        screen.getByRole("heading", { level: 2, name: "you factory" }),
      ).toBeTruthy();

      // `you run` is the richest published surface: arguments plus 17 flags.
      const runCard = document.querySelector(
        "[data-cli-command-reference]#you-run",
      );
      expect(runCard).toBeTruthy();
      if (!(runCard instanceof HTMLElement)) {
        return;
      }
      const card = within(runCard);
      expect(card.getByRole("heading", { name: "you run" })).toBeTruthy();
      expect(
        runCard.querySelector("[data-reference-copyable-anchor]"),
      ).toBeTruthy();
      expect(runCard.querySelector("[data-cli-flags]")).toBeTruthy();
      expect(runCard.querySelector('[data-cli-flag="named"]')).toBeTruthy();
      expect(runCard.querySelector('[data-cli-flag="output"]')).toBeTruthy();
      expect(runCard.querySelector("[data-cli-arguments]")).toBeTruthy();
      expect(runCard.querySelector("[data-cli-example-code]")).toBeTruthy();

      // Inherited globals are pointed at once, not repeated as rows.
      expect(runCard.querySelector('[data-cli-flag="json"]')).toBeNull();
      expect(
        runCard.querySelector("[data-cli-inherited-flags]")?.textContent,
      ).toContain("--json");

      // The retired under-construction apology never comes back.
      expect(
        document.querySelector(
          '[data-cli-capability="structured-options-under-construction"]',
        ),
      ).toBeNull();
      expect(screen.queryByText(/Under construction/i)).toBeNull();
      expect(screen.queryByText(/Flags and arguments/i)).toBeNull();

      // Metadata chrome stays out of card bodies.
      expect(runCard.querySelector("[data-contract-source-badge]")).toBeNull();
      expect(card.queryByText("Leaf name")).toBeNull();
      expect(card.queryByText("Handler present")).toBeNull();

      expect(
        document.querySelector("[data-reference-inventory-filter]"),
      ).toBeTruthy();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "fills the right-rail table of contents with every published command",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "cli",
      });
      const inventory = loadCliReferenceInventory();
      expect(inventory.state).toBe("success");
      if (inventory.state !== "success") {
        return;
      }

      const groups = groupCliCommands(inventory.commands);
      expect(loadedPage.toc.length).toBe(
        groups.length + inventory.commands.length,
      );

      const urls = loadedPage.toc.map((entry) => entry.url);
      expect(urls).toContain("#commands-you-factory");
      expect(urls).toContain("#you-run");
      expect(new Set(urls).size).toBe(urls.length);

      const titles = loadedPage.toc.map((entry) => entry.title);
      expect(titles).toContain("you factory list");
      expect(titles).toContain("you workers acp add");

      // Groups sit one level above the commands they contain.
      const factoryGroup = loadedPage.toc.find(
        (entry) => entry.url === "#commands-you-factory",
      );
      const factoryList = loadedPage.toc.find(
        (entry) => entry.url === "#you-factory-list",
      );
      expect(factoryGroup?.depth).toBe(2);
      expect(factoryList?.depth).toBe(3);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
