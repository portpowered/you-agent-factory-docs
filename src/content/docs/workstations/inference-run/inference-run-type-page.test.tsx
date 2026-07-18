/**
 * Page-owned proofs for /docs/workstations/inference-run.
 * Covers INFERENCE_RUN discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links, and failure cautions — not
 * route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsInferenceRunRegistry from "@/content/registry/documentation/workstations-inference-run.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  INFERENCE_RUN_TYPE_OVERLAY_ID,
  INFERENCE_RUN_TYPE_PAGE_PATH,
  InferenceRunTypeVariantSchemaEmbed,
} from "./InferenceRunTypeVariantSchemaEmbed";
import {
  INFERENCE_RUN_TYPE_EXAMPLE_IDS,
  INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE,
  INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
} from "./inference-run-type-examples";

describe("workstations inference-run type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-inference-run registry record", () => {
    expect(workstationsInferenceRunRegistry.id).toBe(
      "documentation.workstations-inference-run",
    );
    expect(workstationsInferenceRunRegistry.slug).toBe(
      "workstations-inference-run",
    );
    expect(workstationsInferenceRunRegistry.kind).toBe("documentation");
    expect(workstationsInferenceRunRegistry.status).toBe("published");
  });

  test("loads isolation-first INFERENCE_RUN teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "inference-run",
    });

    expect(loadedPage.messages.title).toBe("Inference-run type");
    expect(loadedPage.messages.description).toMatch(/type = INFERENCE_RUN/i);
    expect(loadedPage.messages.description).toMatch(/INFERENCE_WORKER/i);
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

    expect(whatItCovers).toMatch(/type = INFERENCE_RUN/i);
    expect(whatItCovers).toMatch(/WorkstationType/i);
    expect(whatItCovers).toMatch(/inference harness dispatch/i);
    expect(whatItCovers).toMatch(/INFERENCE_WORKER/i);
    expect(keyConcepts).toMatch(/type with value INFERENCE_RUN/i);
    expect(keyConcepts).toMatch(/not a scheduling behavior/i);
    expect(keyConcepts).toMatch(/not CLASSIFIER_WORKSTATION/i);
    expect(howToUse).toMatch(/type INFERENCE_RUN/i);
    expect(howToUse).toMatch(/INFERENCE_WORKER/i);
    expect(howToUse).toMatch(/Do not set classificationRoutes/i);
    expect(variantFields).toMatch(/no selected exclusive fields/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/classificationRoutes/i);
    expect(cautions).toMatch(/INFERENCE_WORKER/i);
    expect(cautions).toMatch(/Do not use classificationRoutes/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the AGENT_RUN or CLASSIFIER_WORKSTATION/i);
    expect(limits).not.toMatch(/planned|without authoring/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production INFERENCE_RUN overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay("INFERENCE_RUN");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(INFERENCE_RUN_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "INFERENCE_RUN",
    });
    expect(presentation.variantLabel).toBe("INFERENCE_RUN");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "classificationRoutes", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "classificationRoutes")
        ?.applicability,
    ).toBe("excluded");
    expect(overlay.companions.compatible).toContain("worker:INFERENCE_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:CRON");
    expect(overlay.companions.required).toEqual(["worker:INFERENCE_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      INFERENCE_RUN_TYPE_EXAMPLE_IDS.minimal,
      INFERENCE_RUN_TYPE_EXAMPLE_IDS.misuseClassificationRoutes,
    ]);
    expect(INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE.type).toBe("INFERENCE_RUN");
    expect(INFERENCE_RUN_TYPE_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(
      INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
    ).toHaveProperty("classificationRoutes");
    expect(INFERENCE_RUN_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE.type).toBe(
      "INFERENCE_RUN",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "inference-run",
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
          "Discriminator: type = INFERENCE_RUN",
      ),
    ).toBeTruthy();

    const embed = document.querySelector(
      "[data-inference-run-type-schema-embed]",
    );
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      INFERENCE_RUN_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("INFERENCE_RUN");
    expect(
      screen.getByTestId("inference-run-type-variant-schema"),
    ).toBeTruthy();
    expect(screen.getByText("Variant: INFERENCE_RUN")).toBeTruthy();

    expect(
      screen
        .getByRole("link", {
          name: "Workers family index (INFERENCE_WORKER)",
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
      screen.getByRole("link", { name: "Agent-run type" }).getAttribute("href"),
    ).toBe("/docs/workstations/agent-run");
    expect(
      screen
        .getByRole("link", { name: "Classifier type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/classifier");

    expect(
      screen.getByText("Minimal valid INFERENCE_RUN workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Incompatible misuse — classificationRoutes on INFERENCE_RUN:",
      ),
    ).toBeTruthy();
    const examples = document.querySelector(
      "[data-inference-run-type-examples]",
    );
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-inference-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "INFERENCE_RUN"');
    expect(
      examples?.querySelector('[data-inference-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector(
        '[data-inference-run-type-example="misuse-classification-routes"]',
      )?.textContent,
    ).toContain('"classificationRoutes"');

    const failureTable = document.querySelector(
      "[data-inference-run-type-failure-table]",
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
        "classification_routes_on_inference",
      ),
    ).toBeTruthy();
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<InferenceRunTypeVariantSchemaEmbed />);

    expect(html).toContain('data-inference-run-type-schema-embed=""');
    expect(html).toContain(INFERENCE_RUN_TYPE_OVERLAY_ID);
    expect(html).toContain("INFERENCE_RUN");
    expect(html).toContain("inference-run-type-variant-schema");
    expect(INFERENCE_RUN_TYPE_PAGE_PATH).toBe(
      "/docs/workstations/inference-run",
    );
  });
});
