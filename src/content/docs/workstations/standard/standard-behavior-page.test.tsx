/**
 * Page-owned proofs for /docs/workstations/standard.
 * Covers STANDARD discriminator, W07 overlay embed, minimal/misuse
 * examples, WorkstationType companion links — not
 * route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsStandardRegistry from "@/content/registry/documentation/workstations-standard.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  STANDARD_BEHAVIOR_OVERLAY_ID,
  STANDARD_BEHAVIOR_PAGE_PATH,
  StandardBehaviorVariantSchemaEmbed,
} from "./StandardBehaviorVariantSchemaEmbed";
import {
  STANDARD_BEHAVIOR_EXAMPLE_IDS,
  STANDARD_BEHAVIOR_MINIMAL_EXAMPLE,
  STANDARD_BEHAVIOR_MISUSE_CRON_EXAMPLE,
} from "./standard-behavior-examples";

describe("workstations standard behavior page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-standard registry record", () => {
    expect(workstationsStandardRegistry.id).toBe(
      "documentation.workstations-standard",
    );
    expect(workstationsStandardRegistry.slug).toBe("workstations-standard");
    expect(workstationsStandardRegistry.kind).toBe("documentation");
    expect(workstationsStandardRegistry.status).toBe("published");
  });

  test("loads isolation-first STANDARD teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "standard",
    });

    expect(loadedPage.messages.title).toBe("Standard workstation");
    expect(loadedPage.messages.description).toMatch(/behavior = STANDARD/i);
    expect(loadedPage.messages.description).toMatch(/readiness/i);
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
    expect(openingSummary).toMatch(/STANDARD/i);
    expect(openingSummary).toMatch(/WorkstationKind/i);
    expect(howToUse).toMatch(/behavior STANDARD/i);
    expect(howToUse).toMatch(/Do not set cron/i);
    expect(howToUse).toMatch(/not CRON/i);
    expect(schemaReference).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/cron/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production STANDARD overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationBehaviorOverlay("STANDARD");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(STANDARD_BEHAVIOR_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "behavior",
      value: "STANDARD",
    });
    expect(presentation.variantLabel).toBe("STANDARD");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "cron", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "classificationRoutes", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
      ]),
    );
    expect(presentation.fields.some((field) => field.path === "cron")).toBe(
      true,
    );
    expect(overlay.companions.compatible).toContain("workstation:AGENT_RUN");
    expect(overlay.companions.required).toEqual([]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      STANDARD_BEHAVIOR_EXAMPLE_IDS.minimal,
      STANDARD_BEHAVIOR_EXAMPLE_IDS.misuseCron,
    ]);
    expect(STANDARD_BEHAVIOR_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(STANDARD_BEHAVIOR_MISUSE_CRON_EXAMPLE).toHaveProperty("cron");
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "standard",
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
          "Discriminator: behavior = STANDARD",
      ),
    ).toBeTruthy();

    const embed = document.querySelector(
      "[data-standard-behavior-schema-embed]",
    );
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      STANDARD_BEHAVIOR_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("STANDARD");
    expect(screen.getByTestId("standard-behavior-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: STANDARD")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "standard-behavior-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", { name: "Agent-run workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/agent-run");
    expect(
      screen
        .getByRole("link", { name: "Workers family index" })
        .getAttribute("href"),
    ).toBe("/docs/workers");
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
      screen.getByText("Minimal valid STANDARD workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — cron on STANDARD (excluded):"),
    ).toBeTruthy();
    const examples = document.querySelector(
      "[data-standard-behavior-examples]",
    );
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-standard-behavior-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector('[data-standard-behavior-example="misuse-cron"]')
        ?.textContent,
    ).toContain('"cron":');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<StandardBehaviorVariantSchemaEmbed />);

    expect(html).toContain('data-standard-behavior-schema-embed=""');
    expect(html).toContain(STANDARD_BEHAVIOR_OVERLAY_ID);
    expect(html).toContain("STANDARD");
    expect(html).toContain("standard-behavior-variant-schema");
    expect(STANDARD_BEHAVIOR_PAGE_PATH).toBe("/docs/workstations/standard");
  });
});
