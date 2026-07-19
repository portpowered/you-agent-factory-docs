/**
 * Page-owned proofs for /docs/workstations/logical-move.
 * Covers LOGICAL_MOVE discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links, classifier distinction,
 * — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsLogicalMoveRegistry from "@/content/registry/documentation/workstations-logical-move.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  LOGICAL_MOVE_TYPE_OVERLAY_ID,
  LOGICAL_MOVE_TYPE_PAGE_PATH,
  LogicalMoveTypeVariantSchemaEmbed,
} from "./LogicalMoveTypeVariantSchemaEmbed";
import {
  LOGICAL_MOVE_TYPE_EXAMPLE_IDS,
  LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE,
  LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
} from "./logical-move-type-examples";

describe("workstations logical-move type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-logical-move registry record", () => {
    expect(workstationsLogicalMoveRegistry.id).toBe(
      "documentation.workstations-logical-move",
    );
    expect(workstationsLogicalMoveRegistry.slug).toBe(
      "workstations-logical-move",
    );
    expect(workstationsLogicalMoveRegistry.kind).toBe("documentation");
    expect(workstationsLogicalMoveRegistry.status).toBe("published");
  });

  test("loads isolation-first LOGICAL_MOVE teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "logical-move",
    });

    expect(loadedPage.messages.title).toBe("Logical-move type");
    expect(loadedPage.messages.description).toMatch(/type = LOGICAL_MOVE/i);
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
    expect(openingSummary).toMatch(/LOGICAL_MOVE/i);
    expect(openingSummary).toMatch(/WorkstationType/i);
    expect(openingSummary).toMatch(/guards/i);
    expect(openingSummary).toMatch(/CLASSIFIER_WORKSTATION/i);
    expect(howToUse).toMatch(/type LOGICAL_MOVE/i);
    expect(howToUse).toMatch(/HOSTED_WORKER/i);
    expect(howToUse).toMatch(/Do not set classificationRoutes/i);
    expect(howToUse).toMatch(/not a scheduling behavior/i);
    expect(howToUse).toMatch(/not CLASSIFIER_WORKSTATION/i);
    expect(schemaReference).toMatch(/selects the exclusive guards/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/classificationRoutes/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production LOGICAL_MOVE overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay("LOGICAL_MOVE");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(LOGICAL_MOVE_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "LOGICAL_MOVE",
    });
    expect(presentation.variantLabel).toBe("LOGICAL_MOVE");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "guards", applicability: "selected" },
        { path: "classificationRoutes", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "promptFile", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "guards")
        ?.applicability,
    ).toBe("selected");
    expect(overlay.companions.compatible).toContain("worker:HOSTED_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:CRON");
    expect(overlay.companions.required).toEqual(["worker:HOSTED_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      LOGICAL_MOVE_TYPE_EXAMPLE_IDS.minimal,
      LOGICAL_MOVE_TYPE_EXAMPLE_IDS.misuseClassificationRoutes,
    ]);
    expect(LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE.type).toBe("LOGICAL_MOVE");
    expect(LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(LOGICAL_MOVE_TYPE_MINIMAL_EXAMPLE).toHaveProperty("guards");
    expect(
      LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE,
    ).toHaveProperty("classificationRoutes");
    expect(LOGICAL_MOVE_TYPE_MISUSE_CLASSIFICATION_ROUTES_EXAMPLE.type).toBe(
      "LOGICAL_MOVE",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "logical-move",
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

    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Discriminator: type = LOGICAL_MOVE",
      ),
    ).toBeTruthy();

    const embed = document.querySelector(
      "[data-logical-move-type-schema-embed]",
    );
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      LOGICAL_MOVE_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("LOGICAL_MOVE");
    expect(screen.getByTestId("logical-move-type-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: LOGICAL_MOVE")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "logical-move-type-variant-schema-definition",
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
        .getByRole("link", { name: "Classifier type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/classifier");
    expect(
      screen
        .getByRole("link", { name: "Inference-run type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");

    expect(
      screen.getByText("Minimal valid LOGICAL_MOVE workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Incompatible misuse — classificationRoutes on LOGICAL_MOVE:",
      ),
    ).toBeTruthy();
    const examples = document.querySelector(
      "[data-logical-move-type-examples]",
    );
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-logical-move-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "LOGICAL_MOVE"');
    expect(
      examples?.querySelector('[data-logical-move-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector('[data-logical-move-type-example="minimal"]')
        ?.textContent,
    ).toContain('"guards"');
    expect(
      examples?.querySelector(
        '[data-logical-move-type-example="misuse-classification-routes"]',
      )?.textContent,
    ).toContain('"classificationRoutes"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<LogicalMoveTypeVariantSchemaEmbed />);

    expect(html).toContain('data-logical-move-type-schema-embed=""');
    expect(html).toContain(LOGICAL_MOVE_TYPE_OVERLAY_ID);
    expect(html).toContain("LOGICAL_MOVE");
    expect(html).toContain("logical-move-type-variant-schema");
    expect(LOGICAL_MOVE_TYPE_PAGE_PATH).toBe("/docs/workstations/logical-move");
  });
});
