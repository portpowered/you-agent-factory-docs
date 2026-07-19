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

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.howToUse).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(loadedPage.messages.sections?.related).toBeUndefined();
    expect(loadedPage.messages.sections?.tags).toBeUndefined();
    expect(loadedPage.messages.sections?.references).toBeUndefined();
    expect(loadedPage.messages.links).toBeUndefined();

    const schemaLookup = String(
      loadedPage.messages.sections?.schemaLookup?.body ?? "",
    );
    expect(schemaLookup).toMatch(/mock-workers schema/i);
    expect(schemaLookup).not.toMatch(/Model Atlas/i);

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
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
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
    expect(document.getElementById("key-concepts")).toBeNull();

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
    expect(
      surface.querySelector(
        '[data-schema-field-path="unmatchedDispatchPolicy"]',
      ),
    ).toBeTruthy();

    // Recursive splay: nested mockWorker fields visible under mockWorkers
    // without opaque off-page $ref bounce.
    expect(
      surface.querySelector('[data-schema-field-path="mockWorkers[].runType"]'),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-field-path="mockWorkers[].workerName"]',
      ),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-field-path="mockWorkers[].rejectConfig"]',
      ),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-field-path="mockWorkers[].scriptConfig"]',
      ),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-field-path="mockWorkers[].workInputs"]',
      ),
    ).toBeTruthy();

    // On-page $defs catalog for dependent packaged shapes.
    expect(
      surface.querySelector('[data-schema-reference="catalog"]'),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-definition-pointer="/$defs/mockWorker"]',
      ),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-definition-pointer="/$defs/rejectConfig"]',
      ),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-definition-pointer="/$defs/scriptConfig"]',
      ),
    ).toBeTruthy();
    expect(
      surface.querySelector(
        '[data-schema-definition-pointer="/$defs/workInput"]',
      ),
    ).toBeTruthy();

    // Authored hermetic-looking configuration examples (schema-true keys).
    const examples = surface.querySelector('[data-schema-examples="present"]');
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector(
        '[data-schema-example-id="mock-workers-schema.minimal-accept"]',
      ),
    ).toBeTruthy();
    expect(
      examples?.querySelector(
        '[data-schema-example-id="mock-workers-schema.reject-with-policy"]',
      ),
    ).toBeTruthy();
    expect(examples?.textContent ?? "").toContain('"runType": "accept"');
    expect(examples?.textContent ?? "").toContain('"workerName": "reviewer"');
    expect(examples?.textContent ?? "").toContain('"runType": "reject"');
    expect(examples?.textContent ?? "").toContain(
      '"unmatchedDispatchPolicy": "passthrough"',
    );
    expect(
      examples?.querySelector('[data-schema-example="copy"]'),
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
