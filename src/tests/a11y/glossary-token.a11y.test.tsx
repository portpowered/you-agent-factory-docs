import "./mock-navigation";
import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import type { LoadedLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { expectNoSeriousAxeViolations } from "@/tests/a11y/axe";

describe("tokens concept route accessibility smoke", () => {
  let loadedPage: LoadedLocalDocsPage;

  beforeAll(async () => {
    loadedPage = await loadLocalDocsPage({
      section: "concepts",
      slug: "tokens",
    });
  });

  afterEach(() => {
    cleanup();
  });

  test("passes axe for model-inference tokens concept article body", async () => {
    const { container } = render(
      <main>
        <DocsPageProviders
          messages={loadedPage.messages}
          assets={loadedPage.assets}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Why It Matters" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    // Teaching-body auto-links remain after Related footer strip.
    expect(
      screen.getAllByRole("link", { name: "harness" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "deliberative reasoning" }),
    ).toBeTruthy();
    await expectNoSeriousAxeViolations(container);
  });
});
