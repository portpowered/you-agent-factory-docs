/**
 * Page-owned render proof for techniques/worker-adviser.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within the first-techniques-section exception budget for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("worker-adviser technique page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/techniques/worker-adviser as a docs technique page", async () => {
    const fumadocsPage = source.getPage(["techniques", "worker-adviser"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/techniques/worker-adviser");

    const loadedPage = await loadLocalDocsPage({
      section: "techniques",
      slug: "worker-adviser",
    });

    expect(loadedPage.frontmatter.kind).toBe("technique");
    expect(loadedPage.frontmatter.registryId).toBe("technique.worker-adviser");
    expect(loadedPage.frontmatter.status).toBe("published");
    expect(loadedPage.messages.title).toBe("Worker-Adviser");
    expect(loadedPage.messages.description).toMatch(
      /adviser role|worker role|performs the work/i,
    );
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
      screen.getByRole("heading", { name: "Compared To Nearby Techniques" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Worker-Adviser" }),
    ).toBeNull();
  });
});
