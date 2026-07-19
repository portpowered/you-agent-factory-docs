/**
 * Page-owned proofs for /docs/workstations/script-run.
 * Covers SCRIPT_RUN discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links — not
 * route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsScriptRunRegistry from "@/content/registry/documentation/workstations-script-run.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  SCRIPT_RUN_TYPE_OVERLAY_ID,
  SCRIPT_RUN_TYPE_PAGE_PATH,
  ScriptRunTypeVariantSchemaEmbed,
} from "./ScriptRunTypeVariantSchemaEmbed";
import {
  SCRIPT_RUN_TYPE_EXAMPLE_IDS,
  SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE,
  SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE,
} from "./script-run-type-examples";

describe("workstations script-run type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-script-run registry record", () => {
    expect(workstationsScriptRunRegistry.id).toBe(
      "documentation.workstations-script-run",
    );
    expect(workstationsScriptRunRegistry.slug).toBe("workstations-script-run");
    expect(workstationsScriptRunRegistry.kind).toBe("documentation");
    expect(workstationsScriptRunRegistry.status).toBe("published");
  });

  test("loads isolation-first SCRIPT_RUN teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "script-run",
    });

    expect(loadedPage.messages.title).toBe("Script-run type");
    expect(loadedPage.messages.description).toMatch(/type = SCRIPT_RUN/i);
    expect(loadedPage.messages.description).toMatch(/SCRIPT_WORKER/i);
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
    expect(openingSummary).toMatch(/SCRIPT_RUN/i);
    expect(openingSummary).toMatch(/WorkstationType/i);
    expect(openingSummary).toMatch(/SCRIPT_WORKER/i);
    expect(howToUse).toMatch(/type SCRIPT_RUN/i);
    expect(howToUse).toMatch(/SCRIPT_WORKER/i);
    expect(howToUse).toMatch(/Do not set promptFile/i);
    expect(howToUse).toMatch(/not a scheduling behavior/i);
    expect(howToUse).toMatch(/not MODEL_WORKSTATION/i);
    expect(schemaReference).toMatch(/no selected exclusive fields/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/promptFile/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production SCRIPT_RUN overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay("SCRIPT_RUN");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(SCRIPT_RUN_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "SCRIPT_RUN",
    });
    expect(presentation.variantLabel).toBe("SCRIPT_RUN");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "promptFile", applicability: "excluded" },
        { path: "openCodeAgent", applicability: "excluded" },
        { path: "operation", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "promptFile")
        ?.applicability,
    ).toBe("excluded");
    expect(overlay.companions.compatible).toContain("worker:SCRIPT_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:CRON");
    expect(overlay.companions.required).toEqual(["worker:SCRIPT_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      SCRIPT_RUN_TYPE_EXAMPLE_IDS.minimal,
      SCRIPT_RUN_TYPE_EXAMPLE_IDS.misusePromptFile,
    ]);
    expect(SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE.type).toBe("SCRIPT_RUN");
    expect(SCRIPT_RUN_TYPE_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE).toHaveProperty(
      "promptFile",
    );
    expect(SCRIPT_RUN_TYPE_MISUSE_PROMPT_FILE_EXAMPLE.type).toBe("SCRIPT_RUN");
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "script-run",
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
          "Discriminator: type = SCRIPT_RUN",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-script-run-type-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      SCRIPT_RUN_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("SCRIPT_RUN");
    expect(screen.getByTestId("script-run-type-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: SCRIPT_RUN")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "script-run-type-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", {
          name: "Workers family index (SCRIPT_WORKER)",
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
        .getByRole("link", { name: "Inference-run type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");
    expect(
      screen.getByRole("link", { name: "Agent-run type" }).getAttribute("href"),
    ).toBe("/docs/workstations/agent-run");
    expect(
      screen
        .getByRole("link", { name: "Model-workstation type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/model-workstation");

    expect(
      screen.getByText("Minimal valid SCRIPT_RUN workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — promptFile on SCRIPT_RUN:"),
    ).toBeTruthy();
    const examples = document.querySelector("[data-script-run-type-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-script-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "SCRIPT_RUN"');
    expect(
      examples?.querySelector('[data-script-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector(
        '[data-script-run-type-example="misuse-prompt-file"]',
      )?.textContent,
    ).toContain('"promptFile"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<ScriptRunTypeVariantSchemaEmbed />);

    expect(html).toContain('data-script-run-type-schema-embed=""');
    expect(html).toContain(SCRIPT_RUN_TYPE_OVERLAY_ID);
    expect(html).toContain("SCRIPT_RUN");
    expect(html).toContain("script-run-type-variant-schema");
    expect(SCRIPT_RUN_TYPE_PAGE_PATH).toBe("/docs/workstations/script-run");
  });
});
