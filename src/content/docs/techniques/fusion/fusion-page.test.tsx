/**
 * Page-owned render proof for techniques/fusion.
 * Covers technique shell headings and fusion identity —
 * not routine derived bundle invariants (those stay on make validate-data).
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-section exception budget for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("fusion technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/fusion as a technique page with fusion title", async () => {
    const fumadocsPage = source.getPage(["techniques", "fusion"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/fusion");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "fusion",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe("technique.fusion");
    expect(loadedPage.messages.title).toBe("Fusion");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).toMatch(/two model passes/i);
    expect(loadedPage.messages.description).toMatch(/draft/i);
    expect(loadedPage.messages.description).toMatch(/refine/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.description).not.toMatch(/GPU kernel/i);
    expect(loadedPage.messages.description).not.toMatch(/multimodal/i);
    expect(loadedPage.messages.description).not.toMatch(/leaderboard/i);

    render(
      <main>
        <ModulePageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          <h1>{loadedPage.messages.title}</h1>
          {loadedPage.content}
        </ModulePageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "Fusion" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How It Works" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Compared To Nearby Techniques" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

    const whatItIs = document.getElementById("what-it-is");
    expect(whatItIs).toBeTruthy();
    expect(whatItIs?.textContent).toMatch(/you-agent-factory technique/i);
    expect(whatItIs?.textContent).toMatch(/two model passes/i);
    expect(whatItIs?.textContent).toMatch(/draft/i);
    expect(whatItIs?.textContent).toMatch(/refine/i);
    expect(whatItIs?.textContent).toMatch(/@you\/fusion/);
    expect(whatItIs?.textContent).not.toMatch(/on this page/i);
    expect(whatItIs?.textContent).not.toMatch(/Model Atlas/i);
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
