/**
 * Page-owned render proof for factories/packaged.
 * Covers documentation shell, packaged discovery/identity/portability teaching,
 * live Factory name plus metadata/source schema embeds via W07 SchemaReference,
 * and full-reference lookup links. Colocated under the page bundle so
 * audit:canonical-page-surface stays within-budget for this factories lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("factories/packaged documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/factories/packaged with live Factory metadata/source embeds", async () => {
    const fumadocsPage = source.getPage(["factories", "packaged"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/factories/packaged");

    const loadedPage = await loadLocalDocsPage({
      section: "factories",
      slug: "packaged",
    });

    expect(loadedPage.frontmatter.registryId).toBe(
      "documentation.factories-packaged",
    );
    expect(loadedPage.frontmatter.kind).toBe("documentation");
    expect(loadedPage.messages.title).toBe("Packaged Factories");
    expect(loadedPage.messages.description).toMatch(/@you\/\*/i);
    expect(loadedPage.messages.description).toMatch(/you run --named/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);
    expect(loadedPage.messages.openingSummary).toMatch(/@you\/\*/i);
    expect(loadedPage.messages.openingSummary).toMatch(/materialize/i);
    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();

    const discovery = String(
      loadedPage.messages.sections?.discoveryAndResolution?.body ?? "",
    );
    const factoryNameSchema = String(
      loadedPage.messages.sections?.factoryNameSchema?.body ?? "",
    );
    const metadataSource = String(
      loadedPage.messages.sections?.metadataAndSourceSchema?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(discovery).toMatch(/project-local/i);
    expect(discovery).toMatch(/~\/\.you-agent-factory\/factories/);
    expect(factoryNameSchema).toMatch(/FactoryName/i);
    expect(metadataSource).toMatch(/metadata/i);
    expect(metadataSource).toMatch(/sourceDirectory/i);
    expect(howToUse).toMatch(/you run --named/i);
    expect(limits).toMatch(/not a sync of packaged CLI/i);
    expect(limits).toMatch(/schema and API reference/i);
    expect(metadataSource).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(howToUse).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);
    expect(limits).not.toMatch(/on this page|Model Atlas|reader.?shortcut/i);

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
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();
    expect(document.getElementById("key-concepts")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Discovery And Resolution" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Factory Name Identity" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Metadata And Source Fragments" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();

    const factoryNameEmbed = screen.getByTestId(
      "factories-packaged-factory-name-schema",
    );
    expect(factoryNameEmbed).toBeTruthy();
    expect(factoryNameEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      factoryNameEmbed.querySelector(
        '[data-schema-reference-mode="addressed"]',
      ),
    ).toBeTruthy();
    expect(
      factoryNameEmbed.querySelector(
        '[data-schema-reference-pointer="/$defs/FactoryName"]',
      ),
    ).toBeTruthy();

    const metadataSourceEmbed = screen.getByTestId(
      "factories-packaged-metadata-source-schema",
    );
    expect(metadataSourceEmbed).toBeTruthy();
    expect(metadataSourceEmbed.getAttribute("data-schema-status")).toBe(
      "ready",
    );
    expect(
      metadataSourceEmbed.querySelector('[data-schema-field-path="metadata"]'),
    ).toBeTruthy();
    expect(
      metadataSourceEmbed.querySelector(
        '[data-schema-field-path="sourceDirectory"]',
      ),
    ).toBeTruthy();
    expect(
      metadataSourceEmbed.querySelector('[data-schema-field-path="name"]'),
    ).toBeTruthy();

    expect(
      screen
        .getAllByRole("link", { name: "Full Factory schema" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/references/schema");
    expect(
      screen
        .getAllByRole("link", { name: "Factory API reference" })[0]
        ?.getAttribute("href"),
    ).toBe("/docs/references/api");
  });
});
