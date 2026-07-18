/**
 * Page-owned render proof for references/javascript-runtime.
 * Covers reference shell, package-backed JavaScript runtime inventory mount,
 * and related discovery links. Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadJavascriptRuntimeReferenceInventory } from "@/lib/references/load-javascript-runtime-reference-inventory";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("javascript-runtime reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/javascript-runtime as a package-backed JavaScript runtime inventory page",
    async () => {
      const fumadocsPage = source.getPage(["references", "javascript-runtime"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/references/javascript-runtime");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "javascript-runtime",
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe(
        "reference.javascript-runtime",
      );
      expect(loadedPage.messages.title).toBe("JavaScript Runtime");
      expect(loadedPage.messages.description).toMatch(
        /package JavaScript runtime contract/i,
      );
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
      expect(whatItCovers).toMatch(
        /package-backed JavaScript runtime inventory/i,
      );
      expect(keyConcepts).toMatch(
        /@you-agent-factory\/api\/javascript\/runtime/i,
      );
      expect(keyConcepts).toMatch(/not from a page-local copy/i);
      expect(howToUse).toMatch(/durable package JavaScript runtime lookup/i);
      expect(limits).toMatch(
        /static package-backed JavaScript runtime inventory/i,
      );
      expect(limits).toMatch(/does not invent symbol fields/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      const inventory = loadJavascriptRuntimeReferenceInventory();
      expect(inventory.state).toBe("success");
      if (inventory.state !== "success") {
        return;
      }
      expect(inventory.symbols.length).toBeGreaterThan(3);
      expect(inventory.sharedSchemas.length).toBeGreaterThan(0);

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
        screen.getByRole("heading", { name: "Runtime Inventory" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

      const inventoryRoot = document.querySelector(
        "[data-javascript-runtime-inventory]",
      );
      expect(inventoryRoot).toBeTruthy();
      expect(inventoryRoot?.getAttribute("data-inventory-state")).toBe(
        "success",
      );
      expect(
        Number(
          inventoryRoot?.getAttribute("data-javascript-symbol-count") ?? "0",
        ),
      ).toBe(inventory.symbols.length);
      expect(
        Number(
          inventoryRoot?.getAttribute("data-javascript-shared-schema-count") ??
            "0",
        ),
      ).toBe(inventory.sharedSchemas.length);

      expect(
        screen.getByText(
          /published JavaScript runtime items from the package contract/i,
        ),
      ).toBeTruthy();
      expect(screen.getAllByText("javascript.args").length).toBeGreaterThan(0);

      const related = document.getElementById("related");
      expect(related).toBeTruthy();
      const relatedQueries = within(related as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "Dynamic workflows documentation" })
          .getAttribute("href"),
      ).toBe("/docs/factories/dynamic-workflows");
      expect(
        relatedQueries
          .getByRole("link", { name: "CLI reference" })
          .getAttribute("href"),
      ).toBe("/docs/references/cli");
      expect(
        relatedQueries
          .getByRole("link", { name: "MCP reference" })
          .getAttribute("href"),
      ).toBe("/docs/references/mcp");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
