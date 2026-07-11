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
    expect(screen.getByRole("link", { name: "Configuration" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Workstations" })).toBeTruthy();
    await expectNoSeriousAxeViolations(container);
  });
});
