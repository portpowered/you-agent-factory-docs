/**
 * Page-owned render proof for references/mcp.
 * Covers install-first lead, polished title/subtitle, package-backed
 * inventory mount, and representative trimmed tool-card chrome. Colocated
 * under the page bundle.
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
      expect(loadedPage.messages.title).toBe("MCP Reference");
      expect(loadedPage.messages.description).toMatch(
        /^Install MCP and look up/i,
      );
      expect(loadedPage.messages.description).toMatch(
        /without a live Factory host/i,
      );
      expect(loadedPage.messages.description).not.toMatch(
        /look up every published/i,
      );
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
      expect(loadedPage.messages.openingSummary).toMatch(/you mcp serve/i);
      expect(loadedPage.messages.openingSummary).toMatch(
        /without a live Factory host/i,
      );
      expect(loadedPage.messages.openingSummary).not.toMatch(
        /lists every published/i,
      );

      const howToInstall = String(
        loadedPage.messages.sections?.howToInstall?.body ?? "",
      );
      expect(howToInstall).toMatch(/you mcp serve/i);
      expect(howToInstall).toMatch(/MCP documentation/i);
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.related).toBeUndefined();
      expect(loadedPage.messages.sections?.tags).toBeUndefined();
      expect(loadedPage.messages.sections?.references).toBeUndefined();
      expect(loadedPage.messages.links).toBeUndefined();

      const inventory = loadMcpReferenceInventory();
      expect(inventory.state).toBe("success");
      if (inventory.state !== "success") {
        return;
      }
      expect(inventory.tools.length).toBeGreaterThan(3);

      const representativeTool =
        inventory.tools.find(
          (tool) =>
            tool.description !== undefined &&
            tool.inputSchema !== undefined &&
            tool.name.length > 0,
        ) ?? inventory.tools[0];
      expect(representativeTool).toBeDefined();

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
        screen.getByRole("heading", { name: "How to install MCP" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Tool Inventory" }),
      ).toBeTruthy();
      expect(
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();
      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();

      const installDocsLink = screen.getByRole("link", {
        name: "MCP documentation",
      });
      expect(installDocsLink.getAttribute("href")).toBe(
        "/docs/documentation/mcp",
      );
      expect(document.querySelector("code.language-bash")?.textContent).toMatch(
        /you mcp serve/,
      );
      expect(document.getElementById("how-to-install")).toBeTruthy();

      const inventoryRoot = document.querySelector("[data-mcp-tool-inventory]");
      expect(inventoryRoot).toBeTruthy();
      expect(inventoryRoot?.getAttribute("data-inventory-state")).toBe(
        "success",
      );
      expect(
        Number(inventoryRoot?.getAttribute("data-mcp-tool-count") ?? "0"),
      ).toBe(inventory.tools.length);
      expect(
        inventoryRoot?.querySelector("[data-reference-inventory-filter]"),
      ).toBeTruthy();

      expect(
        screen.getByText(/published MCP tools from the package/i),
      ).toBeTruthy();
      expect(
        screen.getAllByText("you.factory_session.control").length,
      ).toBeGreaterThan(0);

      const card = document.querySelector(
        `[data-mcp-tool-reference][data-mcp-tool-name="${representativeTool.name}"]`,
      );
      expect(card).toBeTruthy();
      expect(card?.getAttribute("id")).toBe(representativeTool.anchor);
      expect(
        screen.getByRole("heading", { name: representativeTool.name }),
      ).toBeTruthy();
      expect(
        card?.querySelector("[data-reference-copyable-anchor]"),
      ).toBeTruthy();
      if (representativeTool.description !== undefined) {
        expect(card?.textContent).toContain(representativeTool.description);
      }
      expect(card?.querySelector("[data-mcp-input-schema]")).toBeTruthy();
      expect(
        card?.querySelector("[data-schema-definition-embed]"),
      ).toBeTruthy();
      expect(card?.querySelector("[data-mcp-tool-example]")).toBeTruthy();

      // Trimmed card chrome: no family/package badge, duplicate identity rows,
      // Object policy, or generated-example apology notice.
      expect(document.querySelector("[data-contract-source-badge]")).toBeNull();
      expect(screen.queryByText("Handler registered")).toBeNull();
      expect(screen.queryByText("Tool id")).toBeNull();
      expect(screen.queryByText("Object policy")).toBeNull();
      expect(screen.queryByText(/additional properties/i)).toBeNull();
      expect(
        document.querySelector("[data-mcp-example-generated-notice]"),
      ).toBeNull();
      expect(
        screen.queryByText(/generated from the published tool input schema/i),
      ).toBeNull();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
