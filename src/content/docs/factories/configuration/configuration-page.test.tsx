/**
 * Page-owned render proof for factories/configuration.
 * Covers documentation shell, topology teaching, live Factory root schema
 * embed via W07 SchemaReference, and full-reference lookup links.
 * Colocated under the page bundle so audit:canonical-page-surface stays
 * within-budget for this factories documentation lane.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";

describe("factories/configuration documentation page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/factories/configuration with live Factory root schema embed", async () => {
    const fumadocsPage = source.getPage(["factories", "configuration"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/factories/configuration");

    const loadedPage = await loadLocalDocsPage({
      section: "factories",
      slug: "configuration",
    });

    expect(loadedPage.frontmatter.registryId).toBe(
      "documentation.factories-configuration",
    );
    expect(loadedPage.frontmatter.kind).toBe("documentation");
    expect(loadedPage.messages.title).toBe("Configuration");
    expect(loadedPage.messages.description).toContain("factory.json");
    expect(loadedPage.messages.description).toMatch(/topology/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const factoryRootSchema = String(
      loadedPage.messages.sections?.factoryRootSchema?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/factory\.json/i);
    expect(whatItCovers).toMatch(/topology/i);
    expect(keyConcepts).toMatch(/work types/i);
    expect(keyConcepts).toMatch(/workers/i);
    expect(keyConcepts).toMatch(/workstations/i);
    expect(factoryRootSchema).toMatch(/Factory schema/i);
    expect(factoryRootSchema).toMatch(/exhaustive/i);
    expect(howToUse).toMatch(/factory\.json/i);
    expect(limits).toMatch(/not a sync of packaged CLI/i);
    expect(limits).toMatch(/schema and API reference/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(keyConcepts).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
    expect(factoryRootSchema).not.toMatch(
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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "What Lives Where" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "How The Pieces Fit" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Factory Root Properties" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Minimal Factory" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related To" })).toBeTruthy();

    const schemaEmbed = screen.getByTestId(
      "factories-configuration-factory-root-schema",
    );
    expect(schemaEmbed).toBeTruthy();
    expect(schemaEmbed.getAttribute("data-schema-status")).toBe("ready");
    expect(
      schemaEmbed.querySelector('[data-schema-field-path="workTypes"]'),
    ).toBeTruthy();
    expect(
      schemaEmbed.querySelector('[data-schema-field-path="workers"]'),
    ).toBeTruthy();
    expect(
      schemaEmbed.querySelector('[data-schema-field-path="workstations"]'),
    ).toBeTruthy();
    expect(
      schemaEmbed.querySelector('[data-schema-field-path="resources"]'),
    ).toBeTruthy();

    const fullSchema = screen.getByRole("link", {
      name: "Full Factory schema",
    });
    const fullApi = screen.getByRole("link", {
      name: "Factory API reference",
    });
    expect(fullSchema.getAttribute("href")).toBe("/docs/references/schema");
    expect(fullApi.getAttribute("href")).toBe("/docs/references/api");

    expect(
      screen.getByRole("link", { name: "Workers" }).getAttribute("href"),
    ).toBe("/docs/documentation/workers");
    expect(
      screen.getByRole("link", { name: "Workstations" }).getAttribute("href"),
    ).toBe("/docs/documentation/workstations");
    expect(
      screen.getByRole("link", { name: "Resources" }).getAttribute("href"),
    ).toBe("/docs/documentation/resources");
  });
});
