/**
 * Page-owned render proof for documentation/dashboard-ui-overview.
 * Covers you-agent-factory identity, default dashboard URL and live
 * session surfaces, current-vs-roadmap limits, related-link presence,
 * and non-en locale section structure — not route inventories or
 * link-topology manifests. Colocated under the page bundle so
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

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/you-agent-factory/i);
    expect(whatItCovers).toMatch(/local browser operator surface/i);
    expect(whatItCovers).toMatch(/Factory Session/i);
    expect(whatItCovers).not.toMatch(/Model Atlas/i);

    expect(keyConcepts).toMatch(/http:\/\/localhost:7437\/dashboard\/ui/);
    expect(keyConcepts).toMatch(/without quiet mode/i);
    expect(keyConcepts).toMatch(/session selection/i);
    expect(keyConcepts).toMatch(/work position/i);
    expect(keyConcepts).toMatch(/factory activity/i);
    expect(keyConcepts).toMatch(/SESSION_LIFECYCLE_CONTROL/);
    expect(keyConcepts).toMatch(/canonical API status/i);

    expect(howToUse).toMatch(/you session list/i);
    expect(howToUse).toMatch(/factory-session/i);
    expect(howToUse).toMatch(/metrics/i);
    expect(howToUse).toMatch(/configuration/i);

    expect(limits).toMatch(/not a rebuilt in-docs dashboard/i);
    expect(limits).toMatch(
      /Autonomous agents must not treat dashboard submit/i,
    );
    expect(limits).toMatch(/MCP status and event tool parity/i);
    expect(limits).toMatch(/roadmap/i);
    expect(limits).toMatch(/does not rebuild the factory dashboard UI/i);

    expect(whatItCovers).not.toMatch(/on this page|reader.?shortcut/i);
    expect(keyConcepts).not.toMatch(/on this page|reader.?shortcut/i);
    expect(howToUse).not.toMatch(/on this page|reader.?shortcut/i);
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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    expect(whatItCoversSection?.textContent).toMatch(
      /local browser operator surface/i,
    );
    expect(whatItCoversSection?.textContent).toMatch(/you-agent-factory/i);

    const keyConceptsSection = document.getElementById("key-concepts");
    expect(keyConceptsSection?.textContent).toMatch(
      /http:\/\/localhost:7437\/dashboard\/ui/,
    );
    expect(keyConceptsSection?.textContent).toMatch(/session selection/i);
    expect(keyConceptsSection?.textContent).toMatch(
      /SESSION_LIFECYCLE_CONTROL/,
    );

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
    expect(loadedPage.messages.sections?.whatItCovers?.title).toBe(
      "What It Covers",
    );
    expect(loadedPage.messages.sections?.keyConcepts?.title).toBe(
      "Key Concepts",
    );
    expect(loadedPage.messages.sections?.howToUse?.title).toBe("How To Use");
    expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
      "Limits And Assumptions",
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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
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
