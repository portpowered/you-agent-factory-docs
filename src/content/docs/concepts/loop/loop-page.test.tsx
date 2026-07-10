/**
 * Page-owned render proof for concepts/loop.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the loop bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("loop concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/loop as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "loop"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/loop");

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "loop",
    });

    expect(loadedPage.messages.title).toBe("Loop");
    expect(loadedPage.messages.description).toContain("factory loop");
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
    expect(whatItIs).toMatch(/factory loop/i);
    expect(whatItIs).toMatch(/you-agent-factory/i);
    expect(whatItIs).toMatch(/iterating/i);
    expect(whatItIs).toMatch(/goal is done/i);
    expect(whatItIs).toMatch(/one-shot chat/i);
    expect(whyItMatters).toMatch(/persistent across agent passes/i);
    expect(whyItMatters).toMatch(/loop format/i);
    expect(whyItMatters).toMatch(/single submit/i);
    expect(simpleExample).toMatch(/named run/i);
    expect(simpleExample).toMatch(/same live run/i);
    expect(simpleExample).toMatch(/goal is done/i);
    expect(commonConfusions).toMatch(/one-shot chat/i);
    expect(commonConfusions).toMatch(/write-review loop/i);
    expect(commonConfusions).toMatch(/programming for or while loop/i);
    expect(commonConfusions).toMatch(/Cursor-driven dynamic workflows/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
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
    expect(screen.getAllByText(/factory loop/i).length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getByText(/persistent across agent passes/i)).toBeTruthy();
    expect(screen.getByText(/named run under you-agent-factory/i)).toBeTruthy();
    expect(screen.getByText(/not a write-review loop/i)).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const loopsGuideLink = screen.getByRole("link", {
      name: "Using you-agent-factory for loops",
    });
    expect(loopsGuideLink.getAttribute("href")).toBe(
      "/docs/guides/using-you-agent-factory-for-loops",
    );
    const writeReviewLink = screen.getByRole("link", {
      name: "Write-review loops",
    });
    expect(writeReviewLink.getAttribute("href")).toBe(
      "/docs/guides/write-review-loops",
    );
    const gettingStartedLink = screen.getByRole("link", {
      name: "Getting started",
    });
    expect(gettingStartedLink.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
  });

  test("ships ja / zh-CN / vi message stubs with the same key shape as English", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "loop",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "loop" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "loop" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "loop" },
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
    expect(ja.messages.links?.loopsGuide).toBe(
      "Using you-agent-factory for loops",
    );
    expect(zhCN.messages.links?.loopsGuide).toBe(
      "Using you-agent-factory for loops",
    );
    expect(vi.messages.links?.loopsGuide).toBe(
      "Using you-agent-factory for loops",
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
