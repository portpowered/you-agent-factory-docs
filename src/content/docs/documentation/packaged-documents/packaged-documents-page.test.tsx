/**
 * Page-owned render proof for documentation/packaged-documents.
 * Covers documentation shell, you docs discovery/freshness teaching,
 * and selectable minimal command examples — without leftover
 * What It Covers / Key Concepts intro chrome.
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

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    const discovery = String(
      loadedPage.messages.callouts?.discovery?.body ?? "",
    );
    const referenceAndFreshness = String(
      loadedPage.messages.callouts?.referenceAndFreshness?.body ?? "",
    );

    expect(openingSummary).toMatch(/packaged|you docs/i);
    expect(openingSummary).not.toMatch(/\n\n/);
    expect(openingSummary).not.toMatch(
      /This page|on this page|Model Atlas|reader.?shortcut/i,
    );

    expect(howToUse).toMatch(/topic id/i);
    expect(howToUse).toMatch(/agents|config|packaged-goal/);
    expect(howToUse).toMatch(/packaged topic index/i);
    expect(howToUse).toMatch(/no live factory/i);
    expect(howToUse).toMatch(/installed you binary/i);
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

    expect(discovery).toMatch(/you docs with no topic/i);
    expect(discovery).toMatch(/packaged topic index/i);
    expect(discovery).toMatch(/supported topic argument/i);
    expect(referenceAndFreshness).toMatch(/topic id/i);
    expect(referenceAndFreshness).toMatch(/installed CLI binary/i);
    expect(referenceAndFreshness).toMatch(/upgrade the CLI/i);
    expect(referenceAndFreshness).toMatch(/not a live sync/i);

    expect(limits).toMatch(
      /Packaged documents covers packaged you docs topics/i,
    );
    expect(limits).toMatch(/not a full topic dump/i);
    expect(limits).toMatch(/not a sync of packaged markdown/i);
    expect(limits).toMatch(/not factory-local/i);
    expect(limits).toMatch(/not the CLI install/i);
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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const howToUseSection = document.getElementById("how-to-use");
    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(howToUseSection).toBeTruthy();
    expect(limitsSection).toBeTruthy();

    expect(howToUseSection?.textContent).toMatch(/packaged topic index/i);
    expect(howToUseSection?.textContent).toMatch(/installed CLI binary/i);
    expect(howToUseSection?.textContent).toMatch(/upgrade the CLI/i);
    expect(howToUseSection?.textContent).toMatch(/not a live sync/i);

    // Selectable command examples must be visible without hovering.
    expect(howToUseSection?.textContent).toMatch(/you docs/);
    expect(howToUseSection?.textContent).toMatch(/you docs agents/);
    const codeBlocks = howToUseSection?.querySelectorAll("pre, code") ?? [];
    const codeText = Array.from(codeBlocks)
      .map((node) => node.textContent ?? "")
      .join("\n");
    expect(codeText).toMatch(/you docs/);
    expect(codeText).toMatch(/you docs agents/);

    expect(limitsSection?.textContent).toMatch(/not a full topic dump/i);
    expect(limitsSection?.textContent).toMatch(
      /not a sync of packaged markdown/i,
    );
    expect(limitsSection?.textContent).toMatch(/not factory-local/i);
    expect(limitsSection?.textContent).toMatch(/not the CLI install/i);

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
