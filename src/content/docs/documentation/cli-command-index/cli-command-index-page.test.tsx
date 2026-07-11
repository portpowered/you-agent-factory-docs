/**
 * Page-owned render proof for documentation/cli-command-index.
 * Covers documentation shell, command-index identity, structured inventory
 * DataTable, source-link framing, and sibling CLI/install discovery links.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this ordinary documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("cli-command-index documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/cli-command-index as a documentation page",
    async () => {
      const fumadocsPage = source.getPage([
        "documentation",
        "cli-command-index",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/cli-command-index");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "cli-command-index",
      });

      expect(loadedPage.messages.title).toBe("CLI Command Index");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(/command/i);
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
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );
      const freshness = String(
        loadedPage.messages.sections?.freshnessOwnership?.body ?? "",
      );
      expect(whatItCovers).toMatch(/structured inventory/i);
      expect(whatItCovers).toMatch(/run|submit|session|work|docs/i);
      expect(keyConcepts).toMatch(/product CLI|you docs agents/i);
      expect(keyConcepts).toMatch(/not from a verbatim sync/i);
      expect(howToUse).toMatch(/CLI documentation page/i);
      expect(limits).toMatch(/structured web command index/i);
      expect(limits).toMatch(/not a sync of packaged you docs agents/i);
      expect(freshness).toMatch(/site docs maintainers/i);
      expect(freshness).toMatch(/product CLI|you docs agents/i);
      expect(freshness).toMatch(/added or renamed|running-factory semantics/i);
      expect(freshness).toMatch(/not automated governance CI/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(freshness).not.toMatch(/Model Atlas|reader.?shortcut/i);

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
        screen.getByRole("heading", { name: "What It Covers" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Key Concepts" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Command Index" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Freshness Ownership" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

      const freshnessSection = document.getElementById("freshness-ownership");
      expect(freshnessSection).toBeTruthy();
      expect(freshnessSection?.textContent).toMatch(/site docs maintainers/i);
      expect(freshnessSection?.textContent).toMatch(
        /you docs agents|product CLI/i,
      );
      expect(freshnessSection?.textContent).toMatch(
        /added or renamed|running-factory semantics/i,
      );
      const commandIndexSection = document.getElementById("command-index");
      expect(commandIndexSection).toBeTruthy();

      const table = within(commandIndexSection as HTMLElement).getByRole(
        "table",
        { name: "CLI command reference index" },
      );
      const matrixQueries = within(table);
      expect(
        matrixQueries.getByRole("cell", { name: "you submit" }),
      ).toBeTruthy();
      expect(
        matrixQueries.getByRole("cell", {
          name: "you docs / you docs <topic>",
        }),
      ).toBeTruthy();
      expect(
        matrixQueries.getByRole("columnheader", {
          name: "Factory must already be running?",
        }),
      ).toBeTruthy();

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const relatedQueries = within(relatedSection as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "CLI docs" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/cli");
      expect(
        relatedQueries
          .getByRole("link", { name: "Install" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/install");
      expect(
        relatedQueries
          .getByRole("link", { name: "Releases and changelog" })
          .getAttribute("href"),
      ).toBe("/blog/changelog");
      expect(
        relatedQueries
          .getByRole("link", { name: "GitHub Releases" })
          .getAttribute("href"),
      ).toBe("https://github.com/portpowered/you-agent-factory/releases");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
