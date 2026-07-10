/**
 * Page-owned render proof for documentation/metrics.
 * Covers documentation shell, factory-ops metrics identity, the
 * what-it-covers / key-concepts live-run narrative, status/dashboard
 * copyable guidance, the factory-ui metrics teaching chart, limits
 * scope copy, and sibling discovery links.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
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

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
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

    expect(whatItCovers).toMatch(/live-run signals/i);
    expect(whatItCovers).toMatch(/Factory Session/i);
    expect(whatItCovers).toMatch(/engine activity/i);
    expect(whatItCovers).toMatch(/work-token lifecycle/i);
    expect(whatItCovers).toMatch(/resource/i);
    expect(whatItCovers).toMatch(/dashboard/i);
    expect(whatItCovers).not.toMatch(/Model Atlas/i);

    expect(keyConcepts).toMatch(/Factory Session/i);
    expect(keyConcepts).toMatch(/factoryState/);
    expect(keyConcepts).toMatch(/runtimeStatus/);
    expect(keyConcepts).toMatch(/RUNNING/);
    expect(keyConcepts).toMatch(/IDLE/);
    expect(keyConcepts).toMatch(
      /RUNNING while runtimeStatus is IDLE|runtimeStatus is IDLE when/i,
    );
    expect(keyConcepts).toMatch(/categories/);
    expect(keyConcepts).toMatch(/totalTokens/);
    expect(keyConcepts).toMatch(/resources/);
    expect(keyConcepts).toMatch(/dashboard/i);
    expect(keyConcepts).toMatch(/snapshot/i);
    expect(keyConcepts).toMatch(/time-ordered/i);

    expect(howToUse).toMatch(/dashboard|status/i);
    expect(howToUse).toMatch(/factory-session/i);
    expect(howToUse).toMatch(/SPC|control-limit/i);
    expect(howToUse).toMatch(/logs/i);
    expect(howToUse).toMatch(/OpenAPI|API doc/i);
    expect(howToUse).toMatch(/bottlenecks|tokens/i);

    expect(statusRead).toMatch(
      /GET \/factory-sessions\/\{session_id\}\/status/,
    );
    expect(statusRead).toMatch(/factory-ops metrics|runtime health/i);

    expect(operatorDashboard).toMatch(/dashboard/i);
    expect(operatorDashboard).toMatch(/session selection/i);
    expect(operatorDashboard).toMatch(/work position/i);
    expect(operatorDashboard).toMatch(/factory activity/i);

    expect(metricsChart).toMatch(/time-ordered|successive ticks/i);
    expect(metricsChart).toMatch(/processing|terminal|failed|categories/i);

    expect(limits).toMatch(/factory metrics exposure reference/i);
    expect(limits).toMatch(/not a sync of packaged CLI/i);
    expect(limits).toMatch(/not a logs|not logs/i);
    expect(limits).toMatch(/not OpenAPI|API reference/i);
    expect(limits).toMatch(/not SPC control-chart/i);
    expect(limits).toMatch(/not bottleneck diagnosis/i);
    expect(limits).toMatch(/not Model Atlas/i);
    // Scope copy may say "not Model Atlas"; reject page-meta / shortcut prose only.
    expect(whatItCovers).not.toMatch(/on this page|reader.?shortcut/i);
    expect(keyConcepts).not.toMatch(/on this page|reader.?shortcut/i);
    expect(howToUse).not.toMatch(/on this page|reader.?shortcut/i);
    expect(statusRead).not.toMatch(/on this page|reader.?shortcut/i);
    expect(operatorDashboard).not.toMatch(/on this page|reader.?shortcut/i);
    expect(metricsChart).not.toMatch(/on this page|reader.?shortcut/i);
    expect(limits).not.toMatch(/on this page|reader.?shortcut/i);

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

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
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
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    expect(whatItCoversSection?.textContent).toMatch(/live-run signals/i);
    expect(whatItCoversSection?.textContent).toMatch(/engine activity/i);

    const keyConceptsSection = document.getElementById("key-concepts");
    expect(keyConceptsSection?.textContent).toMatch(/factoryState/);
    expect(keyConceptsSection?.textContent).toMatch(/runtimeStatus/);
    expect(keyConceptsSection?.textContent).toMatch(
      /RUNNING while runtimeStatus is IDLE/i,
    );
    expect(keyConceptsSection?.textContent).toMatch(/categories/);
    expect(keyConceptsSection?.textContent).toMatch(/totalTokens/);
    expect(keyConceptsSection?.textContent).toMatch(/time-ordered/i);

    const howToUseSection = document.getElementById("how-to-use");
    expect(howToUseSection?.textContent).toMatch(/factory-session/i);
    expect(howToUseSection?.textContent).toMatch(/control-limit/i);
    expect(howToUseSection?.textContent).toMatch(/logs/i);

    const statusReadSection = document.getElementById("status-read");
    expect(statusReadSection?.textContent).toMatch(
      /GET \/factory-sessions\/\{session_id\}\/status/,
    );
    expect(statusReadSection?.textContent).toMatch(
      /curl -s "http:\/\/localhost:7437\/factory-sessions\/~default\/status"/,
    );
    expect(statusReadSection?.textContent).toMatch(/factoryState/);
    expect(statusReadSection?.textContent).toMatch(/runtimeStatus/);
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
      /factory metrics exposure reference/i,
    );
    expect(limitsSection?.textContent).toMatch(/not a sync of packaged CLI/i);
    expect(limitsSection?.textContent).toMatch(/not Model Atlas/i);
    expect(limitsSection?.textContent).toMatch(/not bottleneck diagnosis/i);
    expect(limitsSection?.textContent).toMatch(/not SPC control-chart/i);

    const relatedSection = document.getElementById("related");
    expect(relatedSection?.textContent).toMatch(/factory-session/i);
    expect(relatedSection?.textContent).toMatch(/SPC graphs|control-limit/i);
    expect(relatedSection?.textContent).toMatch(/bottlenecks/i);
    expect(relatedSection?.textContent).toMatch(/tokens/i);
    expect(relatedSection?.textContent).toMatch(/Logs|API doc/i);
    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "Factory session" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/factory-session");
    expect(
      relatedQueries
        .getByRole("link", {
          name: "Statistical process control graphs",
        })
        .getAttribute("href"),
    ).toBe("/docs/concepts/statistical-process-control-graphs");
    expect(
      relatedQueries
        .getByRole("link", { name: "Bottlenecks" })
        .getAttribute("href"),
    ).toBe("/docs/concepts/bottlenecks");
    expect(
      relatedQueries.getByRole("link", { name: "Tokens" }).getAttribute("href"),
    ).toBe("/docs/concepts/tokens");

    expect(screen.queryByText(/reader shortcut/i)).toBeNull();
  });
});
