/**
 * Page-owned render proof for documentation/dashboard-ui-overview.
 * Covers you-agent-factory identity, default dashboard URL and live
 * session surfaces, current-vs-roadmap limits, related-link presence,
 * and non-en locale section structure — without leftover What It Covers /
 * Key Concepts intro chrome. Colocated under the page bundle so
 * audit:canonical-page-surface stays within the ordinary page-owned +
 * locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("dashboard-ui-overview documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/dashboard-ui-overview as a documentation page", async () => {
    const fumadocsPage = source.getPage([
      "documentation",
      "dashboard-ui-overview",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/dashboard-ui-overview");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "dashboard-ui-overview",
    });

    expect(loadedPage.messages.title).toBe("Dashboard / UI Overview");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/dashboard/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).toMatch(
      /not a rebuilt in-docs dashboard/i,
    );

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(openingSummary).toMatch(/you-agent-factory/i);
    expect(openingSummary).toMatch(/dashboard|browser surface/i);
    expect(openingSummary).toMatch(/Factory Session/i);
    expect(openingSummary).not.toMatch(/\n\n/);
    expect(openingSummary).not.toMatch(/on this page|reader.?shortcut/i);

    expect(howToUse).toMatch(/http:\/\/localhost:7437\/dashboard\/ui/);
    expect(howToUse).toMatch(/without quiet mode/i);
    expect(howToUse).toMatch(/session selection/i);
    expect(howToUse).toMatch(/work position/i);
    expect(howToUse).toMatch(/factory activity/i);
    expect(howToUse).toMatch(/SESSION_LIFECYCLE_CONTROL/);
    expect(howToUse).toMatch(/canonical API status/i);
    expect(howToUse).toMatch(/you session list/i);
    expect(howToUse).not.toMatch(/on this page|reader.?shortcut/i);

    expect(limits).toMatch(/not a rebuilt in-docs dashboard/i);
    expect(limits).toMatch(
      /Autonomous agents must not treat dashboard submit/i,
    );
    expect(limits).toMatch(/MCP status and event tool parity/i);
    expect(limits).toMatch(/roadmap/i);
    expect(limits).toMatch(/does not rebuild the factory dashboard UI/i);
    expect(limits).not.toMatch(/on this page|reader.?shortcut/i);

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
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const howToUseSection = document.getElementById("how-to-use");
    expect(howToUseSection?.textContent).toMatch(
      /http:\/\/localhost:7437\/dashboard\/ui/,
    );
    expect(howToUseSection?.textContent).toMatch(/session selection/i);
    expect(howToUseSection?.textContent).toMatch(/SESSION_LIFECYCLE_CONTROL/);

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(
      /not a rebuilt in-docs dashboard/i,
    );
    expect(limitsSection?.textContent).toMatch(/roadmap/i);
    expect(limitsSection?.textContent).toMatch(
      /Autonomous agents must not treat dashboard submit/i,
    );

    const relatedSection = document.getElementById("related");
    expect(relatedSection).toBeTruthy();
    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "Security / Trust Boundaries" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/security-trust-boundaries");
    expect(
      relatedQueries
        .getByRole("link", { name: "Factory Session" })
        .getAttribute("href"),
    ).toBe("/docs/factories/sessions");
    expect(
      relatedQueries
        .getByRole("link", { name: "Metrics" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/metrics");
    expect(
      relatedQueries
        .getByRole("link", { name: "Configuration" })
        .getAttribute("href"),
    ).toBe("/docs/factories/configuration");

    expect(screen.queryByText(/reader shortcut/i)).toBeNull();
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });

  test("loads ja locale messages with the same section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "dashboard-ui-overview",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Dashboard / UI Overview");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse?.title).toBe("How To Use");
    expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
      "Limits And Assumptions",
    );
    expect(String(loadedPage.messages.openingSummary ?? "")).toMatch(
      /dashboard|browser surface/i,
    );

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
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(document.body.textContent).toMatch(
      /http:\/\/localhost:7437\/dashboard\/ui/,
    );
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });
});
