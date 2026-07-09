/**
 * Page-owned render proof for concepts/statistical-process-control-graphs.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary concept lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("statistical-process-control-graphs concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("loads as a concept page with SPC title and section shell", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "statistical-process-control-graphs",
    });

    expect(loadedPage.frontmatter.kind).toBe("concept");
    expect(loadedPage.frontmatter.registryId).toBe(
      "concept.statistical-process-control-graphs",
    );
    expect(loadedPage.messages.title).toBe(
      "Statistical Process Control Graphs",
    );
    expect(loadedPage.messages.description).toMatch(/control charts/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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

    expect(
      screen.getByRole("heading", {
        name: "Statistical Process Control Graphs",
      }),
    ).toBeTruthy();
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
  });
});
