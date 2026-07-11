/**
 * Page-owned render proof for documentation/security-trust-boundaries.
 * Covers you-agent-factory identity, current trust-boundary facts,
 * non-guarantee limits language, related-link presence, and non-en
 * locale section structure — not route inventories or link-topology
 * manifests. Colocated under the page bundle so
 * audit:canonical-page-surface stays within the ordinary page-owned +
 * locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("security-trust-boundaries documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/security-trust-boundaries as a documentation page", async () => {
    const fumadocsPage = source.getPage([
      "documentation",
      "security-trust-boundaries",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe(
      "/docs/documentation/security-trust-boundaries",
    );

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "security-trust-boundaries",
    });

    expect(loadedPage.messages.title).toBe("Security / Trust Boundaries");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/trust boundaries/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).toMatch(
      /not a compliance certification claim/i,
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
    expect(whatItCovers).toMatch(/trust boundaries/i);
    expect(whatItCovers).toMatch(/local factory service/i);
    expect(whatItCovers).toMatch(/not a penetration-test report/i);
    expect(whatItCovers).not.toMatch(/Model Atlas/i);

    expect(keyConcepts).toMatch(/http:\/\/localhost:7437/);
    expect(keyConcepts).toMatch(/http:\/\/localhost:7437\/dashboard\/ui/);
    expect(keyConcepts).toMatch(/CLI/i);
    expect(keyConcepts).toMatch(/you submit/);
    expect(keyConcepts).toMatch(/operator paths/i);
    expect(keyConcepts).toMatch(/Replay artifacts are sensitive/i);
    expect(keyConcepts).toMatch(/Retention is operator-owned/i);
    expect(keyConcepts).toMatch(
      /without printing unrelated environment values/i,
    );
    expect(keyConcepts).toMatch(/stdio/i);
    expect(keyConcepts).toMatch(/you mcp serve/);

    expect(howToUse).toMatch(/configuration/i);
    expect(howToUse).toMatch(/factory-session/i);
    expect(howToUse).toMatch(/metrics/i);
    expect(howToUse).toMatch(/MCP/i);

    expect(limits).toMatch(/does not invent default TLS/i);
    expect(limits).toMatch(/multi-tenant authentication/i);
    expect(limits).toMatch(/does not claim automatic secret redaction/i);
    expect(limits).toMatch(/does not automatically delete old replay/i);
    expect(limits).toMatch(/does not rebuild or harden the factory dashboard/i);
    expect(limits).toMatch(/roadmap/i);

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
    expect(whatItCoversSection?.textContent).toMatch(/trust boundaries/i);
    expect(whatItCoversSection?.textContent).toMatch(/you-agent-factory/i);

    const keyConceptsSection = document.getElementById("key-concepts");
    expect(keyConceptsSection?.textContent).toMatch(
      /http:\/\/localhost:7437\/dashboard\/ui/,
    );
    expect(keyConceptsSection?.textContent).toMatch(/you submit/);
    expect(keyConceptsSection?.textContent).toMatch(/stdio/i);

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(/does not invent default TLS/i);
    expect(limitsSection?.textContent).toMatch(
      /does not claim automatic secret redaction/i,
    );
    expect(limitsSection?.textContent).toMatch(/roadmap/i);

    const relatedSection = document.getElementById("related");
    expect(relatedSection).toBeTruthy();
    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "Dashboard / UI Overview" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/dashboard-ui-overview");
    expect(
      relatedQueries
        .getByRole("link", { name: "Configuration" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/configuration");
    expect(
      relatedQueries
        .getByRole("link", { name: "Factory Session" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/factory-session");
    expect(
      relatedQueries
        .getByRole("link", { name: "Metrics" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/metrics");

    expect(screen.queryByText(/reader shortcut/i)).toBeNull();
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });

  test("loads ja locale messages with the same section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "security-trust-boundaries",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Security / Trust Boundaries");
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
    expect(document.body.textContent).toMatch(/http:\/\/localhost:7437/);
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
  });
});
