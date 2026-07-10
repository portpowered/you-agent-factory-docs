/**
 * Page-owned render proof for concepts/bottlenecks.
 * Covers concept shell headings and bottlenecks identity —
 * not routine derived bundle invariants (those stay on make validate-data).
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary concept lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("bottlenecks concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("loads as a concept page with bottlenecks title and section shell", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "bottlenecks",
    });

    expect(loadedPage.frontmatter.kind).toBe("concept");
    expect(loadedPage.frontmatter.registryId).toBe("concept.bottlenecks");
    expect(loadedPage.messages.title).toBe("Bottlenecks");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/bottleneck/i);
    expect(loadedPage.messages.description).toMatch(/throughput/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(/roofline/i);
    expect(loadedPage.messages.description).not.toMatch(/leaderboard/i);
    // Optional visual deferred: prose teaches the limiting-stage idea.
    expect(Object.keys(loadedPage.assets)).toEqual([]);

    render(
      <main>
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          <h1>{loadedPage.messages.title}</h1>
          {loadedPage.content}
        </ModulePageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Bottlenecks" })).toBeTruthy();
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

    expect(whatItIs?.textContent).toMatch(/factory bottleneck/i);
    expect(whatItIs?.textContent).toMatch(/throughput/i);
    expect(document.querySelector("[data-page-asset]")).toBeNull();
    expect(document.querySelector("[data-asset-type='graph']")).toBeNull();
  });
});
