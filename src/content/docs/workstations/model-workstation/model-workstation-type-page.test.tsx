/**
 * Page-owned proofs for /docs/workstations/model-workstation.
 * Covers MODEL_WORKSTATION discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links, model-invoke distinction, and
 * failure cautions — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsModelWorkstationRegistry from "@/content/registry/documentation/workstations-model-workstation.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  MODEL_WORKSTATION_TYPE_OVERLAY_ID,
  MODEL_WORKSTATION_TYPE_PAGE_PATH,
  ModelWorkstationTypeVariantSchemaEmbed,
} from "./ModelWorkstationTypeVariantSchemaEmbed";
import {
  MODEL_WORKSTATION_TYPE_EXAMPLE_IDS,
  MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE,
  MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE,
} from "./model-workstation-type-examples";

describe("workstations model-workstation type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-model-workstation registry record", () => {
    expect(workstationsModelWorkstationRegistry.id).toBe(
      "documentation.workstations-model-workstation",
    );
    expect(workstationsModelWorkstationRegistry.slug).toBe(
      "workstations-model-workstation",
    );
    expect(workstationsModelWorkstationRegistry.kind).toBe("documentation");
    expect(workstationsModelWorkstationRegistry.status).toBe("published");
  });

  test("loads isolation-first MODEL_WORKSTATION teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "model-workstation",
    });

    expect(loadedPage.messages.title).toBe("Model-workstation type");
    expect(loadedPage.messages.description).toMatch(
      /type = MODEL_WORKSTATION/i,
    );
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

    expect(whatItCovers).toMatch(/type = MODEL_WORKSTATION/i);
    expect(whatItCovers).toMatch(/WorkstationType/i);
    expect(whatItCovers).toMatch(/promptFile/i);
    expect(whatItCovers).toMatch(/MODEL_WORKER/i);
    expect(whatItCovers).toMatch(/outcomeFormat/i);
    expect(keyConcepts).toMatch(/type with value MODEL_WORKSTATION/i);
    expect(keyConcepts).toMatch(/not a scheduling behavior/i);
    expect(keyConcepts).toMatch(/not MODEL_INVOKE/i);
    expect(howToUse).toMatch(/type MODEL_WORKSTATION/i);
    expect(howToUse).toMatch(/MODEL_WORKER/i);
    expect(howToUse).toMatch(/Do not set operation/i);
    expect(variantFields).toMatch(/selects the exclusive promptFile/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/operation/i);
    expect(cautions).toMatch(/MODEL_WORKER/i);
    expect(cautions).toMatch(/Do not use operation/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the MODEL_INVOKE type guide/i);
    expect(limits).not.toMatch(/planned|without authoring/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production MODEL_WORKSTATION overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay("MODEL_WORKSTATION");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(MODEL_WORKSTATION_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "MODEL_WORKSTATION",
    });
    expect(presentation.variantLabel).toBe("MODEL_WORKSTATION");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "promptFile", applicability: "selected" },
        { path: "outcomeFormat", applicability: "selected" },
        { path: "outputSchema", applicability: "selected" },
        { path: "stopWords", applicability: "selected" },
        { path: "operation", applicability: "excluded" },
        { path: "operationBindings", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "promptFile")
        ?.applicability,
    ).toBe("selected");
    expect(overlay.companions.compatible).toContain("worker:MODEL_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:CRON");
    expect(overlay.companions.required).toEqual(["worker:MODEL_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      MODEL_WORKSTATION_TYPE_EXAMPLE_IDS.minimal,
      MODEL_WORKSTATION_TYPE_EXAMPLE_IDS.misuseOperation,
    ]);
    expect(MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE.type).toBe(
      "MODEL_WORKSTATION",
    );
    expect(MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE).toHaveProperty("promptFile");
    expect(MODEL_WORKSTATION_TYPE_MINIMAL_EXAMPLE).toHaveProperty(
      "outcomeFormat",
    );
    expect(MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE).toHaveProperty(
      "operation",
    );
    expect(MODEL_WORKSTATION_TYPE_MISUSE_OPERATION_EXAMPLE.type).toBe(
      "MODEL_WORKSTATION",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "model-workstation",
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
          "Discriminator: type = MODEL_WORKSTATION",
      ),
    ).toBeTruthy();

    const embed = document.querySelector(
      "[data-model-workstation-type-schema-embed]",
    );
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      MODEL_WORKSTATION_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("MODEL_WORKSTATION");
    expect(
      screen.getByTestId("model-workstation-type-variant-schema"),
    ).toBeTruthy();
    expect(screen.getByText("Variant: MODEL_WORKSTATION")).toBeTruthy();

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
        .getByRole("link", { name: "Model-invoke type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/model-invoke");
    expect(
      screen
        .getByRole("link", { name: "Inference-run type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");

    expect(
      screen.getByText("Minimal valid MODEL_WORKSTATION workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — operation on MODEL_WORKSTATION:"),
    ).toBeTruthy();
    const examples = document.querySelector(
      "[data-model-workstation-type-examples]",
    );
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-model-workstation-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "MODEL_WORKSTATION"');
    expect(
      examples?.querySelector('[data-model-workstation-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector('[data-model-workstation-type-example="minimal"]')
        ?.textContent,
    ).toContain('"promptFile"');
    expect(
      examples?.querySelector(
        '[data-model-workstation-type-example="misuse-operation"]',
      )?.textContent,
    ).toContain('"operation"');

    const failureTable = document.querySelector(
      "[data-model-workstation-type-failure-table]",
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
        "operation_on_model_workstation",
      ),
    ).toBeTruthy();
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(
      <ModelWorkstationTypeVariantSchemaEmbed />,
    );

    expect(html).toContain('data-model-workstation-type-schema-embed=""');
    expect(html).toContain(MODEL_WORKSTATION_TYPE_OVERLAY_ID);
    expect(html).toContain("MODEL_WORKSTATION");
    expect(html).toContain("model-workstation-type-variant-schema");
    expect(MODEL_WORKSTATION_TYPE_PAGE_PATH).toBe(
      "/docs/workstations/model-workstation",
    );
  });
});
