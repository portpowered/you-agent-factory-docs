/**
 * Page-owned proofs for /docs/workstations/model-invoke.
 * Covers MODEL_INVOKE discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links, model-workstation distinction,
 * and failure cautions — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
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

    expect(loadedPage.messages.title).toBe("Model-invoke type");
    expect(loadedPage.messages.description).toMatch(/type = MODEL_INVOKE/i);
    expect(loadedPage.messages.description).toMatch(/MODEL_WORKER/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const variantFields = String(
      loadedPage.messages.sections?.variantFields?.body ?? "",
    );
    const examples = String(loadedPage.messages.sections?.examples?.body ?? "");
    const cautions = String(
      loadedPage.messages.sections?.operationalCautions?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/type = MODEL_INVOKE/i);
    expect(whatItCovers).toMatch(/WorkstationType/i);
    expect(whatItCovers).toMatch(/operation/i);
    expect(whatItCovers).toMatch(/MODEL_WORKER/i);
    expect(whatItCovers).toMatch(/operationBindings/i);
    expect(keyConcepts).toMatch(/type with value MODEL_INVOKE/i);
    expect(keyConcepts).toMatch(/not a scheduling behavior/i);
    expect(keyConcepts).toMatch(/not MODEL_WORKSTATION/i);
    expect(howToUse).toMatch(/type MODEL_INVOKE/i);
    expect(howToUse).toMatch(/MODEL_WORKER/i);
    expect(howToUse).toMatch(/Do not set promptFile/i);
    expect(variantFields).toMatch(/selects the exclusive operation/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/outcomeFormat/i);
    expect(cautions).toMatch(/MODEL_WORKER/i);
    expect(cautions).toMatch(/Do not use outcomeFormat/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the MODEL_WORKSTATION type guide/i);
    expect(limits).not.toMatch(/planned|without authoring/i);
    expect(whatItCovers).not.toMatch(
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
      screen.getByRole("heading", { name: "What It Covers" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Key Concepts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Variant Fields" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Examples", level: 2 }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Operational Cautions" }),
    ).toBeTruthy();

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
    expect(screen.getByText("Variant: MODEL_INVOKE")).toBeTruthy();

    expect(
      screen
        .getByRole("link", {
          name: "Workers family index (MODEL_WORKER)",
        })
        .getAttribute("href"),
    ).toBe("/docs/workers");
    expect(
      screen
        .getByRole("link", { name: "Standard behavior" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/standard");
    expect(
      screen
        .getByRole("link", { name: "Repeater behavior" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/repeater");
    expect(
      screen.getByRole("link", { name: "Cron behavior" }).getAttribute("href"),
    ).toBe("/docs/workstations/cron");
    expect(
      screen
        .getByRole("link", { name: "Poller behavior" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/poller");
    expect(
      screen
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");
    expect(
      screen
        .getByRole("link", { name: "Workstations family index" })
        .getAttribute("href"),
    ).toBe("/docs/workstations");
    expect(
      screen
        .getByRole("link", { name: "Model-workstation type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/model-workstation");
    expect(
      screen
        .getByRole("link", { name: "Inference-run type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");

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

    const failureTable = document.querySelector(
      "[data-model-invoke-type-failure-table]",
    );
    expect(failureTable).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("worker_missing"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("worker_type_mismatch"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText(
        "outcome_format_on_model_invoke",
      ),
    ).toBeTruthy();
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
