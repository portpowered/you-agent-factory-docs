/**
 * Page-owned render proof for references/javascript-runtime.
 * Covers reference shell and package-backed JavaScript runtime inventory mount.
 * Colocated under the page bundle.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { filterJavascriptSymbolsExcludingSharedSchemaDuplicates } from "@/features/references/javascript/javascript-shared-schema-presentation";
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

      // Intro chrome must stay absent (MCP #156 pattern): no What It Covers /
      // Key Concepts keys and no informational Opening summary body.
      expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
      expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
      expect(String(loadedPage.messages.openingSummary ?? "").trim()).toBe("");
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
        screen.queryByRole("heading", { name: "What It Covers" }),
      ).toBeNull();
      expect(
        screen.queryByRole("heading", { name: "Key Concepts" }),
      ).toBeNull();
      expect(document.getElementById("what-it-covers")).toBeNull();
      expect(document.getElementById("key-concepts")).toBeNull();
      expect(screen.queryByTestId("folded-summary")).toBeNull();
      expect(
        document.querySelector('[data-opening-summary="folded"]'),
      ).toBeNull();
      expect(
        screen.getByRole("heading", { name: "Symbol metadata glossary" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", {
          name: "How the JavaScript runtime works",
        }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { name: "Runtime Inventory" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { level: 2, name: "Symbols" }),
      ).toBeTruthy();
      expect(
        screen.getByRole("heading", { level: 2, name: "Shared schemas" }),
      ).toBeTruthy();
      expect(document.getElementById("how-the-runtime-works")).toBeTruthy();
      expect(document.getElementById("symbols")).toBeTruthy();
      expect(document.getElementById("shared-schemas")).toBeTruthy();
      expect(
        loadedPage.toc.some((item) => item.url === "#how-the-runtime-works"),
      ).toBe(true);
      expect(loadedPage.toc.some((item) => item.url === "#symbols")).toBe(true);
      expect(
        loadedPage.toc.some((item) => item.url === "#shared-schemas"),
      ).toBe(true);
      expect(
        loadedPage.toc.some(
          (item) => item.title === "Symbols" && item.url === "#symbols",
        ),
      ).toBe(true);
      expect(
        loadedPage.toc.some(
          (item) =>
            item.title === "Shared schemas" && item.url === "#shared-schemas",
        ),
      ).toBe(true);
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

      const overallExample = document.querySelector(
        "[data-javascript-runtime-overall-example]",
      );
      expect(overallExample).toBeTruthy();
      const overallExampleCode = document.querySelector(
        "[data-javascript-runtime-overall-example-code]",
      );
      expect(overallExampleCode).toBeTruthy();
      expect(overallExampleCode?.textContent ?? "").toContain('phase("draft")');
      expect(overallExampleCode?.textContent ?? "").toContain(
        "await agent.run",
      );
      expect(overallExampleCode?.textContent ?? "").toContain(
        "workflow.final({ ok: true",
      );
      expect(
        screen.getByText(/At script start the host binds Value symbols/i),
      ).toBeTruthy();
      expect(
        document.querySelector(
          '[data-javascript-runtime-overall-example-step="javascript.phase"]',
        ),
      ).toBeTruthy();
      expect(
        document.querySelector(
          '[data-javascript-runtime-overall-example-step="javascript.agent.run"]',
        ),
      ).toBeTruthy();
      expect(
        String(loadedPage.messages.sections?.howTheRuntimeWorks?.body ?? ""),
      ).toMatch(/javascript\.args and javascript\.meta/i);
      expect(
        String(loadedPage.messages.sections?.howTheRuntimeWorks?.body ?? ""),
      ).toMatch(/published call patterns/i);

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

      // Polished symbol/shared-schema chrome on the live package inventory.
      expect(
        document.querySelector(
          "[data-javascript-symbol-reference] [data-contract-source-badge]",
        ),
      ).toBeNull();
      expect(
        document.querySelector(
          "[data-javascript-symbol-reference] [data-source-artifact]",
        ),
      ).toBeNull();
      expect(
        document.querySelector(
          "[data-javascript-symbol-reference] [data-package-version]",
        ),
      ).toBeNull();
      expect(screen.queryByText("Family")).toBeNull();
      expect(screen.queryByText("Package version")).toBeNull();
      expect(screen.queryByText("Source artifact")).toBeNull();
      expect(screen.queryByText("Object policy")).toBeNull();
      expect(screen.queryByText("Name", { selector: "dt" })).toBeNull();
      expect(screen.queryByText("Title", { selector: "dt" })).toBeNull();
      expect(screen.queryByText("Type", { selector: "dt" })).toBeNull();

      const argsCard = document.querySelector(
        '[data-javascript-symbol-reference][data-javascript-symbol-path="args"]',
      );
      expect(argsCard).toBeTruthy();
      expect(
        argsCard?.querySelector(
          '[data-javascript-metadata-facet="kind"][data-javascript-metadata-value="value"]',
        ),
      ).toBeTruthy();
      expect(
        argsCard
          ?.querySelector('[data-javascript-metadata-facet="kind"]')
          ?.getAttribute("href"),
      ).toBe("#glossary-kind");
      expect(
        argsCard?.querySelector(
          '[data-javascript-metadata-facet="mutability"][data-javascript-metadata-value="mutable-object"]',
        ),
      ).toBeTruthy();
      expect(
        argsCard?.querySelector(
          '[data-javascript-metadata-facet="nullability"][data-javascript-metadata-value="non-null"]',
        ),
      ).toBeTruthy();
      expect(
        argsCard?.querySelector(
          '[data-javascript-metadata-facet="bindingLifecycle"][data-javascript-metadata-value="snapshot-at-bind"]',
        ),
      ).toBeTruthy();
      expect(
        argsCard?.querySelector("[data-reference-status-chrome]"),
      ).toBeTruthy();

      const logCard = document.querySelector(
        '[data-javascript-symbol-reference][data-javascript-symbol-path="log"]',
      );
      expect(logCard).toBeTruthy();
      expect(
        logCard?.querySelector(
          '[data-javascript-metadata-facet="kind"][data-javascript-metadata-value="function"]',
        ),
      ).toBeTruthy();
      expect(
        logCard
          ?.querySelector('[data-javascript-metadata-facet="kind"]')
          ?.getAttribute("href"),
      ).toBe("#glossary-kind");

      // Shared-schema duplicates stay out of Symbols (live package currently
      // has no overlap; still assert displayed count matches the filter).
      expect(
        document.querySelectorAll(
          "[data-javascript-symbols] [data-javascript-symbol-reference]",
        ).length,
      ).toBe(symbolsForDisplay.length);
      for (const schema of inventory.sharedSchemas) {
        expect(
          document.querySelector(
            `[data-javascript-symbols] [data-javascript-symbol-reference][id="${schema.id}"]`,
          ),
        ).toBeNull();
        expect(
          document.querySelector(
            `[data-javascript-shared-schemas] [data-javascript-shared-schema-id="${schema.id}"]`,
          ),
        ).toBeTruthy();
      }

      // Overall example step deep-links target published symbol anchors.
      for (const step of document.querySelectorAll(
        "[data-javascript-runtime-overall-example-step]",
      )) {
        const symbolPath = step.getAttribute(
          "data-javascript-runtime-overall-example-step",
        );
        expect(symbolPath).toBeTruthy();
        expect(
          inventory.symbols.some((symbol) => symbol.id === symbolPath),
        ).toBe(true);
        const link = step.querySelector(`a[href="#${symbolPath}"]`);
        expect(link).toBeTruthy();
      }

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
