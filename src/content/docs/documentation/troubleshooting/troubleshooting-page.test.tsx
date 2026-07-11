/**
 * Page-owned render proof for documentation/troubleshooting.
 * Covers documentation shell, Troubleshooting identity, recovery-lookup
 * framing, and absence of Model Atlas / reader-shortcut / page-meta copy —
 * not route inventories or shared helper contracts.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("troubleshooting documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/troubleshooting as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "troubleshooting"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/troubleshooting");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "troubleshooting",
    });

    expect(loadedPage.messages.title).toBe("Troubleshooting");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(
      /recover|failure|troubleshooting/i,
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

    expect(whatItCovers).toMatch(/recovery lookup/i);
    expect(whatItCovers).toMatch(/install/i);
    expect(whatItCovers).toMatch(/MCP/i);
    expect(keyConcepts).toMatch(/symptom/i);
    expect(keyConcepts).toMatch(/recovery/i);
    expect(keyConcepts).toMatch(/canonical/i);
    expect(howToUse).toMatch(/symptom/i);
    expect(howToUse).toMatch(/recovery/i);
    expect(limits).toMatch(/web recovery lookup/i);
    expect(limits).toMatch(/not the install command matrix/i);
    expect(limits).toMatch(/not a full CLI flag dump/i);
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
      /Troubleshooting is the you-agent-factory recovery lookup/i,
    );
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
    expect(document.body.textContent).not.toMatch(/reader.?shortcut/i);
    // Docs shell owns the page title; body must not duplicate an h1 title.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });
});
