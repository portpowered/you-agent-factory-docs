/**
 * Page-owned render proof for documentation/mcp.
 * Covers documentation shell, MCP identity, how-to-integrate steps,
 * serve modes, Factory Session tool overview, limits, and sibling discovery
 * links — without leftover What It Covers / Key Concepts intro chrome.
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
      expect(loadedPage.messages.openingSummary).toMatch(
        /you mcp serve over stdio/i,
      );
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

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
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();
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
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();
      expect(document.getElementById("references")).toBeNull();
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
    "shows limits without intro chrome",
    async () => {
      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "mcp",
      });

      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );

      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(howToUse).toMatch(/you mcp serve/);
      expect(howToUse).toMatch(/restart|reload/i);
      expect(howToUse).not.toMatch(/on this page|reader.?shortcut/i);

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

      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();

      const limitsSection = document.getElementById("limits-and-assumptions");
      const integrateSection = document.getElementById("how-to-integrate");

      expect(integrateSection?.textContent).toMatch(
        /Model Context Protocol|stdio|you mcp serve/i,
      );
      expect(limitsSection?.textContent).toMatch(/MCP covers stdio serve/i);
      expect(limitsSection?.textContent).toMatch(/HTTP|SSE/i);
      expect(limitsSection?.textContent).toMatch(/Cursor/i);
      expect(limitsSection?.textContent).toMatch(/dynamic-workflows/i);
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();
      expect(document.getElementById("references")).toBeNull();
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
