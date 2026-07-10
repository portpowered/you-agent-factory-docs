/**
 * Page-owned render proof for concepts/worktree.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within page-owned budget for the worktree bundle (shared tests live elsewhere).
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("worktree concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/worktree as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "worktree"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/worktree");

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "worktree",
    });

    expect(loadedPage.messages.title).toBe("Worktree");
    expect(loadedPage.messages.description).toContain(
      "isolated checkout or workspace",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    expect(whatItIs).toMatch(/isolated checkout or workspace/i);
    expect(whatItIs).toMatch(/\.claude\/worktrees/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);

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

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Simple Example" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Common Confusions" }),
    ).toBeTruthy();

    const whatItIsSection = document.getElementById("what-it-is");
    expect(whatItIsSection?.textContent ?? "").toMatch(
      /isolated checkout or workspace/i,
    );
    expect(whatItIsSection?.textContent ?? "").toMatch(/\.claude\/worktrees/i);
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
