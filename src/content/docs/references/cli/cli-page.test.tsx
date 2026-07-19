/**
 * Page-owned render proof for references/cli.
 * Covers reference shell and package-backed CLI inventory mount.
 * Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
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
      expect(loadedPage.messages.description).toMatch(/package CLI contract/i);
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      expect(whatItCovers).toMatch(/package-backed CLI command inventory/i);
      expect(keyConcepts).toMatch(/@you-agent-factory\/api\/cli/i);
      expect(keyConcepts).toMatch(/not from a page-local copy/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.related).toBeUndefined();
      expect(loadedPage.messages.sections?.tags).toBeUndefined();
      expect(loadedPage.messages.sections?.references).toBeUndefined();
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

      expect(
        screen.getByRole("heading", { name: "What It Covers" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Key Concepts" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Command Inventory" }),
      ).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();

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

      expect(
        screen.getByText(/published CLI commands from the package/i),
      ).toBeTruthy();
      expect(screen.getAllByText("you config init").length).toBeGreaterThan(0);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
