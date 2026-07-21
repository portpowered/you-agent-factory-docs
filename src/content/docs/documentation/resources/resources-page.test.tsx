/**
 * Page-owned render proof for documentation/resources after PF-L-strip:
 * teaching sections remain; Related / References footer chrome is absent.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("resources documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders resource teaching content without Related/References chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "resources",
    });

    expect(loadedPage.messages.title).toBe("Resources");
    expect(loadedPage.messages.description).toMatch(/bounded-concurrency/i);
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

    expect(
      screen.getByRole("heading", { name: "Where Requirements Belong" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Minimal Bounded-Concurrency Example",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Typed Resources" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    expect(
      document.getElementById("where-requirements-belong")?.textContent,
    ).toMatch(/resource pool/i);
  });
});
