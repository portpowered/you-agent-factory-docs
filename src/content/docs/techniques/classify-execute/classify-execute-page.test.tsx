/**
 * Page-owned render proof for techniques/classify-execute.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-collection exception for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("classify-execute technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/classify-execute as a docs technique page", async () => {
    const fumadocsPage = source.getPage(["techniques", "classify-execute"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/classify-execute");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "classify-execute",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe(
      "technique.classify-execute",
    );
    expect(loadedPage.messages.title).toBe("Classify-Execute");
    expect(loadedPage.messages.description).toContain("specialist execute");
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

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How It Works" })).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Compared To Nearby Techniques",
      }),
    ).toBeTruthy();
  });
});
