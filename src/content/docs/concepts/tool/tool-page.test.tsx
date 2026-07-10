/**
 * Page-owned render proof for concepts/tool.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the tool bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("tool concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/tool as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "tool"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/tool");

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
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).toMatch(/inspect|validate|start|change/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).toMatch(/you\.factory_session\.validate_source/);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
    expect(commonConfusions).toMatch(/harness/i);
    expect(commonConfusions).toMatch(/worker/i);
    expect(commonConfusions).toMatch(/thinking/i);
    expect(commonConfusions).not.toMatch(/on this page|Model Atlas/i);

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
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const cursorLink = screen.getByRole("link", {
      name: "Cursor dynamic workflows",
    });
    expect(cursorLink.getAttribute("href")).toBe(
      "/docs/guides/cursor-dynamic-workflows",
    );
    expect(
      screen
        .getByRole("link", { name: "MCP documentation" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/mcp");
    expect(
      screen.getByRole("link", { name: "Harness" }).getAttribute("href"),
    ).toBe("/docs/concepts/harness");
    expect(
      screen.getByRole("link", { name: "Thinking" }).getAttribute("href"),
    ).toBe("/docs/concepts/thinking");
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
    expect(ja.messages.links?.cursorDynamicWorkflows).toBe(
      "Cursor dynamic workflows",
    );
    expect(zhCN.messages.links?.cursorDynamicWorkflows).toBe(
      "Cursor dynamic workflows",
    );
    expect(vi.messages.links?.cursorDynamicWorkflows).toBe(
      "Cursor dynamic workflows",
    );
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
