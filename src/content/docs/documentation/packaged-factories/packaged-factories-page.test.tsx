/**
 * Page-owned render proof for documentation/packaged-factories Mode A overview.
 * Covers title/summary identity, Mode A purpose sections, the Mode B depth
 * link to /docs/factories/packaged, and the Packaged documents distinction —
 * without schema embeds or W18 move-stub compatibility chrome.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("packaged-factories documentation Mode A overview", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/packaged-factories as a Mode A capability overview",
    async () => {
      const fumadocsPage = source.getPage([
        "documentation",
        "packaged-factories",
      ]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/packaged-factories");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "packaged-factories",
      });

      expect(loadedPage.messages.title).toBe("Packaged Factories");
      expect(loadedPage.messages.description).toMatch(/@you\/*/i);
      expect(loadedPage.messages.description).toMatch(/you run --named/i);
      expect(loadedPage.messages.description).toMatch(/Packaged documents/i);
      expect(loadedPage.messages.description).not.toMatch(
        /This page moved|Model Atlas/i,
      );

      expect(loadedPage.messages.sections?.moved).toBeUndefined();
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

      const openingSummary = String(loadedPage.messages.openingSummary ?? "");
      const whatItIs = String(
        loadedPage.messages.sections?.whatItIs?.body ?? "",
      );
      const whenToUse = String(
        loadedPage.messages.sections?.whenToUse?.body ?? "",
      );
      const howItFits = String(
        loadedPage.messages.sections?.howItFits?.body ?? "",
      );
      const limits = String(
        loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
      );

      expect(openingSummary).toMatch(/packaged factories/i);
      expect(openingSummary).toMatch(/@you\/*/i);
      expect(openingSummary).toMatch(/you run --named/i);
      expect(openingSummary).toMatch(/Packaged documents/i);
      expect(openingSummary).not.toMatch(/\n\n/);
      expect(openingSummary).not.toMatch(
        /This page|on this page|Model Atlas|reader.?shortcut|moved/i,
      );

      expect(whatItIs).toMatch(/@you\/*/i);
      expect(whatItIs).toMatch(/catalog/i);
      expect(whatItIs).toMatch(/Packaged documents/i);
      expect(whatItIs).toMatch(/you docs/i);
      expect(whatItIs).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(whatItIs).not.toMatch(/schema embed/i);

      expect(whenToUse).toMatch(/you run --named/i);
      expect(whenToUse).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(howItFits).toMatch(/Factory Session/i);
      expect(howItFits).toMatch(/Packaged documents/i);
      expect(howItFits).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(limits).toMatch(/Packaged Factories covers/i);
      expect(limits).toMatch(/not a schema embed/i);
      expect(limits).toMatch(/not Packaged documents/i);
      expect(limits).toMatch(/Packaged Factories reference/i);
      expect(limits).not.toMatch(
        /This (overview|page) (explains|covers|is)|on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(loadedPage.messages.links?.packagedFactoriesDepth).toMatch(
        /Packaged Factories reference/i,
      );

      render(
        <main>
          <DocsPageProviders
            messages={loadedPage.messages}
            assets={loadedPage.assets}
          >
            <article data-registry-id={loadedPage.frontmatter.registryId}>
              {loadedPage.content}
            </article>
          </DocsPageProviders>
        </main>,
      );

      expect(
        document.querySelector("[data-documentation-route-compatibility]"),
      ).toBeNull();
      expect(document.querySelector("[data-schema-embed]")).toBeNull();
      expect(screen.queryByRole("heading", { name: "Moved" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();

      expect(screen.getByRole("heading", { name: "What It Is" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "When To Use" })).toBeTruthy();
      expect(screen.getByRole("heading", { name: "How It Fits" })).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

      const whatItIsSection = document.getElementById("what-it-is");
      expect(whatItIsSection?.textContent).toMatch(/@you\/*/i);
      expect(whatItIsSection?.textContent).toMatch(/Packaged documents/i);

      const depthLink = screen.getByRole("link", {
        name: "Packaged Factories reference",
      });
      expect(depthLink.getAttribute("href")).toBe("/docs/factories/packaged");

      const packagedDocumentsLink = screen.getByRole("link", {
        name: "Packaged documents",
      });
      expect(packagedDocumentsLink.getAttribute("href")).toBe(
        "/docs/documentation/packaged-documents",
      );
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
