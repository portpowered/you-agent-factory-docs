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
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    const simpleExample = String(
      loadedPage.messages.sections?.simpleExample?.body ?? "",
    );
    const commonConfusions = String(
      loadedPage.messages.sections?.commonConfusions?.body ?? "",
    );
    expect(whatItIs).toMatch(/isolated checkout or workspace/i);
    expect(whatItIs).toMatch(/\.claude\/worktrees/i);
    expect(whatItIs).toMatch(/not the factory workflow system/i);
    expect(whatItIs).toMatch(/not just a branch name/i);
    expect(whyItMatters).toMatch(/parallel agent lanes/i);
    expect(whyItMatters).toMatch(/without stomping the same files/i);
    expect(whyItMatters).toMatch(/harness or workstation/i);
    expect(whyItMatters).toMatch(/worktree path/i);
    expect(simpleExample).toMatch(/\.claude\/worktrees/i);
    expect(simpleExample).toMatch(/work-item-name|executor|review step/i);
    expect(simpleExample).toMatch(/isolated/i);
    expect(commonConfusions).toMatch(/not a git branch/i);
    expect(commonConfusions).toMatch(/working-directory|working directory/i);
    expect(commonConfusions).toMatch(/not a workstation/i);
    expect(commonConfusions).toMatch(/not the factory/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);
    expect(simpleExample).not.toMatch(/on this page|Model Atlas/i);
    expect(commonConfusions).not.toMatch(/on this page|Model Atlas/i);

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

    const whyItMattersSection = document.getElementById("why-it-matters");
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /parallel agent lanes/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /without stomping the same files/i,
    );
    expect(whyItMattersSection?.textContent ?? "").toMatch(
      /harness or workstation/i,
    );

    const simpleExampleSection = document.getElementById("simple-example");
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /\.claude\/worktrees/i,
    );
    expect(simpleExampleSection?.textContent ?? "").toMatch(
      /executor|review step/i,
    );

    const commonConfusionsSection =
      document.getElementById("common-confusions");
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /not a git branch/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /not a workstation/i,
    );
    expect(commonConfusionsSection?.textContent ?? "").toMatch(
      /not the factory/i,
    );
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
