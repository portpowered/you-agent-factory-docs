/**
 * Page-owned proofs for /docs/workers/script.
 * Covers SCRIPT_WORKER discriminator, W07 overlay embed, minimal/misuse
 * examples, SCRIPT_RUN companion link, and operational cautions — not route
 * inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersScriptRegistry from "@/content/registry/documentation/workers-script.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  SCRIPT_WORKER_OVERLAY_ID,
  SCRIPT_WORKER_PAGE_PATH,
  ScriptWorkerVariantSchemaEmbed,
} from "./ScriptWorkerVariantSchemaEmbed";
import {
  SCRIPT_WORKER_EXAMPLE_IDS,
  SCRIPT_WORKER_MINIMAL_EXAMPLE,
  SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE,
} from "./script-worker-examples";

describe("workers script page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workers-script registry record", () => {
    expect(workersScriptRegistry.id).toBe("documentation.workers-script");
    expect(workersScriptRegistry.slug).toBe("workers-script");
    expect(workersScriptRegistry.kind).toBe("documentation");
    expect(workersScriptRegistry.status).toBe("published");
  });

  test("loads isolation-first SCRIPT_WORKER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "script",
    });

    expect(loadedPage.messages.title).toBe("Script worker");
    expect(loadedPage.messages.description).toMatch(/SCRIPT_WORKER/i);
    expect(loadedPage.messages.description).toMatch(/command/i);
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

    expect(whatItCovers).toMatch(/SCRIPT_WORKER/i);
    expect(whatItCovers).toMatch(/SCRIPT_RUN/i);
    expect(keyConcepts).toMatch(/type with value SCRIPT_WORKER/i);
    expect(keyConcepts).toMatch(/not executed/i);
    expect(howToUse).toMatch(/command and args/i);
    expect(howToUse).toMatch(/SCRIPT_RUN/i);
    expect(variantFields).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/model-routing|model,/i);
    expect(cautions).toMatch(/timeout|exit/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production SCRIPT_WORKER overlay into W07 presentation", () => {
    const overlay = createProductionWorkerOverlay("SCRIPT_WORKER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(SCRIPT_WORKER_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "SCRIPT_WORKER",
    });
    expect(presentation.variantLabel).toBe("SCRIPT_WORKER");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "command", applicability: "selected" },
        { path: "args", applicability: "selected" },
        { path: "executorProvider", applicability: "selected" },
        { path: "model", applicability: "excluded" },
        { path: "operations", applicability: "excluded" },
        { path: "agentTools", applicability: "excluded" },
      ]),
    );
    expect(overlay.companions.required).toContain("workstation:SCRIPT_RUN");
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      SCRIPT_WORKER_EXAMPLE_IDS.minimal,
      SCRIPT_WORKER_EXAMPLE_IDS.misuseModelFields,
    ]);
    expect(SCRIPT_WORKER_MINIMAL_EXAMPLE.type).toBe("SCRIPT_WORKER");
    expect(SCRIPT_WORKER_MINIMAL_EXAMPLE).toHaveProperty("command");
    expect(SCRIPT_WORKER_MINIMAL_EXAMPLE).toHaveProperty("args");
    expect(SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE).toHaveProperty("model");
    expect(SCRIPT_WORKER_MISUSE_MODEL_FIELDS_EXAMPLE).toHaveProperty(
      "modelProvider",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion link", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "script",
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
          "Discriminator: type = SCRIPT_WORKER",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-script-worker-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      SCRIPT_WORKER_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("SCRIPT_WORKER");
    expect(screen.getByTestId("script-worker-variant-schema")).toBeTruthy();
    expect(screen.getByText("Variant: SCRIPT_WORKER")).toBeTruthy();

    expect(
      screen
        .getByRole("link", { name: "Script-run workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/script-run");
    expect(
      screen
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");
    expect(
      screen
        .getByRole("link", { name: "Workers family index" })
        .getAttribute("href"),
    ).toBe("/docs/workers");

    expect(screen.getByText("Minimal valid SCRIPT_WORKER:")).toBeTruthy();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Incompatible misuse — model fields on SCRIPT_WORKER (rejected):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-script-worker-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-script-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "SCRIPT_WORKER"');
    expect(
      examples?.querySelector('[data-script-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"command"');
    expect(
      examples?.querySelector(
        '[data-script-worker-example="misuse-model-fields"]',
      )?.textContent,
    ).toContain('"model"');
    expect(
      examples?.querySelector(
        '[data-script-worker-example="misuse-model-fields"]',
      )?.textContent,
    ).toContain('"modelProvider"');

    const failureTable = document.querySelector(
      "[data-script-worker-failure-table]",
    );
    expect(failureTable).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("Body is not executed"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("Model-field substitution"),
    ).toBeTruthy();
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<ScriptWorkerVariantSchemaEmbed />);

    expect(html).toContain('data-script-worker-schema-embed=""');
    expect(html).toContain(SCRIPT_WORKER_OVERLAY_ID);
    expect(html).toContain("SCRIPT_WORKER");
    expect(html).toContain("script-worker-variant-schema");
    expect(SCRIPT_WORKER_PAGE_PATH).toBe("/docs/workers/script");
  });
});
