/**
 * Page-owned render proof for techniques/workqueue-executor.
 * Covers technique shell headings and workqueue-executor identity —
 * not routine derived bundle invariants (those stay on make validate-data).
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques declare-exception lane for this page.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("workqueue-executor technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders technique shell and workqueue-executor identity", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "workqueue-executor",
    });

    expect(loadedPage.messages.title).toBe("Workqueue Executor");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/workqueue-executor/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    // Optional queue-drain graph omitted: Atlas ConceptMap/ModuleGraph MDX is
    // retired and PageAsset only stubs graphs. Prose teaches waiting → consume
    // → remaining ready work without a decorative placeholder figure.
    expect(Object.keys(loadedPage.assets)).toEqual([]);

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
      screen.getByRole("heading", {
        name: "Compared To Nearby Techniques",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const whatItIs = document.getElementById("what-it-is");
    const whyItMatters = document.getElementById("why-it-matters");
    const howItWorks = document.getElementById("how-it-works");
    const compared = document.getElementById("compared-to-nearby-techniques");
    expect(whatItIs).toBeTruthy();
    expect(whyItMatters).toBeTruthy();
    expect(howItWorks).toBeTruthy();
    expect(compared).toBeTruthy();

    expect(whatItIs?.textContent).toMatch(/workqueue executor/i);
    expect(whatItIs?.textContent).toMatch(/technique pattern/i);
    expect(whatItIs?.textContent).toMatch(/task queue/i);
    expect(whatItIs?.textContent).toMatch(/executor workstation/i);
    expect(whatItIs?.textContent).toMatch(/workqueue-executor/i);
    expect(whatItIs?.textContent).not.toMatch(/on this page/i);
    expect(whatItIs?.textContent).not.toMatch(/page-meta/i);

    expect(whyItMatters?.textContent).toMatch(/queued work/i);
    expect(whyItMatters?.textContent).toMatch(/after submit/i);
    expect(whyItMatters?.textContent).toMatch(/executor workstation/i);
    expect(whyItMatters?.textContent).toMatch(
      /without treating the queue itself/i,
    );

    expect(howItWorks?.textContent).toMatch(/task-queue/i);
    expect(howItWorks?.textContent).toMatch(/executor workstation/i);
    expect(howItWorks?.textContent).toMatch(/waiting/i);
    expect(howItWorks?.textContent).toMatch(/consume/i);
    expect(howItWorks?.textContent).toMatch(/remaining ready work/i);
    expect(howItWorks?.textContent).toMatch(/ordering/i);
    expect(howItWorks?.textContent).toMatch(/concurrency/i);
    expect(howItWorks?.textContent).toMatch(/batching/i);

    expect(compared?.textContent).toMatch(/task queue/i);
    expect(compared?.textContent).toMatch(/backlog concept/i);
    expect(compared?.textContent).toMatch(/drain pattern/i);
    expect(compared?.textContent).toMatch(/planner-executor/i);
    expect(compared?.textContent).toMatch(/plan.*execute|planner role/i);
    expect(compared?.textContent).toMatch(/classify-execute/i);
    expect(compared?.textContent).toMatch(/classif/i);
    expect(compared?.textContent).toMatch(/ralph/i);
    expect(compared?.textContent).toMatch(/writer-reviewer/i);
    expect(compared?.textContent).toMatch(/worker-adviser/i);
    expect(compared?.textContent).not.toMatch(/on this page/i);
    expect(compared?.textContent).not.toMatch(/page-meta/i);

    // No decorative / broken placeholder graph figure on the page.
    expect(document.querySelector("[data-page-asset]")).toBeNull();
    expect(document.querySelector("[data-asset-type='graph']")).toBeNull();

    expect(whatItIs?.textContent?.trim().length).toBeGreaterThan(120);
    expect(whyItMatters?.textContent?.trim().length).toBeGreaterThan(120);
    expect(howItWorks?.textContent?.trim().length).toBeGreaterThan(120);
    expect(compared?.textContent?.trim().length).toBeGreaterThan(120);
  });
});
