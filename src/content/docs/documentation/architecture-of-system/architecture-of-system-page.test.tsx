/**
 * Page-owned render proof for documentation/architecture-of-system.
 * Covers documentation shell, system-structure identity, narrative
 * visibility, how-to-use discovery, and limits scope.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ModulePageProviders } from "@/features/docs/components/ModulePageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("architecture-of-system documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/architecture-of-system as a documentation page",
    async () => {
      const fumadocsPage = source.getPage([
        "documentation",
        "architecture-of-system",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe(
        "/docs/documentation/architecture-of-system",
      );

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "architecture-of-system",
      });

      expect(loadedPage.messages.title).toBe("Architecture of system");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(
        /system|architecture|FactorySession/i,
      );
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      expect(whatItCovers).toMatch(/workflow factory/i);
      expect(whatItCovers).toMatch(/persistent|coordinated/i);
      expect(whatItCovers).toMatch(/Factory Session|FactorySession/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      expect(keyConcepts).toMatch(/factory\.json/i);
      expect(keyConcepts).toMatch(/work types?/i);
      expect(keyConcepts).toMatch(/workstations?/i);
      expect(keyConcepts).toMatch(/workers?/i);
      expect(keyConcepts).toMatch(/resources?/i);
      expect(keyConcepts).toMatch(/Factory Session|FactorySession/i);
      expect(keyConcepts).toMatch(/Petri/i);
      expect(keyConcepts).toMatch(/JavaScript|dynamic workflow/i);
      expect(keyConcepts).toMatch(/on disk|authored/i);
      expect(keyConcepts).toMatch(/live|runtime|session/i);
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      const howToUse = String(
        loadedPage.messages.sections?.howToUse?.body ?? "",
      );
      expect(howToUse).toMatch(/Configuration/i);
      expect(howToUse).toMatch(/Workers/i);
      expect(howToUse).toMatch(/Workstations/i);
      expect(howToUse).toMatch(/Resources/i);
      expect(howToUse).toMatch(/Factory Session/i);
      expect(howToUse).toMatch(/dynamic workflow/i);
      expect(howToUse).toMatch(/Petri/i);
      expect(howToUse).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      expect(limits).toMatch(/system-structure overview/i);
      expect(limits).toMatch(/field dump/i);
      expect(limits).toMatch(/packaged CLI/i);
      expect(limits).toMatch(/docs-site internal architecture/i);
      expect(limits).toMatch(/MCP|API|logs|metrics/i);
      expect(limits).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

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
      expect(
        screen.getByRole("heading", { name: "System Diagram" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Tags" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "References" })).toBeTruthy();
      expect(screen.getByText(/workflow factory/i)).toBeTruthy();
      expect(screen.getAllByText(/factory\.json/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Petri-backed/i)).toBeTruthy();
      expect(
        screen.getByText("How work moves through you-agent-factory"),
      ).toBeTruthy();
      expect(screen.getByTestId("system-diagram-illustration")).toBeTruthy();
      expect(
        screen.getByRole("region", {
          name: "How work moves through you-agent-factory",
        }),
      ).toBeTruthy();
      expect(screen.getByText("Submitted work")).toBeTruthy();
      expect(screen.getByText("Factory Session")).toBeTruthy();
      expect(screen.getByText("Workstation")).toBeTruthy();
      expect(screen.getByText("Worker")).toBeTruthy();

      const howToUseSection = document.getElementById("how-to-use");
      expect(howToUseSection).toBeTruthy();
      expect(howToUseSection?.textContent).toMatch(/Configuration/i);
      expect(howToUseSection?.textContent).toMatch(/Workers/i);
      expect(howToUseSection?.textContent).toMatch(/Workstations/i);
      expect(howToUseSection?.textContent).toMatch(/Resources/i);
      expect(howToUseSection?.textContent).toMatch(/Factory Session/i);
      expect(howToUseSection?.textContent).toMatch(/Petri/i);
      expect(howToUseSection?.textContent).not.toMatch(/on this page/i);

      const howToUseLinks = howToUseSection?.querySelectorAll("a") ?? [];
      const howToUseHrefs = [...howToUseLinks].map((anchor) =>
        anchor.getAttribute("href"),
      );
      expect(howToUseHrefs).toContain(
        "/docs/documentation/what-is-you-agent-factory",
      );
      expect(howToUseHrefs).toContain("/docs/documentation/configuration");
      expect(howToUseHrefs).toContain("/docs/documentation/workers");
      expect(howToUseHrefs).toContain("/docs/documentation/workstations");
      expect(howToUseHrefs).toContain("/docs/documentation/resources");

      const limitsSection = document.getElementById("limits-and-assumptions");
      expect(limitsSection).toBeTruthy();
      expect(limitsSection?.textContent).toMatch(/system-structure overview/i);
      expect(limitsSection?.textContent).toMatch(/field dump/i);
      expect(limitsSection?.textContent).not.toMatch(/Model Atlas/i);
    },
    { timeout: 30_000 },
  );
});
