/**
 * Page-owned render proof for references/mcp.
 * Covers reference shell, package-backed MCP inventory mount, and related
 * discovery links. Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
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
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      expect(whatItCovers).toMatch(/package-backed MCP tool inventory/i);
      expect(keyConcepts).toMatch(/@you-agent-factory\/api\/mcp/i);
      expect(keyConcepts).toMatch(/not from a page-local copy/i);
      expect(howToUse).toMatch(/durable package MCP lookup/i);
      expect(limits).toMatch(/static package-backed MCP inventory/i);
      expect(limits).toMatch(/does not invent tool input fields/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

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
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

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

      const related = document.getElementById("related");
      expect(related).toBeTruthy();
      const relatedQueries = within(related as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "MCP documentation" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/mcp");
      expect(
        relatedQueries
          .getByRole("link", { name: "CLI reference" })
          .getAttribute("href"),
      ).toBe("/docs/references/cli");
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
