/**
 * Page-owned render proof for documentation/logs scaffold.
 * Covers documentation shell, Logs identity, and runtime-log surface
 * framing — not route inventories or shared helper contracts.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("logs documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/documentation/logs as a documentation page", async () => {
    const fumadocsPage = source.getPage(["documentation", "logs"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/documentation/logs");

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "logs",
    });

    expect(loadedPage.messages.title).toBe("Logs");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/runtime logs/i);
    expect(loadedPage.messages.description).toMatch(/--verbose|--debug/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(
      /docs-site build logs/i,
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

    expect(whatItCovers).toMatch(/runtime logs/i);
    expect(whatItCovers).toMatch(/CLI diagnostics/i);
    expect(keyConcepts).toMatch(/structured JSON rolling files/i);
    expect(keyConcepts).toMatch(/~\/\.you-agent-factory\/logs/);
    expect(keyConcepts).toMatch(/Runtime metrics/i);
    expect(howToUse).toMatch(/log root/i);
    expect(limits).toMatch(/web runtime-logs and CLI-diagnostics reference/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
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

    expect(document.body.textContent).toMatch(/Logs is the web reference/i);
    expect(document.body.textContent).toMatch(/~\/\.you-agent-factory\/logs/);
  });
});
