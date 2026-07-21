/**
 * Page-owned render proof for documentation/harness-support.
 * Covers documentation shell, harness-support identity, support-matrix
 * DataTable, framing/limits copy, and sibling discovery links — without
 * leftover What It Covers / Key Concepts intro chrome. Colocated under the
 * page bundle so audit:canonical-page-surface stays within-budget for this
 * ordinary documentation lane.
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
    expect(loadedPage.messages.openingSummary).toMatch(
      /agent runtimes the factory drives/i,
    );
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    const supportMatrix = String(
      loadedPage.messages.sections?.supportMatrix?.body ?? "",
    );
    expect(loadedPage.messages.description).toMatch(
      /Model Context Protocol \(MCP\)/,
    );
    expect(supportMatrix).toMatch(/factory-supported harnesses/i);
    expect(supportMatrix).toMatch(/Model Context Protocol \(MCP\)|MCP/);
    expect(howToUse).toMatch(/MCP|worktrees|external models/i);
    expect(howToUse).toMatch(/scan/i);
    expect(limits).toMatch(/Harness Support is a matrix reference/i);
    expect(limits).toMatch(/not a full runner or provider field dump/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the harness concept glossary/i);
    expect(limits).toMatch(/not an agent-factory comparison blog/i);
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
    expect(supportMatrix).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
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
    expect(
      screen.getByRole("heading", { name: "Support Matrix" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const supportMatrixSection = document.getElementById("support-matrix");
    const howToUseSection = document.getElementById("how-to-use");
    const limitsSection = document.getElementById("limits-and-assumptions");
    expect(supportMatrixSection).toBeTruthy();
    expect(howToUseSection).toBeTruthy();
    expect(limitsSection).toBeTruthy();
    expect(supportMatrixSection?.textContent).toMatch(/feature coverage|MCP/i);
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
  });
});
