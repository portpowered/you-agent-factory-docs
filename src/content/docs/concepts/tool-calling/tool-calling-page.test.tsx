/**
 * Page-owned render proof for concepts/tool-calling.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the tool-calling bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { source } from "@/lib/source";

describe("tool-calling concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/tool-calling as a model-inference concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "tool-calling"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/tool-calling");

    const indexes = await loadRegistry();
    const toolCallingRecord = getRegistryRecord(
      indexes,
      "concept.tool-calling",
    );
    expect(toolCallingRecord?.kind).toBe("concept");
    if (toolCallingRecord?.kind === "concept") {
      expect(toolCallingRecord.sidebarGrouping?.concepts).toBe(
        "model-inference",
      );
      expect(toolCallingRecord.aliases).toContain("tool use");
      expect(toolCallingRecord.aliases).toContain("function calling");
      expect(toolCallingRecord.aliases).toContain("agentTools");
      expect(toolCallingRecord.relatedIds).toContain("concept.thinking");
      expect(toolCallingRecord.relatedIds).toContain("concept.tokens");
      expect(toolCallingRecord.relatedIds).toContain("concept.tool");
      expect(toolCallingRecord.relatedIds).toContain("concept.mcp");
      expect(toolCallingRecord.relatedIds).toContain("documentation.workers");
    }

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "tool-calling",
    });

    expect(loadedPage.messages.title).toBe("Tool calling");
    expect(loadedPage.messages.description).toMatch(
      /model-inference behavior/i,
    );
    expect(loadedPage.messages.description).toMatch(/agentTools/i);
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
    expect(whatItIs).toMatch(/selecting and invoking named tools/i);
    expect(whatItIs).toMatch(/agentTools\.policy/i);
    expect(whatItIs).toMatch(/AGENT_WORKER/i);
    expect(whatItIs).toMatch(/not the tool definition itself/i);
    expect(whyItMatters).toMatch(/agentTools\.policy/i);
    expect(whyItMatters).toMatch(/stable diagnostics/i);
    expect(simpleExample).toMatch(/READ_ONLY/i);
    expect(simpleExample).toMatch(/read_file/i);
    expect(simpleExample).toMatch(/write_file/i);
    expect(commonConfusions).toMatch(
      /A tool is the named callable capability/i,
    );
    expect(commonConfusions).toMatch(/MCP is the host↔server protocol/i);
    expect(commonConfusions).toMatch(/Thinking is deliberative reasoning/i);
    expect(commonConfusions).toMatch(/not the full workers field reference/i);
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
      /selecting and invoking named tools/i,
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(/agentTools\.policy/i);
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /stable diagnostics/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(/read_file/i);
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /A tool is the named callable capability/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /Thinking is deliberative reasoning/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const thinkingLink = screen.getByRole("link", { name: "Thinking" });
    expect(thinkingLink.getAttribute("href")).toBe("/docs/concepts/thinking");
    const tokensLink = screen.getByRole("link", { name: "Tokens" });
    expect(tokensLink.getAttribute("href")).toBe("/docs/concepts/tokens");
    const toolLink = screen.getByRole("link", { name: "Tool" });
    expect(toolLink.getAttribute("href")).toBe("/docs/concepts/tool");
    const mcpLink = screen.getByRole("link", { name: "MCP" });
    expect(mcpLink.getAttribute("href")).toBe("/docs/concepts/mcp");
    const workersLink = screen.getByRole("link", { name: "Workers" });
    expect(workersLink.getAttribute("href")).toBe(
      "/docs/documentation/workers",
    );
    const harnessSupportLink = screen.getByRole("link", {
      name: "Harness support",
    });
    expect(harnessSupportLink.getAttribute("href")).toBe(
      "/docs/documentation/harness-support",
    );
    const mcpDocsLink = screen.getByRole("link", {
      name: "MCP documentation",
    });
    expect(mcpDocsLink.getAttribute("href")).toBe("/docs/documentation/mcp");
  });

  test("ships ja / zh-CN / vi message stubs with concept section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "tool-calling",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "tool-calling" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "tool-calling" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "tool-calling" },
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
    expect(ja.messages.links?.thinkingConcept).toBe("Thinking");
    expect(zhCN.messages.links?.toolConcept).toBe("Tool");
    expect(vi.messages.links?.workersDocs).toBe("Workers");

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
