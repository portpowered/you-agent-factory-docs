/**
 * Page-owned render proof for documentation/mcp.
 * Covers documentation shell, MCP identity, how-to-integrate steps,
 * serve modes, Factory Session tool overview, key concepts / limits,
 * and sibling discovery links.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

// Cold MDX compile + full-page render can exceed Bun's 5s default under load.
const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("mcp documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/mcp as a documentation page",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "mcp"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/mcp");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "mcp",
      });

      expect(loadedPage.messages.title).toBe("MCP");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(
        /Model Context Protocol|MCP|you mcp serve/i,
      );
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      expect(whatItCovers).toMatch(/Model Context Protocol \(MCP\)/);
      expect(keyConcepts).toMatch(/Model Context Protocol \(MCP\)/);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

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
        screen.getByRole("heading", { name: "How To Integrate" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Serve Modes" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Factory Session Tools" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

      const whatItCoversSection = document.getElementById("what-it-covers");
      const keyConceptsSection = document.getElementById("key-concepts");
      expect(whatItCoversSection).toBeTruthy();
      expect(keyConceptsSection).toBeTruthy();
      expect(whatItCoversSection?.textContent).toMatch(
        /Model Context Protocol \(MCP\)/,
      );
      expect(keyConceptsSection?.textContent).toMatch(/you mcp serve/);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "shows how-to-integrate serve command and host JSON",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "mcp",
      });

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

      const integrateSection = document.getElementById("how-to-integrate");
      expect(integrateSection).toBeTruthy();
      expect(integrateSection?.textContent).toMatch(/you mcp serve/);
      expect(integrateSection?.textContent).toMatch(/stdio/i);
      expect(integrateSection?.textContent).toMatch(/stdin/i);
      expect(integrateSection?.textContent).toMatch(/stdout/i);
      expect(integrateSection?.textContent).toMatch(/stderr/i);
      expect(integrateSection?.textContent).toMatch(/restart|reload/i);

      const codeBlocks = integrateSection?.querySelectorAll("pre, code") ?? [];
      const codeText = Array.from(codeBlocks)
        .map((node) => node.textContent ?? "")
        .join("\n");
      expect(codeText).toMatch(/you mcp serve/);
      expect(codeText).toMatch(/"mcpServers"/);
      expect(codeText).toMatch(/"args"\s*:\s*\[\s*"mcp"\s*,\s*"serve"\s*\]/);
      expect(codeText).toMatch(/"cwd"/);
      expect(codeText).toMatch(/"command"/);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "shows serve-mode distinction and Factory Session tool overview",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "mcp",
      });

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

      const serveModesSection = document.getElementById("serve-modes");
      expect(serveModesSection).toBeTruthy();
      expect(serveModesSection?.textContent).toMatch(/fixture/i);
      expect(serveModesSection?.textContent).toMatch(/runtime/i);
      expect(serveModesSection?.textContent).toMatch(/you\.factory_session\./);
      expect(serveModesSection?.textContent).toMatch(/--runtime/);

      const serveModeCode = Array.from(
        serveModesSection?.querySelectorAll("pre, code") ?? [],
      )
        .map((node) => node.textContent ?? "")
        .join("\n");
      expect(serveModeCode).toMatch(
        /"args"\s*:\s*\[\s*"mcp"\s*,\s*"serve"\s*,\s*"--runtime"\s*\]/,
      );

      const toolsSection = document.getElementById("factory-session-tools");
      expect(toolsSection).toBeTruthy();
      expect(toolsSection?.textContent).toMatch(
        /you\.factory_session\.validate_source/,
      );
      expect(toolsSection?.textContent).toMatch(
        /you\.factory_session\.start_async/,
      );
      expect(toolsSection?.textContent).toMatch(/you\.factory_session\.get/);
      expect(toolsSection?.textContent).toMatch(
        /you\.factory_session\.get_result/,
      );
      expect(toolsSection?.textContent).toMatch(/list|control|event/i);
      expect(toolsSection?.textContent).toMatch(/you\.workflow\./);

      const toolCode = Array.from(
        toolsSection?.querySelectorAll("pre, code") ?? [],
      )
        .map((node) => node.textContent ?? "")
        .join("\n");
      expect(toolCode).toMatch(/you\.factory_session\.validate_source/);
      expect(toolCode).toMatch(/you\.factory_session\.start_async/);
      expect(toolCode).toMatch(/you\.factory_session\.get/);
      expect(toolCode).toMatch(/you\.factory_session\.get_result/);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "shows key concepts, limits, and sibling discovery links",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "mcp",
      });

      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );

      expect(keyConcepts).toMatch(/Model Context Protocol \(MCP\)/);
      expect(keyConcepts).toMatch(/Factory Session/);
      expect(keyConcepts).toMatch(/you mcp serve/);
      expect(keyConcepts).toMatch(/stdio/i);
      expect(keyConcepts).not.toMatch(/on this page|reader.?shortcut/i);

      expect(limits).toMatch(/MCP covers stdio serve/i);
      expect(limits).toMatch(/stdio/i);
      expect(limits).toMatch(/HTTP|SSE/i);
      expect(limits).toMatch(/multi-host/i);
      expect(limits).toMatch(/Cursor/i);
      expect(limits).toMatch(/dynamic-workflows/i);
      expect(limits).not.toMatch(/on this page|reader.?shortcut/i);

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

      const keyConceptsSection = document.getElementById("key-concepts");
      const limitsSection = document.getElementById("limits-and-assumptions");
      const relatedSection = document.getElementById("related");

      expect(keyConceptsSection?.textContent).toMatch(
        /Model Context Protocol \(MCP\)/,
      );
      expect(keyConceptsSection?.textContent).toMatch(/you mcp serve/);
      expect(keyConceptsSection?.textContent).toMatch(/stdio/i);
      expect(keyConceptsSection?.textContent).toMatch(/Factory Session/);

      expect(limitsSection?.textContent).toMatch(/MCP covers stdio serve/i);
      expect(limitsSection?.textContent).toMatch(/HTTP|SSE/i);
      expect(limitsSection?.textContent).toMatch(/Cursor/i);
      expect(limitsSection?.textContent).toMatch(/dynamic-workflows/i);

      expect(relatedSection).toBeTruthy();
      const relatedLinks = Array.from(
        relatedSection?.querySelectorAll("a[href]") ?? [],
      );
      const hrefs = relatedLinks.map((node) => node.getAttribute("href") ?? "");
      expect(hrefs).toContain("/docs/guides/cursor-dynamic-workflows");
      expect(hrefs).toContain("/docs/documentation/cli");
      expect(hrefs).toContain("/docs/concepts/tool");
      expect(relatedSection?.textContent).toMatch(/Cursor dynamic workflows/i);
      expect(relatedSection?.textContent).toMatch(/CLI docs/i);
      expect(relatedSection?.textContent).toMatch(/Tool concept/i);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
