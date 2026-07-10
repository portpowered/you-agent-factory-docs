import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";

describe("install documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders OS install commands, Claude init, Codex default, and next-step hrefs", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "install",
    });

    expect(loadedPage.messages.title).toBe("Install you-agent-factory");
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
      screen.getByText(
        "curl -fsSL https://github.com/portpowered/you-agent-factory/releases/latest/download/install.sh | sh",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "irm https://github.com/portpowered/you-agent-factory/releases/latest/download/install.ps1 | iex",
      ),
    ).toBeTruthy();
    expect(screen.getByText("you init --executor claude")).toBeTruthy();
    expect(
      screen.getByText(/omit it for the default Codex-backed scaffold/i),
    ).toBeTruthy();

    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    const cliDocs = screen.getByRole("link", {
      name: "CLI docs",
    });
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
    expect(cliDocs.getAttribute("href")).toBe("/docs/documentation/cli");
  });
});
