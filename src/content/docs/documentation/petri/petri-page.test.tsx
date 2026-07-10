/**
 * Page-owned render proof for documentation/petri scaffold.
 * Covers documentation shell, Petri / CPN identity, and section headings.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("petri documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/petri as a documentation page",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "petri"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/petri");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "petri",
      });

      expect(loadedPage.messages.title).toBe("Petri / Colored Petri Net (CPN)");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(
        /Petri|Colored Petri Net|CPN/,
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

      expect(
        screen.getByRole("heading", { name: "What It Covers" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Key Concepts" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

      expect(document.getElementById("what-it-covers")).toBeTruthy();
      expect(document.getElementById("key-concepts")).toBeTruthy();
      expect(document.getElementById("how-to-use")).toBeTruthy();
      expect(document.getElementById("limits-and-assumptions")).toBeTruthy();
      expect(document.getElementById("related")).toBeTruthy();
      expect(document.getElementById("tags")).toBeTruthy();
      expect(document.getElementById("references")).toBeTruthy();

      expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    },
    { timeout: 30_000 },
  );
});
