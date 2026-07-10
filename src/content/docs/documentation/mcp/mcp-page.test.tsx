/**
 * Page-owned render proof for documentation/mcp.
 * Covers documentation shell, MCP identity, how-to-integrate steps,
 * serve modes, and Factory Session tool overview.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("mcp documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/mcp as a documentation page", async () => {
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
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </ModulePageProviders>
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
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
  });

  test("shows how-to-integrate serve command and host JSON", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "mcp",
    });

    render(
      <main>
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </ModulePageProviders>
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
  });

  test("shows serve-mode distinction and Factory Session tool overview", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "mcp",
    });

    render(
      <main>
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </ModulePageProviders>
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
  });
});
