import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("submitting-work documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders documentation shell and submitting-work identity", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "submitting-work",
    });

    expect(loadedPage.messages.title).toBe("Submitting Work");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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

    expect(
      screen.getAllByText(/FACTORY_REQUEST_BATCH/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /submit that batch to a factory that is already running/i,
      ),
    ).toBeTruthy();
  });
});
