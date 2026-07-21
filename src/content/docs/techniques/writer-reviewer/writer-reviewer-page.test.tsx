/**
 * Page-owned render proof for techniques/writer-reviewer.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the writer-reviewer bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("writer-reviewer technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/writer-reviewer as a docs technique page", async () => {
    const fumadocsPage = source.getPage(["techniques", "writer-reviewer"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/writer-reviewer");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "writer-reviewer",
    });

    expect(loadedPage.messages.title).toBe("Writer-Reviewer");
    expect(loadedPage.messages.description).toContain(
      "dual-role factory technique",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    const howItWorks = String(
      loadedPage.messages.sections?.howItWorks?.body ?? "",
    );
    const comparedToNearbyTechniques = String(
      loadedPage.messages.sections?.comparedToNearbyTechniques?.body ?? "",
    );
    expect(whatItIs).toMatch(/dual-role factory technique/i);
    expect(whatItIs).toMatch(/writer \(or executor\)/i);
    expect(whatItIs).toMatch(/accepts that candidate/i);
    expect(whatItIs).toMatch(/rejects it/i);
    expect(whyItMatters).toMatch(/revising until review accepts/i);
    expect(whyItMatters).toMatch(/Reject cycles stay intentional/i);
    expect(howItWorks).toMatch(/accept completes the goal/i);
    expect(howItWorks).toMatch(/loop breaker/i);
    expect(comparedToNearbyTechniques).toMatch(/write-review use-case guide/i);
    expect(comparedToNearbyTechniques).toMatch(/plain factory loop/i);
    expect(comparedToNearbyTechniques).toMatch(
      /Planner-executor and worker-adviser/i,
    );
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(howItWorks).not.toMatch(/on this page|Model Atlas/i);
    expect(comparedToNearbyTechniques).not.toMatch(/on this page|Model Atlas/i);

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
    expect(screen.getByRole("heading", { name: "How It Works" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Compared To Nearby Techniques" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const whatItIsSection = document.getElementById("what-it-is");
    const whyItMattersSection = document.getElementById("why-it-matters");
    const howItWorksSection = document.getElementById("how-it-works");
    const comparedSection = document.getElementById(
      "compared-to-nearby-techniques",
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /dual-role factory technique/i,
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /writer \(or executor\)/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /revising until review accepts/i,
    );
    expect(howItWorksSection?.textContent ?? "").toMatch(/loop breaker/i);
    expect(comparedSection?.textContent ?? "").toMatch(
      /write-review use-case guide/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.links).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();
  });

  test("ships ja / zh-CN / vi message stubs with technique section structure", async () => {
    const en = await loadLocalDocsPage({
      section: "techniques",
      slug: "writer-reviewer",
    });
    const ja = await loadLocalDocsPage(
      { section: "techniques", slug: "writer-reviewer" },
      "ja",
    );
    const zhCN = await loadLocalDocsPage(
      { section: "techniques", slug: "writer-reviewer" },
      "zh-CN",
    );
    const vi = await loadLocalDocsPage(
      { section: "techniques", slug: "writer-reviewer" },
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
    expect(String(vi.messages.sections?.howItWorks?.title ?? "")).toBe(
      "How It Works",
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
    expect(screen.getByRole("heading", { name: "How It Works" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Compared To Nearby Techniques" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
