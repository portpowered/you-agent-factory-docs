/**
 * Page-owned render proof for concepts/task-queue.
 * Covers concept shell headings and task-queue identity —
 * not routine derived bundle invariants (those stay on make validate-data).
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary concept lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("task-queue concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders concept shell and task-queue identity", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "task-queue",
    });

    expect(loadedPage.messages.title).toBe("Task Queue");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/task queue/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(/tokenizer/i);
    // Optional graph omitted: prose teaches submit → waiting place → consume.
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
    expect(
      screen.getByRole("heading", { name: "Simple Example" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Where It Appears" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Related Concepts And Modules",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItIs = document.getElementById("what-it-is");
    const whyItMatters = document.getElementById("why-it-matters");
    const simpleExample = document.getElementById("simple-example");
    const whereItAppears = document.getElementById("where-it-appears");
    const commonConfusions = document.getElementById("common-confusions");
    const related = document.getElementById("related");
    expect(whatItIs).toBeTruthy();
    expect(whyItMatters).toBeTruthy();
    expect(simpleExample).toBeTruthy();
    expect(whereItAppears).toBeTruthy();
    expect(commonConfusions).toBeTruthy();
    expect(related).toBeTruthy();

    expect(whatItIs?.textContent).toMatch(/task queue/i);
    expect(whatItIs?.textContent).toMatch(/backlog of submitted work/i);
    expect(whatItIs?.textContent).toMatch(/work-type state/i);
    expect(whatItIs?.textContent).toMatch(/workstation/i);

    expect(whyItMatters?.textContent).toMatch(/persistent/i);
    expect(whyItMatters?.textContent).toMatch(/parallel|in order/i);

    expect(simpleExample?.textContent).toMatch(/submit/i);
    expect(simpleExample?.textContent).toMatch(/task:init/i);
    expect(simpleExample?.textContent).toMatch(/queued place/i);
    expect(simpleExample?.textContent).toMatch(/consume/i);

    expect(whereItAppears?.textContent).toMatch(/submitting work/i);
    expect(whereItAppears?.textContent).toMatch(/you work list/i);
    expect(whereItAppears?.textContent).toMatch(/waiting work-type place/i);
    expect(whereItAppears?.textContent).toMatch(/workstation/i);

    // No decorative / broken placeholder graph figure on the page.
    expect(document.querySelector("[data-page-asset]")).toBeNull();
    expect(document.querySelector("[data-asset-type='graph']")).toBeNull();

    expect(commonConfusions?.textContent).toMatch(/checklist/i);
    expect(commonConfusions?.textContent).toMatch(/submitting work/i);
    expect(commonConfusions?.textContent).toMatch(/token/i);
    expect(commonConfusions?.textContent).toMatch(/workqueue-executor/i);

    expect(
      related?.querySelector('a[href="/docs/documentation/submitting-work"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/concepts/checklist"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/concepts/tokens"]'),
    ).toBeTruthy();
    expect(
      related?.querySelector('a[href="/docs/techniques/workqueue-executor"]'),
    ).toBeTruthy();

    // Teaching copy must be in the document tree (not hover-only).
    expect(whatItIs?.textContent?.trim().length).toBeGreaterThan(40);
    expect(whyItMatters?.textContent?.trim().length).toBeGreaterThan(40);
    expect(simpleExample?.textContent?.trim().length).toBeGreaterThan(40);
    expect(whereItAppears?.textContent?.trim().length).toBeGreaterThan(40);
    expect(commonConfusions?.textContent?.trim().length).toBeGreaterThan(40);
  });
});
