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
        name: "Related To",
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
    expect(whatItIs?.textContent).toMatch(/spare capacity/i);
    expect(whatItIs?.textContent).toMatch(
      /saturated work queue|slow harness|shared resource/i,
    );
    expect(whyItMatters?.textContent).toMatch(/adding more agents/i);
    expect(whyItMatters?.textContent).toMatch(/limiting stage/i);
    expect(whyItMatters?.textContent).not.toMatch(/on this page/i);
    expect(whyItMatters?.textContent).not.toMatch(/Model Atlas/i);

    expect(simpleExample?.textContent).toMatch(/write-review/i);
    expect(simpleExample?.textContent).toMatch(/review harness/i);
    expect(simpleExample?.textContent).toMatch(/task queue/i);
    expect(simpleExample?.textContent).toMatch(/bottleneck/i);
    expect(simpleExample?.textContent).toMatch(
      /adding more draft workers does not raise/i,
    );
    expect(simpleExample?.textContent).toMatch(/spare workers/i);
    expect(simpleExample?.textContent).not.toMatch(/on this page/i);
    expect(simpleExample?.textContent).not.toMatch(/Model Atlas/i);
    // Prose-first: no decorative graphic; teaching visual deferred (shared
    // concept-page-load switch required for page-local MDX chart components).
    expect(Object.keys(loadedPage.assets)).toEqual([]);
    expect(document.querySelector("[data-page-asset]")).toBeNull();
    expect(document.querySelector("[data-asset-type='graph']")).toBeNull();
    expect(document.querySelector("[data-chart-container]")).toBeNull();

    expect(whereItAppears?.textContent).toMatch(/task queues/i);
    expect(whereItAppears?.textContent).toMatch(/workers or workstations/i);
    expect(whereItAppears?.textContent).toMatch(/harness or tool calls/i);
    expect(whereItAppears?.textContent).toMatch(/token or context pressure/i);
    expect(whereItAppears?.textContent).not.toMatch(/on this page/i);
    expect(whereItAppears?.textContent).not.toMatch(/Model Atlas/i);

    expect(commonConfusions?.textContent).toMatch(/model-quality/i);
    expect(commonConfusions?.textContent).toMatch(/blog listicle/i);
    expect(commonConfusions?.textContent).toMatch(
      /statistical process control/i,
    );
    expect(commonConfusions?.textContent).not.toMatch(/on this page/i);
    expect(commonConfusions?.textContent).not.toMatch(/Model Atlas/i);

    const blogLink = screen.getByRole("link", {
      name: "Bottlenecks blog",
    });
    expect(blogLink.getAttribute("href")).toBe("/blog/bottlenecks");
    expect(
      screen.getByRole("link", { name: "Task queue" }).getAttribute("href"),
    ).toBe("/docs/concepts/task-queue");
    expect(
      screen
        .getByRole("link", {
          name: "Statistical process control graphs",
        })
        .getAttribute("href"),
    ).toBe("/docs/concepts/statistical-process-control-graphs");
    expect(
      screen.getByRole("link", { name: "Harness" }).getAttribute("href"),
    ).toBe("/docs/concepts/harness");
  });

  test("loads ja locale with concept section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "concepts",
        slug: "bottlenecks",
      },
      "ja",
    );

    expect(loadedPage.frontmatter.kind).toBe("concept");
    expect(loadedPage.messages.title).toBe("Bottlenecks");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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
  });
});
