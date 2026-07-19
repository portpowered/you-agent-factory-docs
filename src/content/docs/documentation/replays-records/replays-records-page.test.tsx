/**
 * Page-owned render proof for documentation/replays-records.
 * Covers record/replay teaching visibility, sensitivity/limits copy,
 * sibling discovery hrefs, and non-en locale route render — without
 * leftover What It Covers / Key Concepts intro chrome. Colocated
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

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    expect(openingSummary).toMatch(/replay/i);
    expect(openingSummary).toMatch(/you-agent-factory/i);
    expect(openingSummary).not.toMatch(/\n\n/);
    expect(openingSummary).not.toMatch(
      /This page|on this page|reader.?shortcut|is the .+ reference|Replays \/ Records is/i,
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
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
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
    expect(howToUseSection?.textContent).not.toMatch(
      /This page|on this page|reader.?shortcut/i,
    );

    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(limitsSection?.textContent).toMatch(
      /Replays \/ Records covers capturing live runs/i,
    );
    expect(limitsSection?.textContent).toMatch(/not a sync of packaged CLI/i);
    expect(limitsSection?.textContent).toMatch(/must not be committed/i);
    expect(limitsSection?.textContent).toMatch(/prompts/i);
    expect(limitsSection?.textContent).toMatch(/payloads/i);
    expect(limitsSection?.textContent).toMatch(/stdout/i);
    expect(limitsSection?.textContent).toMatch(/stderr/i);
    expect(limitsSection?.textContent).not.toMatch(
      /This page is|on this page|web .+ reference|reader.?shortcut/i,
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
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse?.title).toBe("How To Use");
    expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
      "Limits And Assumptions",
    );
    expect(String(loadedPage.messages.openingSummary ?? "")).toMatch(/replay/i);
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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(document.getElementById("how-to-use")?.textContent).toMatch(
      /--replay <path>/,
    );
  });
});
