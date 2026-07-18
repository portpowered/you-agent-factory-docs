/**
 * Page-owned render proof for references/you-config-schema.
 * Asserts route presence, SchemaReference success markers, pagePath ownership,
 * and explicit invalid status when acquisition fails — not W07 internals.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";
import {
  YOU_CONFIG_SCHEMA_PAGE_PATH,
  YouConfigSchemaReference,
} from "./YouConfigSchemaReference";

describe("you-config-schema reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/references/you-config-schema as a reference page", async () => {
    const fumadocsPage = source.getPage(["references", "you-config-schema"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/references/you-config-schema");

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "you-config-schema",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe(
      "reference.you-config-schema",
    );
    expect(loadedPage.messages.title).toBe("You-config schema");
    expect(loadedPage.messages.description).toMatch(
      /You operator and system configuration JSON Schema/i,
    );

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    expect(whatItCovers).toMatch(
      /live You operator and system configuration JSON Schema/i,
    );
    expect(whatItCovers).not.toMatch(/on this page|Model Atlas/i);

    render(
      <main>
        <DocsPageProviders
          assets={loadedPage.assets}
          messages={loadedPage.messages}
        >
          {loadedPage.content}
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Schema Lookup" })).toBeTruthy();

    const schemaSurface = screen.getByTestId("you-config-schema-reference");
    expect(schemaSurface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      schemaSurface.querySelector('[data-schema-field-path="backendScopeID"]'),
    ).toBeTruthy();
    expect(
      schemaSurface.querySelector('[data-schema-field-path="defaults"]'),
    ).toBeTruthy();
    expect(
      schemaSurface.querySelector('[data-schema-field-path="workerPresets"]'),
    ).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    expect(whatItCoversSection?.textContent ?? "").toMatch(
      /You operator and system configuration JSON Schema/i,
    );

    const factoryLink = screen.getByRole("link", {
      name: "Factory schema",
    });
    expect(factoryLink.getAttribute("href")).toBe(
      "/docs/references/factory-schema",
    );
    const mockWorkersLink = screen.getByRole("link", {
      name: "Mock-workers schema",
    });
    expect(mockWorkersLink.getAttribute("href")).toBe(
      "/docs/references/mock-workers-schema",
    );

    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});

describe("YouConfigSchemaReference mount", () => {
  afterEach(() => {
    cleanup();
  });

  test("mounts complete-schema mode with stable pagePath for you-config schema", () => {
    render(<YouConfigSchemaReference />);

    const surface = screen.getByTestId("you-config-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      surface.querySelector('[data-schema-reference-mode="complete"]'),
    ).toBeTruthy();

    // You-config root fields expose pagePath ownership via breadcrumb deep-link
    // attributes (fewer $ref <a> links than the Factory schema surface).
    const deepLink = surface.querySelector(
      `[data-schema-deep-link^="${YOU_CONFIG_SCHEMA_PAGE_PATH}#"]`,
    );
    expect(deepLink).toBeTruthy();
    expect(
      surface.querySelector('[data-schema-field-path="backendScopeID"]'),
    ).toBeTruthy();
  });

  test("shows an accessible invalid status when schema acquisition fails", () => {
    render(
      <YouConfigSchemaReference
        loadModel={() => {
          throw new Error("simulated you-config schema acquisition failure");
        }}
      />,
    );

    const surface = screen.getByTestId("you-config-schema-reference");
    const alert = screen.getByRole("alert");
    expect(surface.contains(alert)).toBe(true);
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
    expect(alert.textContent ?? "").toMatch(/You-config schema unavailable/i);
    expect(alert.textContent ?? "").toMatch(
      /simulated you-config schema acquisition failure/i,
    );
  });
});
