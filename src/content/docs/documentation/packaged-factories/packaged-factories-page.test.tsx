/**
 * Page-owned render proof for documentation/packaged-factories.
 * Covers documentation shell identity for first-party @you/* packaged
 * factories. Colocated under the page bundle so audit:canonical-page-surface
 * stays within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("packaged-factories documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/packaged-factories as a documentation page", async () => {
    const fumadocsPage = source.getPage([
      "documentation",
      "packaged-factories",
    ]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/packaged-factories");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "packaged-factories",
    });

    expect(loadedPage.messages.title).toBe("Packaged factories");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/@you\//);
    expect(loadedPage.messages.description).toMatch(/you run --named/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(
      /operator model defaults/i,
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

    expect(whatItCovers).toMatch(/@you\/goal/);
    expect(whatItCovers).toMatch(/@you\/fusion/);
    expect(whatItCovers).toMatch(/@you\/tts/);
    expect(whatItCovers).toMatch(/packaged factory/i);
    expect(keyConcepts).toMatch(/you run --named/i);
    expect(keyConcepts).toMatch(/~\/\.you-agent-factory\/factories/);
    expect(keyConcepts).toMatch(/materialize/i);
    expect(howToUse).toMatch(/you run --named/i);
    expect(howToUse).toMatch(/canonical name/i);
    expect(limits).toMatch(/not a sync of packaged CLI markdown/i);
    expect(limits).toMatch(/not operator-defaults/i);
    expect(limits).toMatch(/not factory\.json topology/i);
    expect(limits).toMatch(/not a per-factory invocation-signature/i);
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
      /Packaged factories are first-party built-in named factories/i,
    );
    expect(document.body.textContent).toMatch(/@you\/goal/);
    expect(document.body.textContent).toMatch(/you run --named/);
    expect(document.body.textContent).not.toMatch(/Model Atlas/i);
    expect(document.body.textContent).not.toMatch(/reader.?shortcut/i);
    // Docs shell owns the page title; body must not duplicate an h1 title.
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Packaged factories" }),
    ).toBeNull();
  });
});
