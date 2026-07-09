import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("checklist concept page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/concepts/checklist as a docs concept page", async () => {
    const fumadocsPage = source.getPage(["concepts", "checklist"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/concepts/checklist");

    const loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "checklist",
    });

    expect(loadedPage.messages.title).toBe("Checklist");
    expect(loadedPage.messages.description).toContain(
      "live outcomes and workstream board",
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(String(loadedPage.messages.sections?.whatItIs?.body ?? "")).toMatch(
      /live planner outcomes and workstream board/i,
    );

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
      screen.getByText(/live planner outcomes and workstream board/i),
    ).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
