/**
 * Page-owned render proof for references/factory-schema.
 * Asserts route presence, SchemaReference success markers, pagePath ownership,
 * and explicit invalid status when acquisition fails — not W07 internals.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";
import {
  FACTORY_SCHEMA_PAGE_PATH,
  FactorySchemaReference,
} from "./FactorySchemaReference";

describe("factory-schema reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/references/factory-schema as a reference page", async () => {
    const fumadocsPage = source.getPage(["references", "factory-schema"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/references/factory-schema");

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "factory-schema",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe("reference.factory-schema");
    expect(loadedPage.messages.title).toBe("Factory schema");
    expect(loadedPage.messages.description).toMatch(/Factory JSON Schema/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    expect(whatItCovers).toMatch(/live Factory JSON Schema/i);
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

    const schemaSurface = screen.getByTestId("factory-schema-reference");
    expect(schemaSurface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      schemaSurface.querySelector('[data-schema-field-path="workers"]'),
    ).toBeTruthy();
    expect(
      schemaSurface.querySelector('[data-schema-field-path="id"]'),
    ).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    expect(whatItCoversSection?.textContent ?? "").toMatch(
      /Factory JSON Schema/i,
    );

    const youConfigLink = screen.getByRole("link", {
      name: "You-config schema",
    });
    expect(youConfigLink.getAttribute("href")).toBe(
      "/docs/references/you-config-schema",
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

describe("FactorySchemaReference mount", () => {
  afterEach(() => {
    cleanup();
  });

  test("mounts complete-schema mode with stable pagePath for factory schema", () => {
    render(<FactorySchemaReference />);

    const surface = screen.getByTestId("factory-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      surface.querySelector('[data-schema-reference-mode="complete"]'),
    ).toBeTruthy();

    const deepLink = surface.querySelector(
      `a[href^="${FACTORY_SCHEMA_PAGE_PATH}#"]`,
    );
    expect(deepLink).toBeTruthy();
    expect(
      surface.querySelector('[data-schema-field-path="workers"]'),
    ).toBeTruthy();
  });

  test("shows an accessible invalid status when schema acquisition fails", () => {
    render(
      <FactorySchemaReference
        loadModel={() => {
          throw new Error("simulated factory schema acquisition failure");
        }}
      />,
    );

    const surface = screen.getByTestId("factory-schema-reference");
    const alert = screen.getByRole("alert");
    expect(surface.contains(alert)).toBe(true);
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
    expect(alert.textContent ?? "").toMatch(/Factory schema unavailable/i);
    expect(alert.textContent ?? "").toMatch(
      /simulated factory schema acquisition failure/i,
    );
  });
});
