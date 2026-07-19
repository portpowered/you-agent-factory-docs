/**
 * Page-owned render proof for documentation/petri.
 * Covers documentation shell, Petri / CPN framing narrative, how-to-read
 * walkthrough, teaching diagram, limits / PETRI-vs-JAVASCRIPT boundaries,
 * related discovery links, and section headings — without leftover
 * What It Covers / Key Concepts intro chrome.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
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

      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

      const openingSummary = String(loadedPage.messages.openingSummary ?? "");
      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );

      expect(openingSummary).toMatch(
        /Petri\s*\/\s*Colored Petri Net\s*\(CPN\)/,
      );
      expect(openingSummary).toMatch(/you-agent-factory/);
      expect(openingSummary).toMatch(/work tokens move through places/i);
      expect(openingSummary).toMatch(/workstation transitions/i);
      expect(openingSummary).not.toMatch(/\n\n/);
      expect(openingSummary).not.toMatch(
        /This page explains|on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(howToUse).toMatch(/place/i);
      expect(howToUse).toMatch(/task:init/);
      expect(howToUse).toMatch(/colored token/i);
      expect(howToUse).toMatch(/work-type identity and payload/i);
      expect(howToUse).toMatch(/transition/i);
      expect(howToUse).toMatch(/workstation/i);
      expect(howToUse).toMatch(/marking/i);
      expect(howToUse).toMatch(/tokens currently sit in which places/i);
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

      expect(limits).toMatch(
        /Petri\s*\/\s*Colored Petri Net\s*\(CPN\) framing/i,
      );
      expect(limits).toMatch(/not academic Petri-net theory/i);
      expect(limits).toMatch(/not the JavaScript dynamic-workflow/i);
      expect(limits).toMatch(/not the configuration field reference/i);
      expect(limits).toMatch(/not the architecture-of-system/i);
      expect(limits).toMatch(/PETRI/);
      expect(limits).toMatch(/JAVASCRIPT/);
      expect(limits).toMatch(/defaults to Petri/i);
      expect(limits).not.toMatch(
        /This page is|like this page describes|on this page|Model Atlas|reader.?shortcut/i,
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
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            {loadedPage.content}
          </DocsPageProviders>
        </main>,
      );

      expect(
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();

      expect(document.getElementById("how-to-use")).toBeTruthy();
      expect(document.getElementById("limits-and-assumptions")).toBeTruthy();
      expect(document.getElementById("related")).toBeTruthy();
      expect(document.getElementById("tags")).toBeTruthy();
      expect(document.getElementById("references")).toBeTruthy();

      const howToUseSection = document.getElementById("how-to-use");
      const limitsSection = document.getElementById("limits-and-assumptions");
      const relatedSection = document.getElementById("related");
      expect(howToUseSection?.textContent).toMatch(/task:init/);
      expect(howToUseSection?.textContent).toMatch(/colored token/i);
      expect(howToUseSection?.textContent).toMatch(/marking/i);
      expect(howToUseSection?.textContent).toMatch(/dispatches its worker/i);
      expect(howToUseSection?.textContent).toMatch(/accepted/i);
      expect(limitsSection?.textContent).toMatch(/PETRI/);
      expect(limitsSection?.textContent).toMatch(/JAVASCRIPT/);
      expect(limitsSection?.textContent).toMatch(/defaults to Petri/i);
      expect(limitsSection?.textContent).toMatch(
        /not academic Petri-net theory/i,
      );

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

      expect(
        relatedSection?.querySelector('a[href="/docs/concepts/tokens"]'),
      ).toBeNull();
      expect(
        relatedSection?.querySelector(
          'a[href="/docs/factories/configuration"]',
        ),
      ).toBeTruthy();
      expect(
        relatedSection?.querySelector('a[href="/docs/workstations"]'),
      ).toBeTruthy();
      expect(
        relatedSection?.querySelector(
          'a[href="/docs/documentation/architecture-of-system"]',
        ),
      ).toBeTruthy();
      expect(
        relatedSection?.querySelector('a[href="/docs/factories/sessions"]'),
      ).toBeTruthy();
      expect(
        relatedSection?.querySelector(
          'a[href="/docs/documentation/submitting-work"]',
        ),
      ).toBeTruthy();
      expect(relatedSection?.textContent).not.toMatch(/Tokens concept/i);
      expect(relatedSection?.textContent).toMatch(/Configuration/i);
      expect(relatedSection?.textContent).toMatch(/Workstations/i);
      expect(relatedSection?.textContent).toMatch(/Architecture of system/i);
      expect(relatedSection?.textContent).toMatch(/Factory session/i);
      expect(relatedSection?.textContent).toMatch(/Submitting work/i);

      expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    },
    { timeout: 30_000 },
  );
});
