/**
 * Page-owned render proof for references/mcp.
 * Covers reference shell and package-backed MCP inventory mount.
 * Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadMcpReferenceInventory } from "@/lib/references/load-mcp-reference-inventory";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("mcp reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/mcp as a package-backed MCP inventory page",
    async () => {
      const fumadocsPage = source.getPage(["references", "mcp"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/references/mcp");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "mcp",
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe("reference.mcp");
      expect(loadedPage.messages.title).toBe("MCP");
      expect(loadedPage.messages.description).toMatch(/package MCP contract/i);
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      expect(whatItCovers).toMatch(/package-backed MCP tool inventory/i);
      expect(keyConcepts).toMatch(/@you-agent-factory\/api\/mcp/i);
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

      const inventory = loadMcpReferenceInventory();
      expect(inventory.state).toBe("success");
      if (inventory.state !== "success") {
        return;
      }
      expect(inventory.tools.length).toBeGreaterThan(3);

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
        screen.getByRole("heading", { name: "Tool Inventory" }),
      ).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();

      const inventoryRoot = document.querySelector("[data-mcp-tool-inventory]");
      expect(inventoryRoot).toBeTruthy();
      expect(inventoryRoot?.getAttribute("data-inventory-state")).toBe(
        "success",
      );
      expect(
        Number(inventoryRoot?.getAttribute("data-mcp-tool-count") ?? "0"),
      ).toBe(inventory.tools.length);

      expect(
        screen.getByText(/published MCP tools from the package/i),
      ).toBeTruthy();
      expect(
        screen.getAllByText("you.factory_session.control").length,
      ).toBeGreaterThan(0);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
