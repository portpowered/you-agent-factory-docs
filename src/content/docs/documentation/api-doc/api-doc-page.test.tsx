/**
 * Page-owned render proof for documentation/api-doc.
 * Covers documentation shell and API / OpenAPI identity for the scaffold story.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

// Cold MDX compile + full-page render can exceed Bun's 5s default under load.
const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("api-doc documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/api-doc as a documentation page",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "api-doc"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/api-doc");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "api-doc",
      });

      expect(loadedPage.messages.title).toBe("API");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(/OpenAPI|HTTP/i);
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      expect(whatItCovers).toMatch(/OpenAPI|HTTP|API/i);
      expect(keyConcepts).toMatch(
        /OpenAPI \(Open Application Programming Interface\)/,
      );
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

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

      const whatItCoversSection = document.getElementById("what-it-covers");
      const keyConceptsSection = document.getElementById("key-concepts");
      expect(whatItCoversSection).toBeTruthy();
      expect(keyConceptsSection).toBeTruthy();
      expect(whatItCoversSection?.textContent).toMatch(
        /you-agent-factory API|OpenAPI/i,
      );
      expect(keyConceptsSection?.textContent).toMatch(
        /OpenAPI \(Open Application Programming Interface\)/,
      );
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
