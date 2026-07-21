/**
 * Page-owned render proof for documentation/what-is-you-agent-factory after
 * PF-L-strip: teaching content and limits links remain; Related / References
 * footer chrome is absent.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("what-is-you-agent-factory documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders overview teaching content without Related/References chrome", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "what-is-you-agent-factory",
    });

    expect(loadedPage.messages.title).toBe("What is you-agent-factory");
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

    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const limits = document.getElementById("limits-and-assumptions");
    expect(limits?.textContent).toMatch(/not Model Atlas/i);
    expect(
      screen
        .getByRole("link", { name: "Getting started" })
        .getAttribute("href"),
    ).toBe("/docs/guides/getting-started");
    expect(
      screen
        .getByRole("link", { name: "Architecture of system" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/architecture-of-system");
  });
});
