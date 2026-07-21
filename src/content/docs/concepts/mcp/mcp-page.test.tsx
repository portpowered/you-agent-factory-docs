/**
 * Page-owned render proof for concepts/mcp.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the mcp bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { resolveConceptsSidebarGroup } from "@/lib/content/sidebar-grouping";
import { source } from "@/lib/source";

describe("mcp concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/mcp as a harnesses concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "mcp"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/mcp");

    const indexes = await loadRegistry();
    const mcpRecord = getRegistryRecord(indexes, "concept.mcp");
    expect(mcpRecord?.kind).toBe("concept");
    if (mcpRecord?.kind === "concept") {
      expect(resolveConceptsSidebarGroup(mcpRecord)).toBe("harnesses");
      expect(mcpRecord.sidebarGrouping?.concepts).toBeUndefined();
      expect(mcpRecord.aliases).toContain("Model Context Protocol");
      expect(mcpRecord.aliases).toContain("you mcp serve");
      expect(mcpRecord.aliases).toContain("MCP server");
      expect(mcpRecord.relatedIds).toContain("concept.harness");
      expect(mcpRecord.relatedIds).toContain("concept.tool");
      expect(mcpRecord.relatedIds).toContain("concept.skills");
      expect(mcpRecord.relatedIds).toContain("concept.tool-calling");
      expect(mcpRecord.relatedIds).toContain("documentation.mcp");
    }

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "mcp",
    });

    expect(loadedPage.messages.title).toBe("MCP");
    expect(loadedPage.messages.description).toMatch(/Model Context Protocol/i);
    expect(loadedPage.messages.description).toMatch(/you mcp serve/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    const simpleExample = String(
      loadedPage.messages.sections?.simpleExample?.body ?? "",
    );
    const commonConfusions = String(
      loadedPage.messages.sections?.commonConfusions?.body ?? "",
    );
    expect(whatItIs).toMatch(/Model Context Protocol \(MCP\)/i);
    expect(whatItIs).toMatch(/host↔server protocol/i);
    expect(whatItIs).toMatch(/you mcp serve/i);
    expect(whatItIs).toMatch(/Factory Session tools/i);
    expect(whatItIs).toMatch(/not the factory runtime itself/i);
    expect(whyItMatters).toMatch(/stdio MCP clients/i);
    expect(whyItMatters).toMatch(/you\.factory_session\.\*/i);
    expect(simpleExample).toMatch(/workflow project root/i);
    expect(simpleExample).toMatch(/you\.factory_session\.validate_source/i);
    expect(simpleExample).toMatch(/named actions it receives are tools/i);
    expect(commonConfusions).toMatch(/not the MCP program-documentation page/i);
    expect(commonConfusions).toMatch(/not a tool and not tool calling/i);
    expect(commonConfusions).toMatch(/not the factory runtime itself/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
    expect(commonConfusions).not.toMatch(/on this page|Model Atlas/i);

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

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Simple Example" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();

    // Prose auto-linking wraps glossary terms in anchors, so prefer section
    // textContent fragments over contiguous getByText sentence matches.
    const whatItIsSection = document.getElementById("what-it-is");
    const whyItMattersSection = document.getElementById("why-it-matters");
    const simpleExampleSection = document.getElementById("simple-example");
    const commonConfusionsSection =
      document.getElementById("common-confusions");
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /Model Context Protocol \(MCP\)/i,
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(/you mcp serve/i);
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /you\.factory_session\.\*/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /you\.factory_session\.validate_source/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /not the MCP program-documentation page/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /not a tool and not tool calling/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });

  test("ships ja / zh-CN / vi message stubs with concept section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "mcp",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "mcp" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "mcp" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "mcp" },
      "vi",
    );

    expect(Object.keys(ja.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(zhCN.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(Object.keys(vi.messages).sort()).toEqual(
      Object.keys(en.messages).sort(),
    );
    expect(String(ja.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
    expect(String(zhCN.messages.sections?.whyItMatters?.title ?? "")).toBe(
      "Why It Matters",
    );
    expect(String(vi.messages.sections?.simpleExample?.title ?? "")).toBe(
      "Simple Example",
    );
    expect(String(ja.messages.sections?.commonConfusions?.title ?? "")).toBe(
      "Common Confusions",
    );
    expect(ja.messages.links).toBeUndefined();
    expect(zhCN.messages.links).toBeUndefined();
    expect(vi.messages.links).toBeUndefined();

    render(
      <main>
        <DocsPageProviders messages={ja.messages} assets={ja.assets}>
          {ja.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Simple Example" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
