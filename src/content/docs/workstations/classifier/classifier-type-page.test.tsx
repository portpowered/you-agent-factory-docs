/**
 * Page-owned proofs for /docs/workstations/classifier.
 * Covers CLASSIFIER_WORKSTATION discriminator, W07 overlay embed,
 * minimal/misuse examples, Worker + behavior companion links, logical-move
 * distinction — not route inventories or shared helper
 * contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsClassifierRegistry from "@/content/registry/documentation/workstations-classifier.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  CLASSIFIER_TYPE_OVERLAY_ID,
  CLASSIFIER_TYPE_PAGE_PATH,
  ClassifierTypeVariantSchemaEmbed,
} from "./ClassifierTypeVariantSchemaEmbed";
import {
  CLASSIFIER_TYPE_EXAMPLE_IDS,
  CLASSIFIER_TYPE_MINIMAL_EXAMPLE,
  CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE,
} from "./classifier-type-examples";

describe("workstations classifier type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-classifier registry record", () => {
    expect(workstationsClassifierRegistry.id).toBe(
      "documentation.workstations-classifier",
    );
    expect(workstationsClassifierRegistry.slug).toBe("workstations-classifier");
    expect(workstationsClassifierRegistry.kind).toBe("documentation");
    expect(workstationsClassifierRegistry.status).toBe("published");
  });

  test("loads isolation-first CLASSIFIER_WORKSTATION teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "classifier",
    });

    expect(loadedPage.messages.title).toBe("Classifier workstation");
    expect(loadedPage.messages.description).toMatch(
      /type = CLASSIFIER_WORKSTATION/i,
    );
    expect(loadedPage.messages.description).toMatch(/HOSTED_WORKER/i);
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
    expect(openingSummary).toMatch(/CLASSIFIER_WORKSTATION/i);
    expect(openingSummary).toMatch(/WorkstationType/i);
    expect(openingSummary).toMatch(/classificationRoutes/i);
    expect(openingSummary).toMatch(/LOGICAL_MOVE/i);
    expect(howToUse).toMatch(/type CLASSIFIER_WORKSTATION/i);
    expect(howToUse).toMatch(/HOSTED_WORKER/i);
    expect(howToUse).toMatch(/Do not set outputs/i);
    expect(howToUse).toMatch(/not a scheduling behavior/i);
    expect(howToUse).toMatch(/not LOGICAL_MOVE/i);
    expect(schemaReference).toMatch(
      /selects the exclusive classificationRoutes/i,
    );
    expect(schemaReference).toMatch(/excludes outputs/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/outputs/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production CLASSIFIER_WORKSTATION overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay(
      "CLASSIFIER_WORKSTATION",
    );
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(CLASSIFIER_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "CLASSIFIER_WORKSTATION",
    });
    expect(presentation.variantLabel).toBe("CLASSIFIER_WORKSTATION");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "classificationRoutes", applicability: "selected" },
        { path: "outputs", applicability: "excluded" },
        { path: "onContinue", applicability: "excluded" },
        { path: "onRejection", applicability: "excluded" },
        { path: "guards", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "promptFile", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "classificationRoutes")
        ?.applicability,
    ).toBe("selected");
    expect(overlay.companions.compatible).toContain("worker:HOSTED_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:CRON");
    expect(overlay.companions.required).toEqual(["worker:HOSTED_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      CLASSIFIER_TYPE_EXAMPLE_IDS.minimal,
      CLASSIFIER_TYPE_EXAMPLE_IDS.misuseOutputs,
    ]);
    expect(CLASSIFIER_TYPE_MINIMAL_EXAMPLE.type).toBe("CLASSIFIER_WORKSTATION");
    expect(CLASSIFIER_TYPE_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(CLASSIFIER_TYPE_MINIMAL_EXAMPLE).toHaveProperty(
      "classificationRoutes",
    );
    expect(CLASSIFIER_TYPE_MINIMAL_EXAMPLE).not.toHaveProperty("outputs");
    expect(CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE).toHaveProperty("outputs");
    expect(CLASSIFIER_TYPE_MISUSE_OUTPUTS_EXAMPLE.type).toBe(
      "CLASSIFIER_WORKSTATION",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "classifier",
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
          "Discriminator: type = CLASSIFIER_WORKSTATION",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-classifier-type-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      CLASSIFIER_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe(
      "CLASSIFIER_WORKSTATION",
    );
    expect(screen.getByTestId("classifier-type-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: CLASSIFIER_WORKSTATION")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "classifier-type-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", {
          name: "Workers family index (HOSTED_WORKER)",
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
      screen.getByText("Minimal valid CLASSIFIER_WORKSTATION workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Incompatible misuse — outputs on CLASSIFIER_WORKSTATION:",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-classifier-type-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-classifier-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "CLASSIFIER_WORKSTATION"');
    expect(
      examples?.querySelector('[data-classifier-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector('[data-classifier-type-example="minimal"]')
        ?.textContent,
    ).toContain('"classificationRoutes"');
    expect(
      examples?.querySelector('[data-classifier-type-example="misuse-outputs"]')
        ?.textContent,
    ).toContain('"outputs"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<ClassifierTypeVariantSchemaEmbed />);

    expect(html).toContain('data-classifier-type-schema-embed=""');
    expect(html).toContain(CLASSIFIER_TYPE_OVERLAY_ID);
    expect(html).toContain("CLASSIFIER_WORKSTATION");
    expect(html).toContain("classifier-type-variant-schema");
    expect(CLASSIFIER_TYPE_PAGE_PATH).toBe("/docs/workstations/classifier");
  });
});
