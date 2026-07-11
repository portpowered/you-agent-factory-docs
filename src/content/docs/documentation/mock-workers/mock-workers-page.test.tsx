/**
 * Page-owned render proof for documentation/mock-workers.
 * Covers documentation shell, mock vs live / record-replay distinction,
 * JSON selection contract cues, operational cautions, sibling discovery,
 * and non-en locale route render — not route inventories or shared
 * helper contracts. Colocated under the page bundle so
 * audit:canonical-page-surface stays within the ordinary page-owned +
 * locale-shipping surface for this lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("mock-workers documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/mock-workers as a documentation page",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "mock-workers"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/mock-workers");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "mock-workers",
      });

      expect(loadedPage.messages.title).toBe("Mock workers");
      expect(loadedPage.messages.description).toContain("you-agent-factory");
      expect(loadedPage.messages.description).toMatch(/--with-mock-workers/);
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
      const jsonContract = String(
        loadedPage.messages.sections?.jsonContract?.body ?? "",
      );
      const operationalCautions = String(
        loadedPage.messages.sections?.operationalCautions?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );

      expect(whatItCovers).toMatch(/--with-mock-workers/);
      expect(whatItCovers).toMatch(/deterministic/i);
      expect(whatItCovers).toMatch(/live provider/i);
      expect(keyConcepts).toMatch(/mockWorkers/);
      expect(keyConcepts).toMatch(/unmatchedDispatchPolicy/);
      expect(keyConcepts).toMatch(/record\/replay/i);
      expect(keyConcepts).toMatch(/not ordinary live worker/i);
      expect(howToUse).toMatch(/--with-mock-workers/);
      expect(howToUse).toMatch(/mockWorkers/);
      expect(jsonContract).toMatch(/mockWorkers/);
      expect(jsonContract).toMatch(/runType/);
      expect(jsonContract).toMatch(/accept|reject|script/);
      expect(jsonContract).toMatch(/unmatchedDispatchPolicy/);
      expect(operationalCautions).toMatch(/Unknown JSON fields/i);
      expect(operationalCautions).toMatch(/passthrough/);
      expect(operationalCautions).toMatch(/does not prove live-provider/i);
      expect(limits).toMatch(/not a live workers taxonomy/i);
      expect(limits).toMatch(/not a resources capacity deep-dive/i);
      expect(limits).toMatch(/not a record\/replay guide/i);
      expect(limits).toMatch(/not a packaged CLI sync/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(keyConcepts).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

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
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "JSON Contract" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Minimal Example" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Operational Cautions" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

      expect(document.body.textContent).toMatch(/--with-mock-workers/);
      expect(document.body.textContent).toMatch(/mockWorkers/);
      expect(document.body.textContent).toMatch(/unmatchedDispatchPolicy/);
      expect(document.body.textContent).toMatch(/passthrough/);
      expect(document.body.textContent).toMatch(/reviewer-rejects-first-pass/);

      const relatedSection = document.getElementById("related");
      expect(relatedSection).toBeTruthy();
      const relatedQueries = within(relatedSection as HTMLElement);
      expect(
        relatedQueries
          .getByRole("link", { name: "Workers" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/workers");
      expect(
        relatedQueries
          .getByRole("link", { name: "Resources" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/resources");
      expect(
        relatedQueries
          .getByRole("link", { name: "Troubleshooting" })
          .getAttribute("href"),
      ).toBe("/docs/documentation/troubleshooting");
    },
    PAGE_RENDER_TIMEOUT_MS,
  );

  test(
    "loads ja locale messages with the same section structure",
    async () => {
      const loadedPage = await loadLocalDocsPage(
        {
          section: "documentation",
          slug: "mock-workers",
        },
        "ja",
      );

      expect(loadedPage.messages.title).toBe("Mock workers");
      expect(loadedPage.messages.sections?.whatItCovers?.title).toBe(
        "What It Covers",
      );
      expect(loadedPage.messages.sections?.keyConcepts?.title).toBe(
        "Key Concepts",
      );
      expect(loadedPage.messages.sections?.howToUse?.title).toBe("How To Use");
      expect(loadedPage.messages.sections?.jsonContract?.title).toBe(
        "JSON Contract",
      );
      expect(loadedPage.messages.sections?.limitsAndAssumptions?.title).toBe(
        "Limits And Assumptions",
      );
      expect(
        String(loadedPage.messages.links?.enableWithoutPathCommand ?? ""),
      ).toMatch(/--with-mock-workers/);
      expect(
        String(loadedPage.messages.links?.contractMockWorkersField ?? ""),
      ).toBe("mockWorkers");

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
      expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
      expect(document.body.textContent).toMatch(/--with-mock-workers/);
      expect(document.body.textContent).toMatch(/mockWorkers/);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
