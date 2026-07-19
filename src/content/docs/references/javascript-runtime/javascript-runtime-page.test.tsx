/**
 * Page-owned render proof for references/javascript-runtime.
 * Covers reference shell and package-backed JavaScript runtime inventory mount.
 * Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { filterJavascriptSymbolsExcludingSharedSchemaDuplicates } from "@/components/references/javascript/javascript-shared-schema-presentation";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { loadJavascriptRuntimeReferenceInventory } from "@/lib/references/load-javascript-runtime-reference-inventory";
import { source } from "@/lib/source";

const PAGE_RENDER_TIMEOUT_MS = 30_000;

describe("javascript-runtime reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test(
    "publishes /docs/references/javascript-runtime as a package-backed JavaScript runtime inventory page",
    async () => {
      const fumadocsPage = source.getPage(["references", "javascript-runtime"]);
      expect(fumadocsPage).toBeDefined();
      expect(fumadocsPage?.url).toBe("/docs/references/javascript-runtime");

      const loadedPage = await loadLocalDocsPage({
        section: "references",
        slug: "javascript-runtime",
      });

      expect(loadedPage.frontmatter.kind).toBe("reference");
      expect(loadedPage.frontmatter.registryId).toBe(
        "reference.javascript-runtime",
      );
      expect(loadedPage.messages.title).toBe("JavaScript Runtime");
      expect(loadedPage.messages.description).toMatch(
        /package JavaScript runtime contract/i,
      );
      expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

      const whatItCovers = String(
        loadedPage.messages.sections?.whatItCovers?.body ?? "",
      );
      const keyConcepts = String(
        loadedPage.messages.sections?.keyConcepts?.body ?? "",
      );
      expect(whatItCovers).toMatch(
        /package-backed JavaScript runtime inventory/i,
      );
      expect(keyConcepts).toMatch(
        /@you-agent-factory\/api\/javascript\/runtime/i,
      );
      expect(keyConcepts).toMatch(/not from a page-local copy/i);
      expect(whatItCovers).not.toMatch(
        /on this page|Model Atlas|reader.?shortcut/i,
      );
      expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
      expect(
        loadedPage.messages.sections?.limitsAndAssumptions,
      ).toBeUndefined();
      expect(loadedPage.messages.sections?.related).toBeUndefined();
      expect(loadedPage.messages.sections?.tags).toBeUndefined();
      expect(loadedPage.messages.sections?.references).toBeUndefined();
      expect(loadedPage.messages.links).toBeUndefined();

      const inventory = loadJavascriptRuntimeReferenceInventory();
      expect(inventory.state).toBe("success");
      if (inventory.state !== "success") {
        return;
      }
      expect(inventory.symbols.length).toBeGreaterThan(3);
      expect(inventory.sharedSchemas.length).toBeGreaterThan(0);
      const symbolsForDisplay =
        filterJavascriptSymbolsExcludingSharedSchemaDuplicates(
          inventory.symbols,
          inventory.sharedSchemas,
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
      expect(
        screen.getByRole("heading", { name: "Symbol metadata glossary" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Runtime Inventory" }),
      ).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Limits And Assumptions" }),
      ).toBeNull();
      expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
      expect(document.getElementById("related")).toBeNull();

      const glossary = document.querySelector(
        "[data-javascript-symbol-metadata-glossary]",
      );
      expect(glossary).toBeTruthy();
      expect(document.getElementById("glossary-kind")).toBeTruthy();
      expect(document.getElementById("glossary-mutability")).toBeTruthy();
      expect(document.getElementById("glossary-nullability")).toBeTruthy();
      expect(
        document.getElementById("glossary-binding-lifecycle"),
      ).toBeTruthy();
      expect(screen.getByText(/A Value is a bound data binding/i)).toBeTruthy();
      expect(
        screen.getByText(/A function is a callable runtime helper/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/Snapshot at bind captures the value/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/Non-null means the published contract/i),
      ).toBeTruthy();
      expect(
        screen.getByText(/Mutable object means the binding exposes/i),
      ).toBeTruthy();
      expect(
        String(
          loadedPage.messages.sections?.symbolMetadataGlossary?.body ?? "",
        ),
      ).toMatch(/Value versus function/i);
      expect(
        String(
          loadedPage.messages.sections?.symbolMetadataGlossary?.body ?? "",
        ),
      ).toMatch(/glossary-backed pills/i);

      const inventoryRoot = document.querySelector(
        "[data-javascript-runtime-inventory]",
      );
      expect(inventoryRoot).toBeTruthy();
      expect(inventoryRoot?.getAttribute("data-inventory-state")).toBe(
        "success",
      );
      expect(
        Number(
          inventoryRoot?.getAttribute("data-javascript-symbol-count") ?? "0",
        ),
      ).toBe(symbolsForDisplay.length);
      expect(
        Number(
          inventoryRoot?.getAttribute("data-javascript-shared-schema-count") ??
            "0",
        ),
      ).toBe(inventory.sharedSchemas.length);
      expect(
        document.querySelectorAll("[data-javascript-shared-schema-reference]")
          .length,
      ).toBe(inventory.sharedSchemas.length);
      expect(
        document.querySelector(
          "[data-javascript-shared-schema-reference] [data-contract-source-badge]",
        ),
      ).toBeNull();
      expect(screen.queryByText("Schema id", { selector: "dt" })).toBeNull();

      expect(
        screen.getByText(
          /published JavaScript runtime items from the package contract/i,
        ),
      ).toBeTruthy();
      expect(screen.getAllByText("javascript.args").length).toBeGreaterThan(0);
    },
    PAGE_RENDER_TIMEOUT_MS,
  );
});
