/**
 * Page-owned render proof for concepts/statistical-process-control-graphs.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary concept lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("statistical-process-control-graphs concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("loads as a concept page with SPC title and section shell", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "statistical-process-control-graphs",
    });

    expect(loadedPage.frontmatter.kind).toBe("concept");
    expect(loadedPage.frontmatter.registryId).toBe(
      "concept.statistical-process-control-graphs",
    );
    expect(loadedPage.messages.title).toBe(
      "Statistical Process Control Graphs",
    );
    expect(loadedPage.messages.description).toMatch(/control charts/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );

    expect(whatItIs).toMatch(/Statistical process control\s*\(SPC\)/i);
    expect(whatItIs).toMatch(/control chart/i);
    expect(whatItIs).toMatch(/center line/i);
    expect(whatItIs).toMatch(/control limits/i);
    expect(whatItIs).toMatch(/common-cause/i);
    expect(whatItIs).toMatch(/special-cause/i);
    expect(whatItIs).not.toMatch(/on this page/i);
    expect(whatItIs).not.toMatch(/Model Atlas/i);

    expect(whyItMatters).toMatch(
      /throughput|failure rate|queue depth|token spend/i,
    );
    expect(whyItMatters).toMatch(/drift|noise/i);
    expect(whyItMatters).not.toMatch(/on this page/i);
    expect(whyItMatters).not.toMatch(/Model Atlas/i);

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

    expect(
      screen.getByRole("heading", {
        name: "Statistical Process Control Graphs",
      }),
    ).toBeTruthy();
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
    const whatItIsSection = document.getElementById("what-it-is");
    const whyItMattersSection = document.getElementById("why-it-matters");
    expect(whatItIsSection?.textContent).toMatch(
      /Statistical process control\s*\(SPC\)\s*uses\s*control charts/i,
    );
    expect(whyItMattersSection?.textContent).toMatch(
      /throughput, failure rate, queue depth, and token spend/i,
    );

    const simpleExample = String(
      loadedPage.messages.sections?.simpleExample?.body ?? "",
    );
    expect(simpleExample).toMatch(/ten-minute interval|completions/i);
    expect(simpleExample).toMatch(/upper limit|control limit/i);
    expect(simpleExample).toMatch(/special-cause/i);

    const simpleExampleSection = document.getElementById("simple-example");
    expect(simpleExampleSection?.textContent).toMatch(
      /goal completions|ten-minute interval/i,
    );

    const chart = screen.getByRole("img", {
      name: "Control chart: goal completions per ten-minute interval",
    });
    expect(chart.getAttribute("data-chart-container")).toBe("");
    expect(
      simpleExampleSection?.querySelector(
        '[data-testid="spc-control-chart-illustration"]',
      ),
    ).toBeTruthy();
    const legend = simpleExampleSection?.querySelector(
      "[data-spc-control-chart-legend]",
    );
    expect(legend?.textContent).toMatch(/Completions/);
    expect(legend?.textContent).toMatch(/Center line/);
    expect(legend?.textContent).toMatch(/Upper control limit/);
    expect(legend?.textContent).toMatch(/Lower control limit/);
    expect(simpleExampleSection?.textContent).toMatch(
      /X axis: Interval \(ten-minute ticks\)/i,
    );
  });
});
