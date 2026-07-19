/**
 * Page-owned proofs for /docs/workstations/repeater.
 * Covers REPEATER discriminator, W07 overlay embed, minimal/misuse
 * examples, WorkstationType companion links, and failure cautions — not
 * route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsRepeaterRegistry from "@/content/registry/documentation/workstations-repeater.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  REPEATER_BEHAVIOR_OVERLAY_ID,
  REPEATER_BEHAVIOR_PAGE_PATH,
  RepeaterBehaviorVariantSchemaEmbed,
} from "./RepeaterBehaviorVariantSchemaEmbed";
import {
  REPEATER_BEHAVIOR_EXAMPLE_IDS,
  REPEATER_BEHAVIOR_MINIMAL_EXAMPLE,
  REPEATER_BEHAVIOR_MISUSE_CRON_EXAMPLE,
} from "./repeater-behavior-examples";

describe("workstations repeater behavior page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-repeater registry record", () => {
    expect(workstationsRepeaterRegistry.id).toBe(
      "documentation.workstations-repeater",
    );
    expect(workstationsRepeaterRegistry.slug).toBe("workstations-repeater");
    expect(workstationsRepeaterRegistry.kind).toBe("documentation");
    expect(workstationsRepeaterRegistry.status).toBe("published");
  });

  test("loads isolation-first REPEATER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "repeater",
    });

    expect(loadedPage.messages.title).toBe("Repeater behavior");
    expect(loadedPage.messages.description).toMatch(/behavior = REPEATER/i);
    expect(loadedPage.messages.description).toMatch(/reloop/i);
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const openingSummary = String(loadedPage.messages.openingSummary ?? "");
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const schemaReference = String(
      loadedPage.messages.sections?.schemaReference?.body ?? "",
    );
    const examples = String(loadedPage.messages.sections?.examples?.body ?? "");
    const cautions = String(
      loadedPage.messages.sections?.operationalCautions?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(loadedPage.messages.sections?.whatItCovers).toBeUndefined();
    expect(loadedPage.messages.sections?.keyConcepts).toBeUndefined();
    expect(openingSummary).toMatch(/REPEATER/i);
    expect(openingSummary).toMatch(/WorkstationKind/i);
    expect(openingSummary).toMatch(/reloop/i);
    expect(howToUse).toMatch(/behavior REPEATER/i);
    expect(howToUse).toMatch(/Do not set cron/i);
    expect(howToUse).toMatch(/onRejection/i);
    expect(howToUse).toMatch(/not CRON/i);
    expect(schemaReference).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/cron/i);
    expect(cautions).toMatch(/reloop never terminates/i);
    expect(cautions).toMatch(/onRejection/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/Compatible WorkstationType companions/i);
    expect(limits).not.toMatch(/planned|without authoring/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production REPEATER overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationBehaviorOverlay("REPEATER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(REPEATER_BEHAVIOR_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "behavior",
      value: "REPEATER",
    });
    expect(presentation.variantLabel).toBe("REPEATER");
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
      REPEATER_BEHAVIOR_EXAMPLE_IDS.minimal,
      REPEATER_BEHAVIOR_EXAMPLE_IDS.misuseCron,
    ]);
    expect(REPEATER_BEHAVIOR_MINIMAL_EXAMPLE.behavior).toBe("REPEATER");
    expect(REPEATER_BEHAVIOR_MINIMAL_EXAMPLE).toHaveProperty("onRejection");
    expect(REPEATER_BEHAVIOR_MISUSE_CRON_EXAMPLE).toHaveProperty("cron");
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "repeater",
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
      screen.getByRole("heading", { name: "Operational Cautions" }),
    ).toBeTruthy();

    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Discriminator: behavior = REPEATER",
      ),
    ).toBeTruthy();

    const embed = document.querySelector(
      "[data-repeater-behavior-schema-embed]",
    );
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      REPEATER_BEHAVIOR_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("REPEATER");
    expect(screen.getByTestId("repeater-behavior-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: REPEATER")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "repeater-behavior-variant-schema-definition",
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
      screen
        .getByRole("link", { name: "Standard behavior" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/standard");

    expect(
      screen.getByText("Minimal valid REPEATER workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — cron on REPEATER (excluded):"),
    ).toBeTruthy();
    const examples = document.querySelector(
      "[data-repeater-behavior-examples]",
    );
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-repeater-behavior-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "REPEATER"');
    expect(
      examples?.querySelector('[data-repeater-behavior-example="minimal"]')
        ?.textContent,
    ).toContain('"onRejection"');
    expect(
      examples?.querySelector('[data-repeater-behavior-example="misuse-cron"]')
        ?.textContent,
    ).toContain('"cron":');

    const failureTable = document.querySelector(
      "[data-repeater-behavior-failure-table]",
    );
    expect(failureTable).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("cron_on_repeater"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("reloop_unbounded"),
    ).toBeTruthy();
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<RepeaterBehaviorVariantSchemaEmbed />);

    expect(html).toContain('data-repeater-behavior-schema-embed=""');
    expect(html).toContain(REPEATER_BEHAVIOR_OVERLAY_ID);
    expect(html).toContain("REPEATER");
    expect(html).toContain("repeater-behavior-variant-schema");
    expect(REPEATER_BEHAVIOR_PAGE_PATH).toBe("/docs/workstations/repeater");
  });
});
