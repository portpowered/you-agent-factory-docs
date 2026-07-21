/**
 * Page-owned render proof for documentation/cli after PF-L-strip:
 * teaching sections remain; Related / References footer chrome is absent.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("cli documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders install and commands teaching content without Related/References chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "cli",
    });

    expect(loadedPage.messages.title).toBe("CLI");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();

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

    expect(screen.getByRole("heading", { name: "Install" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Commands" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    expect(document.getElementById("install")?.textContent).toMatch(
      /Install the you CLI/i,
    );
    expect(document.getElementById("commands")?.textContent).toMatch(
      /you run --named/i,
    );
  });
});
