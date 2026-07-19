/**
 * Page-owned proofs for /docs/workstations/poller-run.
 * Covers POLLER_RUN discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links, POLLER axis distinction, and
 * — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsPollerRunRegistry from "@/content/registry/documentation/workstations-poller-run.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  POLLER_RUN_TYPE_OVERLAY_ID,
  POLLER_RUN_TYPE_PAGE_PATH,
  PollerRunTypeVariantSchemaEmbed,
} from "./PollerRunTypeVariantSchemaEmbed";
import {
  POLLER_RUN_TYPE_EXAMPLE_IDS,
  POLLER_RUN_TYPE_MINIMAL_EXAMPLE,
  POLLER_RUN_TYPE_MISUSE_POLLER_BEHAVIOR_COLLAPSE_EXAMPLE,
} from "./poller-run-type-examples";

describe("workstations poller-run type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-poller-run registry record", () => {
    expect(workstationsPollerRunRegistry.id).toBe(
      "documentation.workstations-poller-run",
    );
    expect(workstationsPollerRunRegistry.slug).toBe("workstations-poller-run");
    expect(workstationsPollerRunRegistry.kind).toBe("documentation");
    expect(workstationsPollerRunRegistry.status).toBe("published");
  });

  test("loads isolation-first POLLER_RUN teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "poller-run",
    });

    expect(loadedPage.messages.title).toBe("Poller-run type");
    expect(loadedPage.messages.description).toMatch(/type = POLLER_RUN/i);
    expect(loadedPage.messages.description).toMatch(/behavior = POLLER/i);
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
    expect(openingSummary).toMatch(/POLLER_RUN/i);
    expect(openingSummary).toMatch(/WorkstationType/i);
    expect(openingSummary).toMatch(/POLLER_WORKER/i);
    expect(openingSummary).toMatch(/behavior to POLLER/i);
    expect(howToUse).toMatch(/type POLLER_RUN/i);
    expect(howToUse).toMatch(/POLLER_WORKER/i);
    expect(howToUse).toMatch(/Do not put POLLER_RUN on the behavior field/i);
    expect(howToUse).toMatch(/not a scheduling behavior/i);
    expect(howToUse).toMatch(/POLLER is the WorkstationKind/i);
    expect(schemaReference).toMatch(/no selected exclusive fields/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/behavior POLLER/i);
    expect(examples).toMatch(/behavior field/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production POLLER_RUN overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay("POLLER_RUN");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(POLLER_RUN_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "POLLER_RUN",
    });
    expect(presentation.variantLabel).toBe("POLLER_RUN");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "promptFile", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(overlay.companions.compatible).toContain("worker:POLLER_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:POLLER");
    expect(overlay.companions.required).toEqual(["worker:POLLER_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      POLLER_RUN_TYPE_EXAMPLE_IDS.minimal,
      POLLER_RUN_TYPE_EXAMPLE_IDS.misusePollerBehaviorCollapse,
    ]);
    expect(POLLER_RUN_TYPE_MINIMAL_EXAMPLE.type).toBe("POLLER_RUN");
    expect(POLLER_RUN_TYPE_MINIMAL_EXAMPLE.behavior).toBe("POLLER");
    expect(
      POLLER_RUN_TYPE_MISUSE_POLLER_BEHAVIOR_COLLAPSE_EXAMPLE.behavior,
    ).toBe("POLLER_RUN");
    expect(POLLER_RUN_TYPE_MISUSE_POLLER_BEHAVIOR_COLLAPSE_EXAMPLE.type).toBe(
      "POLLER_RUN",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "poller-run",
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
          "Discriminator: type = POLLER_RUN",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /POLLER_RUN is a runtime type\. POLLER is scheduling behavior/i,
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-poller-run-type-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      POLLER_RUN_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("POLLER_RUN");
    expect(screen.getByTestId("poller-run-type-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: POLLER_RUN")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "poller-run-type-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", {
          name: "Workers family index (POLLER_WORKER)",
        })
        .getAttribute("href"),
    ).toBe("/docs/workers");
    expect(
      screen
        .getByRole("link", { name: "Poller behavior (behavior POLLER)" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/poller");
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
        .getByRole("link", { name: "Inference-run type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");
    expect(
      screen.getByRole("link", { name: "Agent-run type" }).getAttribute("href"),
    ).toBe("/docs/workstations/agent-run");
    expect(
      screen
        .getByRole("link", { name: "Script-run type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/script-run");

    expect(
      screen.getByText("Minimal valid POLLER_RUN workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Incompatible misuse — POLLER_RUN as behavior (axis collapse):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-poller-run-type-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-poller-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "POLLER_RUN"');
    expect(
      examples?.querySelector('[data-poller-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "POLLER"');
    expect(
      examples?.querySelector(
        '[data-poller-run-type-example="misuse-poller-behavior-collapse"]',
      )?.textContent,
    ).toContain('"behavior": "POLLER_RUN"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<PollerRunTypeVariantSchemaEmbed />);

    expect(html).toContain('data-poller-run-type-schema-embed=""');
    expect(html).toContain(POLLER_RUN_TYPE_OVERLAY_ID);
    expect(html).toContain("POLLER_RUN");
    expect(html).toContain("poller-run-type-variant-schema");
    expect(POLLER_RUN_TYPE_PAGE_PATH).toBe("/docs/workstations/poller-run");
  });
});
