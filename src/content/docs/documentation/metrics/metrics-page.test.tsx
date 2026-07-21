/**
 * Page-owned render proof for documentation/metrics.
 * Covers documentation shell, factory-ops metrics identity, short purpose
 * lead, status/dashboard copyable guidance, the factory-ui metrics teaching
 * chart, limits scope copy, and sibling discovery links — without leftover
 * What It Covers / Key Concepts / How To Use intro chrome.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("metrics documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/metrics as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "metrics"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/metrics");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "metrics",
    });

    expect(loadedPage.messages.title).toBe("Metrics");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(
      /factory-ops|Factory Session/i,
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(
      /benchmark leaderboard/i,
    );

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    const statusRead = String(
      loadedPage.messages.sections?.statusRead?.body ?? "",
    );
    const operatorDashboard = String(
      loadedPage.messages.sections?.operatorDashboard?.body ?? "",
    );
    const metricsChart = String(
      loadedPage.messages.sections?.metricsChart?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(openingSummary).toMatch(/live-run signals/i);
    expect(openingSummary).toMatch(/Factory Session/i);
    expect(openingSummary).not.toMatch(/\n\n/);
    expect(openingSummary).not.toMatch(/on this page|reader.?shortcut/i);

    expect(statusRead).toMatch(
      /GET \/factory-sessions\/\{session_id\}\/status/,
    );
    expect(statusRead).toMatch(/factory-ops metrics|runtime health/i);
    expect(statusRead).toMatch(/Factory Session/i);
    expect(statusRead).not.toMatch(/on this page|reader.?shortcut/i);

    expect(operatorDashboard).toMatch(/dashboard/i);
    expect(operatorDashboard).toMatch(/session selection/i);
    expect(operatorDashboard).toMatch(/work position/i);
    expect(operatorDashboard).toMatch(/factory activity/i);
    expect(operatorDashboard).not.toMatch(/on this page|reader.?shortcut/i);

    expect(metricsChart).toMatch(/time-ordered|successive ticks/i);
    expect(metricsChart).toMatch(/processing|terminal|failed|categories/i);
    expect(metricsChart).not.toMatch(/on this page|reader.?shortcut/i);

    expect(limits).toMatch(/Metrics covers factory metrics exposure/i);
    expect(limits).toMatch(/not a sync of packaged CLI/i);
    expect(limits).toMatch(/not a logs|not logs/i);
    expect(limits).toMatch(/not OpenAPI|API reference/i);
    expect(limits).toMatch(/not SPC control-chart/i);
    expect(limits).toMatch(/not bottleneck diagnosis/i);
    expect(limits).toMatch(/not Model Atlas/i);
    expect(limits).not.toMatch(/on this page|reader.?shortcut/i);

    expect(
      String(loadedPage.messages.links?.statusFactoryStateField ?? ""),
    ).toBe("factoryState");
    expect(
      String(loadedPage.messages.links?.statusRuntimeStatusField ?? ""),
    ).toBe("runtimeStatus");
    expect(String(loadedPage.messages.links?.statusCategoriesField ?? "")).toBe(
      "categories",
    );
    expect(
      String(loadedPage.messages.links?.statusTotalTokensField ?? ""),
    ).toBe("totalTokens");
    expect(String(loadedPage.messages.links?.statusResourcesField ?? "")).toBe(
      "resources",
    );
    expect(
      String(loadedPage.messages.links?.statusReadTogetherNote ?? ""),
    ).toMatch(/RUNNING while runtimeStatus is IDLE/i);

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

    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(document.getElementById("how-to-use")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Read Session Status" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Open The Operator Dashboard" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Watch Metrics Over Time" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const statusReadSection = document.getElementById("status-read");
    expect(statusReadSection?.textContent).toMatch(
      /GET \/factory-sessions\/\{session_id\}\/status/,
    );
    expect(statusReadSection?.textContent).toMatch(
      /curl -s "http:\/\/localhost:7437\/factory-sessions\/~default\/status"/,
    );
    expect(statusReadSection?.textContent).toMatch(/factoryState/);
    expect(statusReadSection?.textContent).toMatch(/runtimeStatus/);
    expect(statusReadSection?.textContent).toMatch(
      /RUNNING while runtimeStatus is IDLE/i,
    );
    expect(statusReadSection?.textContent).toMatch(/categories/);
    expect(statusReadSection?.textContent).toMatch(/totalTokens/);
    expect(statusReadSection?.textContent).toMatch(/resources/);

    const dashboardSection = document.getElementById("operator-dashboard");
    expect(dashboardSection?.textContent).toMatch(
      /http:\/\/localhost:7437\/dashboard\/ui/,
    );
    expect(dashboardSection?.textContent).toMatch(/session selection/i);
    expect(dashboardSection?.textContent).toMatch(/work position/i);
    expect(dashboardSection?.textContent).toMatch(/factory activity/i);

    const metricsChartSection = document.getElementById("metrics-chart");
    expect(metricsChartSection?.textContent).toMatch(
      /Work-token lifecycle buckets over successive status ticks/,
    );
    expect(metricsChartSection?.textContent).toMatch(/X axis: Status tick/i);
    expect(metricsChartSection?.textContent).toMatch(/Y axis: Token count/i);
    const chart = screen.getByTestId("metrics-teaching-chart");
    expect(chart).toBeTruthy();
    const legend = chart.querySelector("[data-metrics-teaching-chart-legend]");
    expect(legend).toBeTruthy();
    const legendQueries = within(legend as HTMLElement);
    expect(legendQueries.getByText("Processing")).toBeTruthy();
    expect(legendQueries.getByText("Terminal")).toBeTruthy();
    expect(legendQueries.getByText("Failed")).toBeTruthy();

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(
      /Metrics covers factory metrics exposure/i,
    );
    expect(limitsSection?.textContent).toMatch(/not a sync of packaged CLI/i);
    expect(limitsSection?.textContent).toMatch(/not Model Atlas/i);
    expect(limitsSection?.textContent).toMatch(/not bottleneck diagnosis/i);
    expect(limitsSection?.textContent).toMatch(/not SPC control-chart/i);

    expect(screen.queryByText(/reader shortcut/i)).toBeNull();
  });
});
