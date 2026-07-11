/**
 * Page-owned render proof for documentation/contributing-to-these-docs.
 * Covers publish/discoverability and factory-only title/description chrome —
 * fuller contributing guidance and locale stubs land in a later story.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { getPublishedDocsEntryByRegistryId } from "@/lib/content/published-docs-registry-ids";

describe("contributing-to-these-docs documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes at the documentation route without Model Atlas identity", async () => {
    const published = getPublishedDocsEntryByRegistryId(
      "documentation.contributing-to-these-docs",
    );
    expect(published).toBeTruthy();
    expect(published?.url).toBe(
      "/docs/documentation/contributing-to-these-docs",
    );

    const loadedPage = await loadLocalDocsPage({
      section: "documentation",
      slug: "contributing-to-these-docs",
    });

    expect(loadedPage.messages.title).toBe("Contributing to these docs");
    expect(loadedPage.messages.description).toContain("you-agent-factory");
    expect(loadedPage.messages.title).not.toMatch(/Model Atlas/i);
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

    const whatItCovers = document.getElementById("what-it-covers");
    expect(whatItCovers?.textContent).toMatch(/you-agent-factory/i);
    expect(whatItCovers?.textContent).not.toMatch(/Model Atlas/i);

    const whatIs = screen.getByRole("link", {
      name: "What is you-agent-factory",
    });
    const gettingStarted = screen.getByRole("link", {
      name: "Getting started",
    });
    expect(whatIs.getAttribute("href")).toBe(
      "/docs/documentation/what-is-you-agent-factory",
    );
    expect(gettingStarted.getAttribute("href")).toBe(
      "/docs/guides/getting-started",
    );
  });
});
