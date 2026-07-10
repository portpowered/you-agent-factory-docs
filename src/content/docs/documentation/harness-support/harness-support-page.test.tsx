/**
 * Page-owned render proof for documentation/harness-support.
 * Covers documentation shell + harness-support identity for the scaffold story.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("harness-support documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/harness-support as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "harness-support"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/harness-support");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "harness-support",
    });

    expect(loadedPage.messages.title).toBe("Harness Support");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/harness/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    expect(whatItCovers).toMatch(/agent runtimes/i);
    expect(whatItCovers).toMatch(/feature coverage|features/i);
    expect(keyConcepts).toMatch(/agent runtime the factory drives/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );

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
    const keyConceptsSection = document.getElementById("key-concepts");
    const howToUseSection = document.getElementById("how-to-use");
    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(whatItCoversSection).toBeTruthy();
    expect(keyConceptsSection).toBeTruthy();
    expect(howToUseSection).toBeTruthy();
    expect(limitsSection).toBeTruthy();
    expect(keyConceptsSection?.textContent).toMatch(
      /agent runtime the factory drives/i,
    );
    expect(whatItCoversSection?.textContent).toMatch(/you-agent-factory/i);
    expect(limitsSection?.textContent).toMatch(
      /web harness-support matrix reference/i,
    );
  });
});
