/**
 * Page-owned render proof for documentation/architecture-of-system.
 * Covers documentation shell, system-structure identity, narrative
 * visibility, how-to-use discovery, and limits scope — without leftover
 * What It Covers / Key Concepts intro chrome.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
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
      expect(loadedPage.messages.openingSummary).toMatch(/workflow factory/i);
      expect(loadedPage.messages.openingSummary).toMatch(/Factory Session/i);
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

      const systemDiagram = String(
        loadedPage.messages.sections?.systemDiagram?.body ?? "",
      );
      expect(systemDiagram).toMatch(/Factory Session/i);
      expect(systemDiagram).toMatch(/workstation|worker/i);
      expect(systemDiagram).not.toMatch(
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
      expect(howToUse).toMatch(/factory\.json/i);
      expect(howToUse).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      expect(limits).toMatch(/system-structure overview/i);
      expect(limits).toMatch(/field dump/i);
      expect(limits).toMatch(/packaged CLI/i);
      expect(limits).toMatch(/MCP|API|logs|metrics/i);
      expect(limits).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
      expect(limits).not.toMatch(/This page is|docs-site internal/i);

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
      expect(screen.getAllByText(/factory\.json/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Petri framing/i)).toBeTruthy();
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
      expect(howToUseHrefs).toContain("/docs/factories/configuration");
      expect(howToUseHrefs).toContain("/docs/workers");
      expect(howToUseHrefs).toContain("/docs/workstations");
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
