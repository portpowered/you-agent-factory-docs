/**
 * Page-owned render proof for concepts/tool.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the tool bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

describe("tool concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/tool as a distinct capability concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "tool"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/tool");

    const indexes = await loadRegistry();
    const toolRecord = getRegistryRecord(indexes, "concept.tool");
    expect(toolRecord?.kind).toBe("concept");
    if (toolRecord?.kind === "concept") {
      expect(toolRecord.relatedIds).toContain("concept.tool-calling");
      expect(toolRecord.relatedIds).toContain("concept.mcp");
      expect(toolRecord.relatedIds).toContain("concept.skills");
      expect(toolRecord.relatedIds).toContain("concept.harness");
      expect(toolRecord.relatedIds).toContain("documentation.mcp");
    }

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "tool",
    });

    expect(loadedPage.messages.title).toBe("Tool");
    expect(loadedPage.messages.description).toContain(
      "named callable capability",
    );
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
    expect(whatItIs).toMatch(/named callable capability/i);
    expect(whatItIs).toMatch(/Model Context Protocol \(MCP\)/i);
    expect(whatItIs).toMatch(/you\.factory_session\.validate_source/);
    expect(whatItIs).toMatch(
      /not the model-inference act of selecting and invoking/i,
    );
    expect(whatItIs).not.toMatch(/Calling a tool means/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).toMatch(/stable catalog/i);
    expect(whyItMatters).toMatch(/shared action vocabulary/i);
    expect(whyItMatters).not.toMatch(/agentTools\.policy/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).toMatch(/you\.factory_session\.validate_source/);
    expect(simpleExample).toMatch(/named capability/i);
    expect(simpleExample).toMatch(/tool calling/i);
    expect(simpleExample).not.toMatch(/agentTools\.policy/i);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
    expect(commonConfusions).toMatch(
      /Tool calling is the model-inference behavior/i,
    );
    expect(commonConfusions).toMatch(/MCP is the host↔server protocol/i);
    expect(commonConfusions).toMatch(
      /skill is a reusable instruction package/i,
    );
    expect(commonConfusions).toMatch(/harness is the agent runtime/i);
    expect(commonConfusions).toMatch(/Thinking is internal reasoning/i);
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
    expect(
      screen.getAllByText(/named callable capability/i).length,
    ).toBeGreaterThanOrEqual(1);

    const whatItIsSection = document.getElementById("what-it-is");
    const commonConfusionsSection =
      document.getElementById("common-confusions");
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /not the model-inference act of selecting and invoking/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /Tool calling is the model-inference behavior/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    expect(
      screen.getByRole("link", { name: "Tool calling" }).getAttribute("href"),
    ).toBe("/docs/concepts/tool-calling");
    expect(
      screen
        .getAllByRole("link", { name: "MCP" })
        .some((link) => link.getAttribute("href") === "/docs/concepts/mcp"),
    ).toBe(true);
    expect(
      screen.getByRole("link", { name: "Skills" }).getAttribute("href"),
    ).toBe("/docs/concepts/skills");
    expect(
      screen.getByRole("link", { name: "Harness" }).getAttribute("href"),
    ).toBe("/docs/concepts/harness");
    expect(
      screen
        .getByRole("link", { name: "MCP documentation" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/mcp");
    expect(
      screen
        .getByRole("link", { name: "Cursor dynamic workflows" })
        .getAttribute("href"),
    ).toBe("/docs/guides/cursor-dynamic-workflows");
  });

  test("ships ja / zh-CN / vi message stubs with the same key shape as English", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "tool",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "tool" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "tool" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "tool" },
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
    expect(ja.messages.links?.toolCallingConcept).toBe("Tool calling");
    expect(zhCN.messages.links?.mcpConcept).toBe("MCP");
    expect(vi.messages.links?.skillsConcept).toBe("Skills");
    expect(String(ja.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
    expect(String(zhCN.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
    expect(String(vi.messages.sections?.whatItIs?.title ?? "")).toBe(
      "What It Is",
    );
  });
});
