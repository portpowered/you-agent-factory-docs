/**
 * Page-owned render proof for documentation/harness-support.
 * Covers documentation shell, harness-support identity, support-matrix
 * DataTable, framing/limits copy, and sibling discovery links. Colocated
 * under the page bundle so audit:canonical-page-surface stays within-budget
 * for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
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
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    expect(whatItCovers).toMatch(/factory-supported harnesses/i);
    expect(whatItCovers).toMatch(/feature coverage/i);
    expect(whatItCovers).toMatch(/Model Context Protocol \(MCP\)/);
    expect(loadedPage.messages.description).toMatch(
      /Model Context Protocol \(MCP\)/,
    );
    expect(keyConcepts).toMatch(/agent runtime the factory drives/i);
    expect(howToUse).toMatch(/MCP|worktrees|external models/i);
    expect(howToUse).toMatch(/scan/i);
    expect(limits).toMatch(/Harness Support is a matrix reference/i);
    expect(limits).toMatch(/not a full runner or provider field dump/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the harness concept glossary/i);
    expect(limits).toMatch(/not an agent-factory comparison blog/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

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
    expect(
      screen.getByRole("heading", { name: "Support Matrix" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    const keyConceptsSection = document.getElementById("key-concepts");
    const supportMatrixSection = document.getElementById("support-matrix");
    const howToUseSection = document.getElementById("how-to-use");
    const limitsSection = document.getElementById("limits-and-assumptions");
    const relatedSection = document.getElementById("related");
    expect(whatItCoversSection).toBeTruthy();
    expect(keyConceptsSection).toBeTruthy();
    expect(supportMatrixSection).toBeTruthy();
    expect(howToUseSection).toBeTruthy();
    expect(limitsSection).toBeTruthy();
    expect(relatedSection).toBeTruthy();
    expect(keyConceptsSection?.textContent).toMatch(
      /agent runtime the factory drives/i,
    );
    expect(whatItCoversSection?.textContent).toMatch(/feature coverage/i);
    expect(howToUseSection?.textContent).toMatch(
      /MCP|worktrees|external models/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /Harness Support is a matrix reference/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not the harness concept glossary/i,
    );
    expect(limitsSection?.textContent).toMatch(
      /not an agent-factory comparison blog/i,
    );

    const matrix = within(supportMatrixSection as HTMLElement).getByRole(
      "table",
      { name: "Harness support matrix" },
    );
    const matrixQueries = within(matrix);
    for (const harness of [
      "claude",
      "codex",
      "opencode",
      "pi",
      "cursor",
      "agy",
    ]) {
      expect(
        matrixQueries.getByRole("columnheader", { name: harness }),
      ).toBeTruthy();
    }
    for (const feature of [
      "MCP",
      "Worktrees",
      "Loop",
      "Thinking controls",
      "Open source",
      "External model support",
    ]) {
      expect(matrixQueries.getByRole("cell", { name: feature })).toBeTruthy();
    }

    const relatedQueries = within(relatedSection as HTMLElement);
    expect(
      relatedQueries
        .getByRole("link", { name: "Harness concept" })
        .getAttribute("href"),
    ).toBe("/docs/concepts/harness");
    expect(
      relatedQueries
        .getByRole("link", { name: "Worktree concept" })
        .getAttribute("href"),
    ).toBe("/docs/concepts/worktree");
    expect(
      relatedQueries
        .getByRole("link", { name: "Loop concept" })
        .getAttribute("href"),
    ).toBe("/docs/concepts/loop");
    expect(
      relatedQueries
        .getByRole("link", { name: "Thinking concept" })
        .getAttribute("href"),
    ).toBe("/docs/concepts/thinking");
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
  });
});
