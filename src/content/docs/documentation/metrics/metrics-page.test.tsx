/**
 * Page-owned render proof for documentation/metrics.
 * Covers documentation shell, factory-ops metrics identity, and the
 * what-it-covers / key-concepts live-run narrative. Status/dashboard
 * copyable guidance and chart proofs land in later stories. Colocated
 * under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
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
    expect(limits).toMatch(/factory metrics exposure reference/i);
    expect(limits).toMatch(/not Model Atlas/i);
    // Scope copy may say "not Model Atlas"; reject page-meta / shortcut prose only.
    expect(whatItCovers).not.toMatch(/on this page|reader.?shortcut/i);
    expect(keyConcepts).not.toMatch(/on this page|reader.?shortcut/i);
    expect(howToUse).not.toMatch(/on this page|reader.?shortcut/i);
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
    expect(screen.queryByText(/reader shortcut/i)).toBeNull();
  });
});
