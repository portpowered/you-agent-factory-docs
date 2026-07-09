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

    const whatItIs = String(loadedPage.messages.sections?.whatItIs?.body ?? "");
    const whyItMatters = String(
      loadedPage.messages.sections?.whyItMatters?.body ?? "",
    );
    expect(whatItIs).toMatch(/live outcomes and workstream board/i);
    expect(whatItIs).toMatch(/done/i);
    expect(whatItIs).toMatch(/active/i);
    expect(whatItIs).toMatch(/ready next/i);
    expect(whatItIs).toMatch(/intentionally held/i);
    expect(whatItIs).toMatch(/not mandatory gates/i);
    expect(whyItMatters).toMatch(/track customer outcomes/i);
    expect(whyItMatters).toMatch(/parallel/i);
    expect(whyItMatters).toMatch(/real holds/i);
    expect(whatItIs).not.toMatch(/on this page|Model Atlas/i);
    expect(whyItMatters).not.toMatch(/on this page|Model Atlas/i);

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
      screen.getByText(/live outcomes and workstream board/i),
    ).toBeTruthy();
    expect(screen.getByText(/track customer outcomes/i)).toBeTruthy();
    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});
