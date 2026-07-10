/**
 * Page-owned render proof for concepts/compaction.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the compaction bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("compaction concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/compaction as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "compaction"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/compaction");

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "compaction",
    });

    expect(loadedPage.messages.title).toBe("Compaction");
    expect(loadedPage.messages.description).toContain(
      "shrinks retained context",
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
    expect(whatItIs).toMatch(/shrinking retained context/i);
    expect(whatItIs).toMatch(
      /conversation history|transcripts|stream windows/i,
    );
    expect(whatItIs).toMatch(/not the factory workflow system/i);
    expect(whatItIs).toMatch(/not deliberative thinking/i);
    expect(whyItMatters).toMatch(/context (window|limits)/i);
    expect(whyItMatters).toMatch(/long-running factory agent/i);
    expect(simpleExample).toMatch(/looped coding/i);
    expect(simpleExample).toMatch(/truncat|coalesc|age-evict/i);
    expect(simpleExample).toMatch(/compaction records/i);
    expect(commonConfusions).toMatch(/not thinking/i);
    expect(commonConfusions).toMatch(/not tokens/i);
    expect(commonConfusions).toMatch(/not deleting or closing/i);
    expect(commonConfusions).toMatch(/summarize-this-chat/i);
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

    // Prose auto-linking wraps glossary terms in anchors, so prefer section
    // textContent fragments over contiguous getByText sentence matches.
    const whatItIsSection = document.getElementById("what-it-is");
    const whyItMattersSection = document.getElementById("why-it-matters");
    const simpleExampleSection = document.getElementById("simple-example");
    const commonConfusionsSection =
      document.getElementById("common-confusions");
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /shrinking retained context/i,
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /not deliberative thinking/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /long-running factory agent/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(/looped coding/i);
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /compaction records/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(/not thinking/i);
    expect(commonConfusionsSection?.textContent ?? "").toMatch(/not tokens/i);
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const tokensLink = screen.getByRole("link", { name: "Tokens concept" });
    expect(tokensLink.getAttribute("href")).toBe("/docs/concepts/tokens");
    const thinkingLink = screen.getByRole("link", { name: "Thinking concept" });
    expect(thinkingLink.getAttribute("href")).toBe("/docs/concepts/thinking");
    const harnessLink = screen.getByRole("link", { name: "Harness concept" });
    expect(harnessLink.getAttribute("href")).toBe("/docs/concepts/harness");
    const loopLink = screen.getByRole("link", { name: "Loop concept" });
    expect(loopLink.getAttribute("href")).toBe("/docs/concepts/loop");
    const configurationLink = screen.getByRole("link", {
      name: "Configuration documentation",
    });
    expect(configurationLink.getAttribute("href")).toBe(
      "/docs/documentation/configuration",
    );
  });

  test("ships ja / zh-CN / vi message stubs with concept section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "compaction",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "compaction" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "compaction" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "compaction" },
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
    expect(ja.messages.links?.tokensConcept).toBe("Tokens concept");
    expect(zhCN.messages.links?.thinkingConcept).toBe("Thinking concept");
    expect(vi.messages.links?.configurationDocs).toBe(
      "Configuration documentation",
    );

    render(
      <main>
        <ModulePageProviders messages={ja.messages} assets={ja.assets}>
          {ja.content}
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
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
