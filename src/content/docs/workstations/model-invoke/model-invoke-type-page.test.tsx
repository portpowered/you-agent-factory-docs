/**
 * Page-owned proofs for /docs/workstations/model-invoke.
 * Covers MODEL_INVOKE discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links, model-workstation distinction,
 * — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsModelInvokeRegistry from "@/content/registry/documentation/workstations-model-invoke.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  MODEL_INVOKE_TYPE_OVERLAY_ID,
  MODEL_INVOKE_TYPE_PAGE_PATH,
  ModelInvokeTypeVariantSchemaEmbed,
} from "./ModelInvokeTypeVariantSchemaEmbed";
import {
  MODEL_INVOKE_TYPE_EXAMPLE_IDS,
  MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE,
  MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE,
} from "./model-invoke-type-examples";

describe("workstations model-invoke type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-model-invoke registry record", () => {
    expect(workstationsModelInvokeRegistry.id).toBe(
      "documentation.workstations-model-invoke",
    );
    expect(workstationsModelInvokeRegistry.slug).toBe(
      "workstations-model-invoke",
    );
    expect(workstationsModelInvokeRegistry.kind).toBe("documentation");
    expect(workstationsModelInvokeRegistry.status).toBe("published");
  });

  test("loads isolation-first MODEL_INVOKE teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "model-invoke",
    });

    expect(loadedPage.messages.title).toBe("Model-invoke workstation");
    expect(loadedPage.messages.description).toMatch(/type = MODEL_INVOKE/i);
    expect(loadedPage.messages.description).toMatch(/MODEL_WORKER/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const schemaReference = String(
      loadedPage.messages.sections?.schemaReference?.body ?? "",
    );
    const examples = String(loadedPage.messages.sections?.examples?.body ?? "");

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(loadedPage.messages.sections?.operationalCautions).toBeUndefined();
    expect(loadedPage.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(openingSummary).toMatch(/MODEL_INVOKE/i);
    expect(openingSummary).toMatch(/WorkstationType/i);
    expect(openingSummary).toMatch(/operation/i);
    expect(openingSummary).toMatch(/MODEL_WORKER/i);
    expect(openingSummary).toMatch(/operationBindings/i);
    expect(howToUse).toMatch(/type MODEL_INVOKE/i);
    expect(howToUse).toMatch(/MODEL_WORKER/i);
    expect(howToUse).toMatch(/Do not set promptFile/i);
    expect(howToUse).toMatch(/not a scheduling behavior/i);
    expect(howToUse).toMatch(/not MODEL_WORKSTATION/i);
    expect(schemaReference).toMatch(/selects the exclusive operation/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/outcomeFormat/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production MODEL_INVOKE overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay("MODEL_INVOKE");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(MODEL_INVOKE_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "MODEL_INVOKE",
    });
    expect(presentation.variantLabel).toBe("MODEL_INVOKE");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "operation", applicability: "selected" },
        { path: "operationBindings", applicability: "selected" },
        { path: "promptFile", applicability: "excluded" },
        { path: "outcomeFormat", applicability: "excluded" },
        { path: "outputSchema", applicability: "excluded" },
        { path: "stopWords", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "operation")
        ?.applicability,
    ).toBe("selected");
    expect(overlay.companions.compatible).toContain("worker:MODEL_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:CRON");
    expect(overlay.companions.required).toEqual(["worker:MODEL_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      MODEL_INVOKE_TYPE_EXAMPLE_IDS.minimal,
      MODEL_INVOKE_TYPE_EXAMPLE_IDS.misuseOutcomeFormat,
    ]);
    expect(MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE.type).toBe("MODEL_INVOKE");
    expect(MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE).toHaveProperty("operation");
    expect(MODEL_INVOKE_TYPE_MINIMAL_EXAMPLE).toHaveProperty(
      "operationBindings",
    );
    expect(MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE).toHaveProperty(
      "outcomeFormat",
    );
    expect(MODEL_INVOKE_TYPE_MISUSE_OUTCOME_FORMAT_EXAMPLE.type).toBe(
      "MODEL_INVOKE",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "model-invoke",
    });

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
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Schema reference" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Examples", level: 2 }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Operational Cautions" }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();

    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(document.querySelector("[data-related-group]")).toBeNull();
    expect(screen.queryByTestId("curated-related-docs")).toBeNull();

    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Discriminator: type = MODEL_INVOKE",
      ),
    ).toBeTruthy();

    const embed = document.querySelector(
      "[data-model-invoke-type-schema-embed]",
    );
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      MODEL_INVOKE_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("MODEL_INVOKE");
    expect(screen.getByTestId("model-invoke-type-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: MODEL_INVOKE")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "model-invoke-type-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", {
          name: "Workers family index (MODEL_WORKER)",
        })
        .getAttribute("href"),
    ).toBe("/docs/workers");
    expect(
      screen
        .getByRole("link", { name: "Standard workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/standard");
    expect(
      screen
        .getByRole("link", { name: "Repeater workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/repeater");
    expect(
      screen
        .getByRole("link", { name: "Cron workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/cron");
    expect(
      screen
        .getByRole("link", { name: "Poller workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/poller");
    expect(
      screen
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");

    expect(
      screen.getByText("Minimal valid MODEL_INVOKE workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — outcomeFormat on MODEL_INVOKE:"),
    ).toBeTruthy();
    const examples = document.querySelector(
      "[data-model-invoke-type-examples]",
    );
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-model-invoke-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "MODEL_INVOKE"');
    expect(
      examples?.querySelector('[data-model-invoke-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector('[data-model-invoke-type-example="minimal"]')
        ?.textContent,
    ).toContain('"operation"');
    expect(
      examples?.querySelector(
        '[data-model-invoke-type-example="misuse-outcome-format"]',
      )?.textContent,
    ).toContain('"outcomeFormat"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<ModelInvokeTypeVariantSchemaEmbed />);

    expect(html).toContain('data-model-invoke-type-schema-embed=""');
    expect(html).toContain(MODEL_INVOKE_TYPE_OVERLAY_ID);
    expect(html).toContain("MODEL_INVOKE");
    expect(html).toContain("model-invoke-type-variant-schema");
    expect(MODEL_INVOKE_TYPE_PAGE_PATH).toBe("/docs/workstations/model-invoke");
  });
});
