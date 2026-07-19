/**
 * Page-owned render proof for references/system-config-schema.
 * Asserts route presence, SchemaReference success markers, pagePath ownership,
 * and explicit invalid status when acquisition fails — not W07 internals.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";
import {
  SYSTEM_CONFIG_SCHEMA_PAGE_PATH,
  SYSTEM_CONFIG_SCHEMA_ROOT_TITLE,
  SystemConfigSchemaReference,
} from "./SystemConfigSchemaReference";

describe("system-config-schema reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/references/system-config-schema as a reference page", async () => {
    const fumadocsPage = source.getPage(["references", "system-config-schema"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/references/system-config-schema");

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "system-config-schema",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe(
      "reference.system-config-schema",
    );
    expect(loadedPage.messages.title).toBe("System configuration schema");
    expect(loadedPage.messages.description).toMatch(
      /system configuration JSON Schema/i,
    );

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    const howToAccess = String(
      loadedPage.messages.sections?.howToAccess?.body ?? "",
    );
    expect(howToAccess).toMatch(/~\/\.you-agent-factory\/config\.json/);
    expect(howToAccess).toMatch(/you config init/);
    expect(howToAccess).not.toMatch(/on this page|Model Atlas|What It Covers/i);
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.tags).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();
    expect(loadedPage.messages.links).toBeUndefined();

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
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Local storage and access" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Schema Lookup" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "How To Use" })).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tags" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("what-it-covers")).toBeNull();

    const schemaSurface = screen.getByTestId("system-config-schema-reference");
    expect(schemaSurface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: SYSTEM_CONFIG_SCHEMA_ROOT_TITLE,
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", {
        name: /You operator and system configuration/i,
      }),
    ).toBeNull();
    expect(
      screen.queryByTestId("system-config-schema-reference-filter"),
    ).toBeNull();
    expect(
      schemaSurface.querySelector('[data-schema-filter="definitions"]'),
    ).toBeNull();
    expect(
      schemaSurface.querySelector('[data-schema-reference="catalog"]'),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Definitions" })).toBeNull();
    expect(
      schemaSurface.querySelector('[data-schema-field-path="backendScopeID"]'),
    ).toBeTruthy();
    expect(
      schemaSurface.querySelector('[data-schema-field-path="defaults"]'),
    ).toBeTruthy();
    expect(
      schemaSurface.querySelector('[data-schema-field-path="workerPresets"]'),
    ).toBeTruthy();

    const howToAccessSection = document.getElementById("how-to-access");
    expect(howToAccessSection?.textContent ?? "").toMatch(
      /~\/\.you-agent-factory\/config\.json/,
    );
    expect(howToAccessSection?.textContent ?? "").toMatch(/you config init/);

    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});

describe("SystemConfigSchemaReference mount", () => {
  afterEach(() => {
    cleanup();
  });

  test("mounts complete-schema mode with stable pagePath for system-config schema", () => {
    render(<SystemConfigSchemaReference />);

    const surface = screen.getByTestId("system-config-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      surface.querySelector('[data-schema-reference-mode="complete"]'),
    ).toBeTruthy();

    // Page-local display projection: clear System configuration root title,
    // not the upstream package title "You operator and system configuration".
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: SYSTEM_CONFIG_SCHEMA_ROOT_TITLE,
      }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", {
        name: /You operator and system configuration/i,
      }),
    ).toBeNull();
    expect(surface.textContent ?? "").not.toMatch(
      /You operator and system configuration/i,
    );

    // Page-local chrome trim: no filter-definitions list, no top-level catalog.
    expect(
      screen.queryByTestId("system-config-schema-reference-filter"),
    ).toBeNull();
    expect(
      surface.querySelector('[data-schema-filter="definitions"]'),
    ).toBeNull();
    expect(
      surface.querySelector('[data-schema-reference="catalog"]'),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Definitions" })).toBeNull();

    // System-config root fields expose pagePath ownership via breadcrumb deep-link
    // attributes (fewer $ref <a> links than the Factory schema surface).
    const deepLink = surface.querySelector(
      `[data-schema-deep-link^="${SYSTEM_CONFIG_SCHEMA_PAGE_PATH}#"]`,
    );
    expect(deepLink).toBeTruthy();
    expect(
      surface.querySelector('[data-schema-field-path="backendScopeID"]'),
    ).toBeTruthy();
    expect(
      surface.querySelector('[data-schema-field-path="defaults"]'),
    ).toBeTruthy();
    expect(
      surface.querySelector('[data-schema-field-path="workerPresets"]'),
    ).toBeTruthy();
  });

  test("shows an accessible invalid status when schema acquisition fails", () => {
    render(
      <SystemConfigSchemaReference
        loadModel={() => {
          throw new Error("simulated system-config schema acquisition failure");
        }}
      />,
    );

    const surface = screen.getByTestId("system-config-schema-reference");
    const alert = screen.getByRole("alert");
    expect(surface.contains(alert)).toBe(true);
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
    expect(alert.textContent ?? "").toMatch(
      /System configuration schema unavailable/i,
    );
    expect(alert.textContent ?? "").toMatch(
      /simulated system-config schema acquisition failure/i,
    );
  });
});
