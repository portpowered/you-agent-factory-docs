/**
 * Page-owned render proof for concepts/task-queue.
 * Covers concept shell headings and task-queue identity —
 * not routine derived bundle invariants (those stay on make validate-data).
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary concept lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
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
      screen.getByRole("heading", {
        name: "Related Concepts And Modules",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    expect(screen.getByText(/backlog of submitted work/i)).toBeTruthy();
    expect(document.getElementById("what-it-is")).toBeTruthy();
    expect(document.getElementById("why-it-matters")).toBeTruthy();
    expect(document.getElementById("simple-example")).toBeTruthy();
    expect(document.getElementById("common-confusions")).toBeTruthy();
  });
});
