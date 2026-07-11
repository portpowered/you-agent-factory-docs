/**
 * Page-owned render proof for documentation/poller-workers.
 * Covers documentation shell and Poller workers identity — not route
 * inventories, ownership teaching depth, or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("poller-workers documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/poller-workers with Poller workers identity", async () => {
    const fumadocsPage = source.getPage(["documentation", "poller-workers"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/poller-workers");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "poller-workers",
    });

    expect(loadedPage.messages.title).toBe("Poller workers");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/POLLER_WORKER/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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

    expect(whatItCovers.length).toBeGreaterThan(0);
    expect(whatItCovers).toMatch(/POLLER_WORKER/i);
    expect(whatItCovers).toMatch(/you-agent-factory/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
    );
    expect(keyConcepts.length).toBeGreaterThan(0);
    expect(keyConcepts).toMatch(/POLLER_WORKER/i);
    expect(keyConcepts).toMatch(/behavior POLLER/i);
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
    );
    expect(howToUse.length).toBeGreaterThan(0);
    expect(howToUse).toMatch(/POLLER_WORKER/i);
    expect(howToUse).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
    );
    expect(limits.length).toBeGreaterThan(0);
    expect(limits).toMatch(/you-agent-factory/i);
    expect(limits).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut|later story/i,
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
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const body = document.body.textContent ?? "";
    expect(body).toMatch(/POLLER_WORKER/i);
    expect(body).toMatch(/you-agent-factory/i);
    expect(body).toMatch(/behavior POLLER/i);
    expect(body).not.toMatch(/Model Atlas/i);
  });
});
