import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("what-is-you-agent-factory documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders framing sections, product identity, and next-step hrefs", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "what-is-you-agent-factory",
    });

    expect(loadedPage.messages.title).toBe("What is you-agent-factory");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();

    expect(
      screen.getByText(/software you install and run from a terminal/i),
    ).toBeTruthy();
    expect(screen.getByText(/persistent factory work/i)).toBeTruthy();
    expect(screen.getByText(/not Model Atlas/i)).toBeTruthy();

    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    const architecture = screen.getByRole("link", {
      name: "Architecture of system",
    });
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(architecture.getAttribute("href")).toBe(
      "/docs/documentation/architecture-of-system",
    );
  });
});
