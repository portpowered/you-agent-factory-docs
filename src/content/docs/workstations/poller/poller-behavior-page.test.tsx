/**
 * Page-owned proofs for /docs/workstations/poller.
 * Covers POLLER discriminator, POLLER vs POLLER_RUN axis separation, W07
 * overlay embed, minimal/misuse examples, WorkstationType companion links,
 * — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsPollerRegistry from "@/content/registry/documentation/workstations-poller.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationBehaviorOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  POLLER_BEHAVIOR_OVERLAY_ID,
  POLLER_BEHAVIOR_PAGE_PATH,
  PollerBehaviorVariantSchemaEmbed,
} from "./PollerBehaviorVariantSchemaEmbed";
import {
  POLLER_BEHAVIOR_EXAMPLE_IDS,
  POLLER_BEHAVIOR_MINIMAL_EXAMPLE,
  POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE,
} from "./poller-behavior-examples";

describe("workstations poller behavior page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-poller registry record", () => {
    expect(workstationsPollerRegistry.id).toBe(
      "documentation.workstations-poller",
    );
    expect(workstationsPollerRegistry.slug).toBe("workstations-poller");
    expect(workstationsPollerRegistry.kind).toBe("documentation");
    expect(workstationsPollerRegistry.status).toBe("published");
  });

  test("loads isolation-first POLLER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "poller",
    });

    expect(loadedPage.messages.title).toBe("Poller workstation");
    expect(loadedPage.messages.description).toMatch(/behavior = POLLER/i);
    expect(loadedPage.messages.description).toMatch(/POLLER_RUN/i);
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
    expect(openingSummary).toMatch(/POLLER/i);
    expect(openingSummary).toMatch(/WorkstationKind/i);
    expect(openingSummary).toMatch(/long-lived poller/i);
    expect(openingSummary).toMatch(/POLLER_RUN/i);
    expect(howToUse).toMatch(/behavior POLLER/i);
    expect(howToUse).toMatch(/type POLLER_RUN/i);
    expect(howToUse).toMatch(/Do not set cron/i);
    expect(howToUse).toMatch(/not a WorkstationType/i);
    expect(howToUse).toMatch(/POLLER_RUN is the runtime type/i);
    expect(schemaReference).toMatch(/no selected exclusive fields/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/collapses the axes/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production POLLER overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationBehaviorOverlay("POLLER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(POLLER_BEHAVIOR_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "behavior",
      value: "POLLER",
    });
    expect(presentation.variantLabel).toBe("POLLER");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "cron", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "classificationRoutes", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "cron")?.applicability,
    ).toBe("excluded");
    expect(overlay.companions.compatible).toContain("workstation:POLLER_RUN");
    expect(overlay.companions.compatible).toContain("workstation:AGENT_RUN");
    expect(overlay.companions.required).toEqual([]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      POLLER_BEHAVIOR_EXAMPLE_IDS.minimal,
      POLLER_BEHAVIOR_EXAMPLE_IDS.misusePollerRunCollapse,
    ]);
    expect(POLLER_BEHAVIOR_MINIMAL_EXAMPLE.behavior).toBe("POLLER");
    expect(POLLER_BEHAVIOR_MINIMAL_EXAMPLE.type).toBe("POLLER_RUN");
    expect(POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE.type).toBe(
      "POLLER",
    );
    expect(
      POLLER_BEHAVIOR_MISUSE_POLLER_RUN_COLLAPSE_EXAMPLE.behavior,
    ).not.toBe("POLLER");
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "poller",
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
          "Discriminator: behavior = POLLER",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /POLLER is scheduling behavior\. POLLER_RUN is a runtime type/i,
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-poller-behavior-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      POLLER_BEHAVIOR_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("POLLER");
    expect(screen.getByTestId("poller-behavior-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: POLLER")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "poller-behavior-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", { name: "Poller-run workstation (type POLLER_RUN)" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/poller-run");
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

    expect(screen.getByText("Minimal valid POLLER workstation:")).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — POLLER as type (axis collapse):"),
    ).toBeTruthy();
    const examples = document.querySelector("[data-poller-behavior-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-poller-behavior-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "POLLER"');
    expect(
      examples?.querySelector('[data-poller-behavior-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "POLLER_RUN"');
    expect(
      examples?.querySelector(
        '[data-poller-behavior-example="misuse-poller-run-collapse"]',
      )?.textContent,
    ).toContain('"type": "POLLER"');
    expect(
      examples?.querySelector(
        '[data-poller-behavior-example="misuse-poller-run-collapse"]',
      )?.textContent,
    ).not.toContain('"behavior": "POLLER"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<PollerBehaviorVariantSchemaEmbed />);

    expect(html).toContain('data-poller-behavior-schema-embed=""');
    expect(html).toContain(POLLER_BEHAVIOR_OVERLAY_ID);
    expect(html).toContain("POLLER");
    expect(html).toContain("poller-behavior-variant-schema");
    expect(POLLER_BEHAVIOR_PAGE_PATH).toBe("/docs/workstations/poller");
  });
});
