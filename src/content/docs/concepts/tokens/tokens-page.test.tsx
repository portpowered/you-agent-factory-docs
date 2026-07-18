/**
 * Page-owned render proof for concepts/tokens.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the tokens bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getRegistryRecord, loadRegistry } from "@/lib/content/registry";
import { resolveConceptsSidebarGroup } from "@/lib/content/sidebar-grouping";
import { source } from "@/lib/source";

describe("tokens concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/tokens as a model-inference concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "tokens"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/tokens");

    const indexes = await loadRegistry();
    const tokensRecord = getRegistryRecord(indexes, "concept.tokens");
    expect(tokensRecord?.kind).toBe("concept");
    if (tokensRecord?.kind === "concept") {
      expect(resolveConceptsSidebarGroup(tokensRecord)).toBe("model-inference");
      expect(tokensRecord.sidebarGrouping?.concepts).toBeUndefined();
      expect(tokensRecord.aliases).toContain("model-inference tokens");
      expect(tokensRecord.aliases).not.toContain("factory token");
      expect(tokensRecord.aliases).not.toContain("work token");
      expect(tokensRecord.relatedIds).toContain("concept.thinking");
      expect(tokensRecord.relatedIds).toContain("documentation.petri");
    }

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "tokens",
    });

    expect(loadedPage.messages.title).toBe("Tokens");
    expect(loadedPage.messages.description).toMatch(/model-inference tokens/i);
    expect(loadedPage.messages.description).not.toMatch(
      /Factory and work tokens/i,
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
    expect(whatItIs).toMatch(/model-inference token/i);
    expect(whatItIs).toMatch(/context and cost accounting/i);
    expect(whatItIs).toMatch(/harness|worker|inference/i);
    expect(whatItIs).toMatch(/not factory work tokens/i);
    expect(whatItIs).not.toMatch(/runtime unit that represents one submitted/i);
    expect(whyItMatters).toMatch(/context window|token spend|compaction/i);
    expect(whyItMatters).toMatch(/cost|latency|context pressure/i);
    expect(simpleExample).toMatch(/context window/i);
    expect(simpleExample).toMatch(/compaction/i);
    expect(simpleExample).toMatch(/model-inference tokens/i);
    expect(commonConfusions).toMatch(/not factory or work tokens/i);
    expect(commonConfusions).toMatch(/Petri|CPN|configuration|workstations/i);
    expect(commonConfusions).toMatch(/Design-system or UI tokens/i);
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
      /model-inference token/i,
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /not factory work tokens/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /context window|token spend|compaction/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(/context window/i);
    expect(simpleExampleSection?.textContent ?? "").toMatch(/compaction/i);
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /not factory or work tokens/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /Petri|CPN|configuration|workstations/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /Design-system or UI tokens/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);

    const thinkingLink = screen.getByRole("link", { name: "Thinking" });
    expect(thinkingLink.getAttribute("href")).toBe("/docs/concepts/thinking");
    const petriLink = screen.getByRole("link", { name: "Petri / CPN" });
    expect(petriLink.getAttribute("href")).toBe("/docs/documentation/petri");
    const configurationLink = screen.getByRole("link", {
      name: "Configuration",
    });
    expect(configurationLink.getAttribute("href")).toBe(
      "/docs/factories/configuration",
    );
    const workstationsLink = screen.getByRole("link", { name: "Workstations" });
    expect(workstationsLink.getAttribute("href")).toBe("/docs/workstations");
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
    expect(String(ja.messages.sections?.commonConfusions?.title ?? "")).toBe(
      "Common Confusions",
    );
    expect(ja.messages.links?.thinkingConcept).toBe("Thinking");
    expect(zhCN.messages.links?.petriDocs).toBe("Petri / CPN");
    expect(vi.messages.links?.configurationDocs).toBe("Configuration");

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
