/**
 * Page-owned render proof for documentation/replays-records.
 * Covers record/replay teaching visibility, sensitivity/limits copy,
 * sibling discovery hrefs, and non-en locale route render. Colocated
 * under the page bundle so audit:canonical-page-surface stays within
 * the ordinary page-owned + locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("replays-records documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders record/replay teaching content and sibling discovery", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "replays-records",
    });

    expect(loadedPage.messages.title).toBe("Replays / Records");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/replay/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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

    const howToUseSection = document.getElementById("how-to-use");
    expect(howToUseSection).toBeTruthy();
    expect(howToUseSection?.textContent).toMatch(
      /~\/\.you-agent-factory\/recordings\/YYYY-MM\/YYYY-MM-DD\//,
    );
    expect(howToUseSection?.textContent).toMatch(/Recording saved: <path>/);
    expect(howToUseSection?.textContent).toMatch(/--no-record/);
    expect(howToUseSection?.textContent).toMatch(/--record <path>/);
    expect(howToUseSection?.textContent).toMatch(/--replay <path>/);
    expect(howToUseSection?.textContent).toMatch(/--record with --replay/);
    expect(howToUseSection?.textContent).toMatch(/--no-record with --record/);
    expect(howToUseSection?.textContent).toMatch(
      /you run --dir \.\/factory --record/,
    );
    expect(howToUseSection?.textContent).toMatch(
      /you run --dir \.\/factory --replay/,
    );

    const keyConceptsSection = document.getElementById("key-concepts");
    expect(keyConceptsSection?.textContent).toMatch(/prompts/i);
    expect(keyConceptsSection?.textContent).toMatch(/payloads/i);
    expect(keyConceptsSection?.textContent).toMatch(/stdout/i);
    expect(keyConceptsSection?.textContent).toMatch(/stderr/i);

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(
      /Replays \/ Records covers capturing live runs/i,
    );
    expect(limitsSection?.textContent).toMatch(/not a sync of packaged CLI/i);
    expect(limitsSection?.textContent).toMatch(/must not be committed/i);
    expect(limitsSection?.textContent).not.toMatch(
      /This page is|on this page|web .+ reference|reader.?shortcut/i,
    );
    expect(howToUseSection?.textContent).not.toMatch(
      /This page|on this page|reader.?shortcut/i,
    );
    expect(keyConceptsSection?.textContent).not.toMatch(
      /This page|on this page|reader.?shortcut/i,
    );

    const relatedSection = document.getElementById("related");
    expect(relatedSection).toBeTruthy();
    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "CLI docs" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/cli");
    expect(
      relatedQueries
        .getByRole("link", { name: "Configuration" })
        .getAttribute("href"),
    ).toBe("/docs/factories/configuration");
    expect(
      relatedQueries
        .getByRole("link", { name: "Submitting Work" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/submitting-work");
  });

  test("loads ja locale messages with the same section structure", async () => {
    const loadedPage = await loadLocalDocsPage(
      {
        section: "documentation",
        slug: "replays-records",
      },
      "ja",
    );

    expect(loadedPage.messages.title).toBe("Replays / Records");
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
    expect(
      String(loadedPage.messages.links?.recordExampleCommand ?? ""),
    ).toMatch(/you run --dir \.\/factory --record/);
    expect(
      String(loadedPage.messages.links?.replayExampleCommand ?? ""),
    ).toMatch(/you run --dir \.\/factory --replay/);

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
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(document.getElementById("how-to-use")?.textContent).toMatch(
      /--replay <path>/,
    );
  });
});
