/**
 * Page-owned proofs for /docs/workstations/cron.
 * Covers CRON discriminator, W07 overlay embed, minimal/misuse
 * examples, WorkstationType companion links, and failure cautions — not
 * route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsCronRegistry from "@/content/registry/documentation/workstations-cron.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  CRON_BEHAVIOR_OVERLAY_ID,
  CRON_BEHAVIOR_PAGE_PATH,
  CronBehaviorVariantSchemaEmbed,
} from "./CronBehaviorVariantSchemaEmbed";
import {
  CRON_BEHAVIOR_EXAMPLE_IDS,
  CRON_BEHAVIOR_MINIMAL_EXAMPLE,
  CRON_BEHAVIOR_MISUSE_MISSING_CRON_EXAMPLE,
} from "./cron-behavior-examples";

describe("workstations cron behavior page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-cron registry record", () => {
    expect(workstationsCronRegistry.id).toBe("documentation.workstations-cron");
    expect(workstationsCronRegistry.slug).toBe("workstations-cron");
    expect(workstationsCronRegistry.kind).toBe("documentation");
    expect(workstationsCronRegistry.status).toBe("published");
  });

  test("loads isolation-first CRON teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "cron",
    });

    expect(loadedPage.messages.title).toBe("Cron behavior");
    expect(loadedPage.messages.description).toMatch(/behavior = CRON/i);
    expect(loadedPage.messages.description).toMatch(/schedule/i);
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
    expect(openingSummary).toMatch(/CRON/i);
    expect(openingSummary).toMatch(/WorkstationKind/i);
    expect(openingSummary).toMatch(/schedule/i);
    expect(howToUse).toMatch(/behavior CRON/i);
    expect(howToUse).toMatch(/cron expression/i);
    expect(howToUse).toMatch(/guards/i);
    expect(howToUse).toMatch(/not STANDARD/i);
    expect(schemaReference).toMatch(/selects the cron field/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/without cron/i);
    expect(cautions).toMatch(/cron is missing/i);
    expect(cautions).toMatch(/guards block dispatch/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/Compatible WorkstationType companions/i);
    expect(limits).not.toMatch(/planned|without authoring/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production CRON overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationBehaviorOverlay("CRON");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(CRON_BEHAVIOR_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "behavior",
      value: "CRON",
    });
    expect(presentation.variantLabel).toBe("CRON");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "cron", applicability: "selected" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "classificationRoutes", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "cron")?.applicability,
    ).toBe("selected");
    expect(overlay.companions.compatible).toContain("workstation:AGENT_RUN");
    expect(overlay.companions.required).toEqual([]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      CRON_BEHAVIOR_EXAMPLE_IDS.minimal,
      CRON_BEHAVIOR_EXAMPLE_IDS.misuseMissingCron,
    ]);
    expect(CRON_BEHAVIOR_MINIMAL_EXAMPLE.behavior).toBe("CRON");
    expect(CRON_BEHAVIOR_MINIMAL_EXAMPLE).toHaveProperty("cron");
    expect(CRON_BEHAVIOR_MISUSE_MISSING_CRON_EXAMPLE).not.toHaveProperty(
      "cron",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "cron",
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
          "Discriminator: behavior = CRON",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-cron-behavior-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      CRON_BEHAVIOR_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("CRON");
    expect(screen.getByTestId("cron-behavior-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: CRON")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "cron-behavior-variant-schema-definition",
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
      screen
        .getByRole("link", { name: "Repeater behavior" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/repeater");

    expect(screen.getByText("Minimal valid CRON workstation:")).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — CRON without cron (required):"),
    ).toBeTruthy();
    const examples = document.querySelector("[data-cron-behavior-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-cron-behavior-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "CRON"');
    expect(
      examples?.querySelector('[data-cron-behavior-example="minimal"]')
        ?.textContent,
    ).toContain('"cron":');
    expect(
      examples?.querySelector(
        '[data-cron-behavior-example="misuse-missing-cron"]',
      )?.textContent,
    ).toContain('"behavior": "CRON"');
    expect(
      examples?.querySelector(
        '[data-cron-behavior-example="misuse-missing-cron"]',
      )?.textContent,
    ).not.toContain('"cron"');

    const failureTable = document.querySelector(
      "[data-cron-behavior-failure-table]",
    );
    expect(failureTable).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("cron_missing"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("schedule_invalid"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("guard_blocked"),
    ).toBeTruthy();
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<CronBehaviorVariantSchemaEmbed />);

    expect(html).toContain('data-cron-behavior-schema-embed=""');
    expect(html).toContain(CRON_BEHAVIOR_OVERLAY_ID);
    expect(html).toContain("CRON");
    expect(html).toContain("cron-behavior-variant-schema");
    expect(CRON_BEHAVIOR_PAGE_PATH).toBe("/docs/workstations/cron");
  });
});
