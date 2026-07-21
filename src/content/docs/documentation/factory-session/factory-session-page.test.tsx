/**
 * Page-owned render proof for documentation/factory-session Mode A overview.
 * Covers title/summary identity, Mode A purpose sections, and the Mode B
 * depth link to /docs/factories/sessions — without schema embeds or W18
 * move-stub compatibility chrome.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("factory-session documentation Mode A overview", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/documentation/factory-session as a Mode A capability overview",
    async () => {
      const fumadocsPage = source.getPage(["documentation", "factory-session"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/documentation/factory-session");

      const loadedPage = await loadLocalDocsPage({
        section: "documentation",
        slug: "factory-session",
      });

      expect(loadedPage.messages.title).toBe("Factory Sessions");
      expect(loadedPage.messages.description).toMatch(/Factory Session/i);
      expect(loadedPage.messages.description).toMatch(/live runtime/i);
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

      expect(openingSummary).toMatch(/Factory Session/i);
      expect(openingSummary).toMatch(/live runtime/i);
      expect(openingSummary).not.toMatch(/\n\n/);
      expect(openingSummary).not.toMatch(
        /This page|on this page|Model Atlas|reader.?shortcut|moved/i,
      );

      expect(whatItIs).toMatch(/Factory Session/i);
      expect(whatItIs).toMatch(/live runtime/i);
      expect(whatItIs).toMatch(/loads one Factory/i);
      expect(whatItIs).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(whatItIs).not.toMatch(/schema embed|OpenAPI/i);

      expect(whenToUse).toMatch(/live host|submit|pause|resume/i);
      expect(whenToUse).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(howItFits).toMatch(/session id/i);
      expect(howItFits).toMatch(/Dispatch|FactoryArtifact|FactoryEvent/i);
      expect(howItFits).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(limits).toMatch(/Factory Sessions covers/i);
      expect(limits).toMatch(/not a CLI flag dump/i);
      expect(limits).toMatch(/not schema or OpenAPI/i);
      expect(limits).toMatch(/Factory Sessions reference/i);
      expect(limits).not.toMatch(
        /This (overview|page) (explains|covers|is)|on this page|Model Atlas|reader.?shortcut/i,
      );

      expect(loadedPage.messages.links?.factorySessionsDepth).toMatch(
        /Factory Sessions reference/i,
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
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();

      const whatItIsSection = document.getElementById("what-it-is");
      expect(whatItIsSection?.textContent).toMatch(/Factory Session/i);
      expect(whatItIsSection?.textContent).toMatch(/live runtime/i);

      const limitsSection = document.getElementById("limits-and-assumptions");
      expect(limitsSection?.textContent).toMatch(/Factory Sessions reference/i);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
