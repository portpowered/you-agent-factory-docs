/**
 * Page-owned render proof for concepts/tokens.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the tokens bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("tokens concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/tokens as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "tokens"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/tokens");

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "tokens",
    });

    expect(loadedPage.messages.title).toBe("Tokens");
    expect(loadedPage.messages.description).toContain(
      "Factory and work tokens",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    const simpleExample = String(
      loadedPage.messages.sections?.simpleExample?.body ?? "",
    );
    const whereItAppears = String(
      loadedPage.messages.sections?.whereItAppears?.body ?? "",
    );
    const commonConfusions = String(
      loadedPage.messages.sections?.commonConfusions?.body ?? "",
    );
    expect(whatItIs).toMatch(/factory token/i);
    expect(whatItIs).toMatch(/work token/i);
    expect(whatItIs).toMatch(/work-type state/i);
    expect(whatItIs).toMatch(/place/i);
    expect(whatItIs).toMatch(/not an LLM tokenizer piece/i);
    expect(whyItMatters).toMatch(/workstation is enabled/i);
    expect(whyItMatters).toMatch(/you work list/i);
    expect(whyItMatters).toMatch(/initial state/i);
    expect(simpleExample).toMatch(/task:init/i);
    expect(simpleExample).toMatch(/consumes that token/i);
    expect(simpleExample).toMatch(/accepted|continue|rejection|failure/i);
    expect(whereItAppears).toMatch(/factory\.json/i);
    expect(whereItAppears).toMatch(/Workstation inputs and outputs/i);
    expect(whereItAppears).toMatch(/you work list/i);
    expect(commonConfusions).toMatch(/LLM tokenizer|model-input tokens/i);
    expect(commonConfusions).toMatch(/Design-system or UI tokens/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
    expect(whereItAppears).not.toMatch(/on this page|Model Atlas/i);
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
      screen.getByRole("heading", { name: "Where It Appears" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();

    // Prose auto-linking wraps glossary terms in anchors, so prefer section
    // textContent fragments over contiguous getByText sentence matches.
    const whatItIsSection = document.getElementById("what-it-is");
    const whyItMattersSection = document.getElementById("why-it-matters");
    const simpleExampleSection = document.getElementById("simple-example");
    const whereItAppearsSection = document.getElementById("where-it-appears");
    const commonConfusionsSection =
      document.getElementById("common-confusions");
    expect(whatItIsSection?.textContent ?? "").toMatch(/factory token/i);
    expect(whatItIsSection?.textContent ?? "").toMatch(/work token/i);
    expect(whatItIsSection?.textContent ?? "").toMatch(/work-type state/i);
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /not an LLM tokenizer piece/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /workstation is enabled/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(/you work list/i);
    expect(simpleExampleSection?.textContent ?? "").toMatch(/task:init/i);
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /consumes that token/i,
    );
    expect(whereItAppearsSection?.textContent ?? "").toMatch(/factory\.json/i);
    expect(whereItAppearsSection?.textContent ?? "").toMatch(
      /Workstation inputs and outputs/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /LLM tokenizer|model-input tokens/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /Design-system or UI tokens/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const configurationLink = screen.getByRole("link", {
      name: "Configuration",
    });
    expect(configurationLink.getAttribute("href")).toBe(
      "/docs/documentation/configuration",
    );
    const workstationsLink = screen.getByRole("link", { name: "Workstations" });
    expect(workstationsLink.getAttribute("href")).toBe(
      "/docs/documentation/workstations",
    );
    const submittingWorkLink = screen.getByRole("link", {
      name: "Submitting work",
    });
    expect(submittingWorkLink.getAttribute("href")).toBe(
      "/docs/documentation/submitting-work",
    );
  });

  test("ships ja / zh-CN / vi message stubs with concept section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "concepts",
      slug: "tokens",
    });
    const ja = await loadLocalDocsPage(
      { section: "concepts", slug: "tokens" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "concepts", slug: "tokens" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "concepts", slug: "tokens" },
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
    expect(String(ja.messages.sections?.whereItAppears?.title ?? "")).toBe(
      "Where It Appears",
    );
    expect(ja.messages.links?.configurationDocs).toBe("Configuration");
    expect(zhCN.messages.links?.workstationsDocs).toBe("Workstations");
    expect(vi.messages.links?.submittingWorkDocs).toBe("Submitting work");

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
      screen.getByRole("heading", { name: "Where It Appears" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
