/**
 * Page-owned render proof for references/mock-workers-schema.
 * Asserts route presence, SchemaReference success markers, pagePath ownership,
 * and explicit invalid status when acquisition fails — not W07 internals.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { source } from "@/lib/source";
import {
  MOCK_WORKERS_SCHEMA_PAGE_PATH,
  MockWorkersSchemaReference,
} from "./MockWorkersSchemaReference";

describe("mock-workers-schema reference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("publishes /docs/references/mock-workers-schema as a reference page", async () => {
    const fumadocsPage = source.getPage(["references", "mock-workers-schema"]);
    expect(fumadocsPage).toBeDefined();
    expect(fumadocsPage?.url).toBe("/docs/references/mock-workers-schema");

    const loadedPage = await loadLocalDocsPage({
      section: "references",
      slug: "mock-workers-schema",
    });

    expect(loadedPage.frontmatter.kind).toBe("reference");
    expect(loadedPage.frontmatter.registryId).toBe(
      "reference.mock-workers-schema",
    );
    expect(loadedPage.messages.title).toBe("Mock-workers schema");
    expect(loadedPage.messages.description).toMatch(
      /mock-worker configuration JSON Schema/i,
    );

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    expect(whatItCovers).toMatch(/live mock-worker configuration JSON Schema/i);
    expect(whatItCovers).not.toMatch(/on this page|Model Atlas/i);

    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );
    expect(limits).toMatch(/not.*authored Worker documentation/i);
    expect(limits).toMatch(/\/docs\/workers\/mock/i);

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

    const schemaSurface = screen.getByTestId("mock-workers-schema-reference");
    expect(schemaSurface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      schemaSurface.querySelector('[data-schema-field-path="mockWorkers"]'),
    ).toBeTruthy();
    expect(
      schemaSurface.querySelector(
        '[data-schema-field-path="unmatchedDispatchPolicy"]',
      ),
    ).toBeTruthy();

    const whatItCoversSection = document.getElementById("what-it-covers");
    expect(whatItCoversSection?.textContent ?? "").toMatch(
      /mock-worker configuration JSON Schema/i,
    );

    const factoryLink = screen.getByRole("link", {
      name: "Factory schema",
    });
    expect(factoryLink.getAttribute("href")).toBe(
      "/docs/references/factory-schema",
    );
    const youConfigLink = screen.getByRole("link", {
      name: "You-config schema",
    });
    expect(youConfigLink.getAttribute("href")).toBe(
      "/docs/references/you-config-schema",
    );

    expect(document.body.textContent ?? "").not.toMatch(/Model Atlas/i);
  });
});

describe("MockWorkersSchemaReference mount", () => {
  afterEach(() => {
    cleanup();
  });

  test("mounts complete-schema mode with stable pagePath for mock-workers schema", () => {
    render(<MockWorkersSchemaReference />);

    const surface = screen.getByTestId("mock-workers-schema-reference");
    expect(surface.getAttribute("data-schema-status")).toBe("ready");
    expect(
      surface.querySelector('[data-schema-reference-mode="complete"]'),
    ).toBeTruthy();

    const deepLink = surface.querySelector(
      `[data-schema-deep-link^="${MOCK_WORKERS_SCHEMA_PAGE_PATH}#"]`,
    );
    expect(deepLink).toBeTruthy();
    expect(
      surface.querySelector('[data-schema-field-path="mockWorkers"]'),
    ).toBeTruthy();
  });

  test("shows an accessible invalid status when schema acquisition fails", () => {
    render(
      <MockWorkersSchemaReference
        loadModel={() => {
          throw new Error("simulated mock-workers schema acquisition failure");
        }}
      />,
    );

    const surface = screen.getByTestId("mock-workers-schema-reference");
    const alert = screen.getByRole("alert");
    expect(surface.contains(alert)).toBe(true);
    expect(alert.getAttribute("data-schema-status")).toBe("invalid");
    expect(alert.textContent ?? "").toMatch(/Mock-workers schema unavailable/i);
    expect(alert.textContent ?? "").toMatch(
      /simulated mock-workers schema acquisition failure/i,
    );
  });
});
