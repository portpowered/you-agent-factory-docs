/**
 * Page-owned render proof for documentation/petri.
 * Covers documentation shell, Petri / CPN framing narrative, how-to-read
 * walkthrough, teaching diagram, and section headings.
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

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );

      expect(whatItCovers).toMatch(/Petri\s*\/\s*Colored Petri Net\s*\(CPN\)/);
      expect(whatItCovers).toMatch(/you-agent-factory/);
      expect(whatItCovers).toMatch(/work tokens move through places/i);
      expect(whatItCovers).toMatch(/workstation transitions/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(keyConcepts).toMatch(/place/i);
      expect(keyConcepts).toMatch(/task:init/);
      expect(keyConcepts).toMatch(/colored token/i);
      expect(keyConcepts).toMatch(/work-type identity and payload/i);
      expect(keyConcepts).toMatch(/transition/i);
      expect(keyConcepts).toMatch(/workstation/i);
      expect(keyConcepts).toMatch(/marking/i);
      expect(keyConcepts).toMatch(/tokens currently sit in which places/i);
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(howToUse).toMatch(/task:init/);
      expect(howToUse).toMatch(/enabled/i);
      expect(howToUse).toMatch(/fires/i);
      expect(howToUse).toMatch(/dispatches its worker/i);
      expect(howToUse).toMatch(/accepted/i);
      expect(howToUse).toMatch(/continue/i);
      expect(howToUse).toMatch(/rejection/i);
      expect(howToUse).toMatch(/failure/i);
      expect(howToUse).not.toMatch(
        /factory\.json field|on this page|Model Atlas|reader.?shortcut/i,
      );

      const tokenFlowAsset = loadedPage.assets.tokenFlow;
      expect(tokenFlowAsset).toBeDefined();
      expect(tokenFlowAsset?.type).toBe("image");
      if (tokenFlowAsset?.type === "image") {
        expect(tokenFlowAsset.src).toMatch(/^data:image\/svg\+xml,/);
        expect(tokenFlowAsset.altKey).toBe("assets.tokenFlow.alt");
        expect(tokenFlowAsset.captionKey).toBe("assets.tokenFlow.caption");
      }

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

      // Prose auto-linking may wrap terms in anchors; assert via textContent.
      const whatItCoversSection = document.getElementById("what-it-covers");
      const keyConceptsSection = document.getElementById("key-concepts");
      const howToUseSection = document.getElementById("how-to-use");
      expect(whatItCoversSection?.textContent).toMatch(
        /Colored Petri Net \(CPN\)/,
      );
      expect(whatItCoversSection?.textContent).toMatch(
        /work tokens move through places/i,
      );
      expect(keyConceptsSection?.textContent).toMatch(/task:init/);
      expect(keyConceptsSection?.textContent).toMatch(/colored token/i);
      expect(keyConceptsSection?.textContent).toMatch(/marking/i);
      expect(howToUseSection?.textContent).toMatch(/task:init/);
      expect(howToUseSection?.textContent).toMatch(/dispatches its worker/i);
      expect(howToUseSection?.textContent).toMatch(/accepted/i);

      const diagram = howToUseSection?.querySelector(
        '[data-page-asset="tokenFlow"]',
      );
      expect(diagram).toBeTruthy();
      expect(diagram?.getAttribute("data-asset-type")).toBe("image");
      const diagramImage = diagram?.querySelector("img");
      expect(diagramImage).toBeTruthy();
      expect(diagramImage?.getAttribute("src") ?? "").toMatch(
        /^data:image\/svg\+xml,/,
      );
      expect(diagramImage?.getAttribute("alt") ?? "").toMatch(/task:init/);
      expect(diagram?.querySelector("figcaption")?.textContent).toMatch(
        /Token flow/i,
      );

      expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    },
    { timeout: 30_000 },
  );
});
