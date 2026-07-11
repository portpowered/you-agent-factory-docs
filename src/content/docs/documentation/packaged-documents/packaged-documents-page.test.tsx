/**
 * Page-owned render proof for documentation/packaged-documents.
 * Covers documentation shell and Packaged documents / you docs identity.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("packaged-documents documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/packaged-documents as a documentation page", async () => {
    const fumadocsPage = source.getPage([
      "documentation",
      "packaged-documents",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/packaged-documents");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "packaged-documents",
    });

    expect(loadedPage.messages.title).toBe("Packaged documents");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/you docs/i);
    expect(loadedPage.messages.description).toMatch(
      /packaged markdown reference topics/i,
    );
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

    expect(whatItCovers).toMatch(/packaged markdown reference topics/i);
    expect(whatItCovers).toMatch(/you docs/i);
    expect(whatItCovers).toMatch(/no live factory/i);
    expect(keyConcepts).toMatch(/topic id/i);
    expect(keyConcepts).toMatch(/installed .+ binary|CLI binary/i);
    expect(howToUse).toMatch(/you docs/);
    expect(howToUse).toMatch(/you docs agents/);
    expect(limits).toMatch(/not a full topic dump/i);
    expect(limits).toMatch(/not a sync of packaged markdown/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
    expect(limits).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

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

    expect(document.body.textContent).toMatch(
      /Packaged documents are packaged markdown reference topics/i,
    );
    expect(document.body.textContent).toMatch(/you docs/i);
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
    expect(document.body.textContent).not.toMatch(/reader.?shortcut/i);
    // Docs shell owns the page title; body must not duplicate an h1 title.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Packaged documents" }),
    ).toBeNull();
  });
});
