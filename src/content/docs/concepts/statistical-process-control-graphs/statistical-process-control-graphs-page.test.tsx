/**
 * Page-owned render proof for concepts/statistical-process-control-graphs.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary concept lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
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
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          <h1>{loadedPage.messages.title}</h1>
          {loadedPage.content}
        </DocsPageProviders>
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
      screen.getByRole("heading", { name: "Where It Appears" }),
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

    const whereItAppears = String(
      loadedPage.messages.sections?.whereItAppears?.body ?? "",
    );
    const commonConfusions = String(
      loadedPage.messages.sections?.commonConfusions?.body ?? "",
    );
    expect(whereItAppears).toMatch(/ops|metrics/i);
    expect(whereItAppears).toMatch(/time|interval/i);
    expect(whereItAppears).not.toMatch(/on this page/i);
    expect(whereItAppears).not.toMatch(/Model Atlas/i);

    expect(commonConfusions).toMatch(/dashboard|snapshot/i);
    expect(commonConfusions).toMatch(/benchmark|eval|leaderboard/i);
    expect(commonConfusions).toMatch(/deploy|spike|special-cause/i);
    expect(commonConfusions).not.toMatch(/on this page/i);
    expect(commonConfusions).not.toMatch(/Model Atlas/i);

    const whereItAppearsSection = document.getElementById("where-it-appears");
    expect(whereItAppearsSection?.textContent).toMatch(/factory ops|metrics/i);
    const metricsLink = screen.getByRole("link", {
      name: "Metrics documentation",
    });
    expect(metricsLink.getAttribute("href")).toBe(
      "/docs/documentation/metrics",
    );
    expect(
      screen.getByRole("link", { name: "Bottlenecks" }).getAttribute("href"),
    ).toBe("/docs/concepts/bottlenecks");
    expect(
      screen.getByRole("link", { name: "Tokens" }).getAttribute("href"),
    ).toBe("/docs/concepts/tokens");

    const commonConfusionsSection =
      document.getElementById("common-confusions");
    expect(commonConfusionsSection?.textContent).toMatch(
      /dashboard snapshot|leaderboard|deploy bug/i,
    );

    expect(
      (loadedPage.messages as { links?: Record<string, string> }).links
        ?.metricsDocs,
    ).toBe("Metrics documentation");
  });

  test("loads ja locale with concept section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "concepts",
        slug: "statistical-process-control-graphs",
      },
      "ja",
    );

    expect(loadedPage.frontmatter.kind).toBe("concept");
    expect(loadedPage.messages.title).toBe(
      "Statistical Process Control Graphs",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          <h1>{loadedPage.messages.title}</h1>
          {loadedPage.content}
        </DocsPageProviders>
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
      screen.getByRole("heading", { name: "Where It Appears" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();
  });
});
