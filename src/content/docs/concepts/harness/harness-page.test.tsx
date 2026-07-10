/**
 * Page-owned render proof for concepts/harness.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the harness bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("harness concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/harness as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "harness"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/harness");

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "harness",
    });

    expect(loadedPage.messages.title).toBe("Harness");
    expect(loadedPage.messages.description).toContain(
      "agent runtime the factory drives",
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
    expect(whatItIs).toMatch(/agent runtime the factory drives/i);
    expect(whatItIs).toMatch(/coding agent/i);
    expect(whatItIs).toMatch(/command-line interface \(CLI\)/i);
    expect(whatItIs).toMatch(/not the factory itself/i);
    expect(whyItMatters).toMatch(/which agent runtime will run it/i);
    expect(whyItMatters).toMatch(/different harnesses/i);
    expect(simpleExample).toMatch(/named run/i);
    expect(simpleExample).toMatch(/Codex-backed or Cursor-backed/i);
    expect(simpleExample).toMatch(
      /That coding-agent environment is the harness/i,
    );
    expect(commonConfusions).toMatch(/not the factory/i);
    expect(commonConfusions).toMatch(/not a worker/i);
    expect(commonConfusions).toMatch(/runner or model provider/i);
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
    expect(whatItIsSection?.textContent ?? "").toMatch(/factory drives/i);
    expect(whatItIsSection?.textContent ?? "").toMatch(/coding agent/i);
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /command-line interface \(CLI\)/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /which agent runtime will run it/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /different harnesses/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /Codex-backed or Cursor-backed coding agent/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /coding-agent environment is the harness/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /is not the factory/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(/not a worker/i);
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /runner or model provider/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const whatIsLink = screen.getByRole("link", {
      name: "What is you-agent-factory",
    });
    expect(whatIsLink.getAttribute("href")).toBe(
      "/docs/documentation/what-is-you-agent-factory",
    );
    const loopLink = screen.getByRole("link", { name: "Loop concept" });
    expect(loopLink.getAttribute("href")).toBe("/docs/concepts/loop");
    const harnessSupportLink = screen.getByRole("link", {
      name: "Harness support",
    });
    expect(harnessSupportLink.getAttribute("href")).toBe(
      "/docs/documentation/harness-support",
    );
  });

  test("ships ja / zh-CN / vi message stubs with concept section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "harness",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "harness" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "harness" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "harness" },
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
    expect(ja.messages.links?.whatIsYouAgentFactory).toBe(
      "What is you-agent-factory",
    );
    expect(zhCN.messages.links?.loopConcept).toBe("Loop concept");
    expect(vi.messages.links?.harnessSupport).toBe("Harness support");

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
