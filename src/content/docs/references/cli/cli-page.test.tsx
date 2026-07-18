/**
 * Page-owned render proof for references/cli.
 * Covers reference shell, package-backed CLI inventory mount, and related
 * discovery links. Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
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
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      expect(whatItCovers).toMatch(/package-backed CLI command inventory/i);
      expect(keyConcepts).toMatch(/@you-agent-factory\/api\/cli/i);
      expect(keyConcepts).toMatch(/not from a page-local copy/i);
      expect(howToUse).toMatch(/durable package CLI lookup/i);
      expect(limits).toMatch(/static package-backed CLI inventory/i);
      expect(limits).toMatch(/does not invent structured flags/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

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
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

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

      const related = document.getElementById("related");
      expect(related).toBeTruthy();
      const relatedQueries = within(related as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "CLI documentation" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/cli");
      expect(
        relatedQueries
          .getByRole("link", { name: "CLI command index" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/cli-command-index");
      expect(
        relatedQueries
          .getByRole("link", { name: "MCP reference" })
          .getAttribute("href"),
      ).toBe("/docs/references/mcp");
      expect(
        relatedQueries
          .getByRole("link", {
            name: "JavaScript runtime reference",
          })
          .getAttribute("href"),
      ).toBe("/docs/references/javascript-runtime");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
