/**
 * Page-owned proofs for /docs/workers/model.
 * Covers MODEL_WORKER discriminator, W07 overlay embed, minimal/misuse
 * examples, MODEL_WORKSTATION + MODEL_INVOKE companion links, and operational
 * cautions — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersModelRegistry from "@/content/registry/documentation/workers-model.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  MODEL_WORKER_OVERLAY_ID,
  MODEL_WORKER_PAGE_PATH,
  ModelWorkerVariantSchemaEmbed,
} from "./ModelWorkerVariantSchemaEmbed";
import {
  MODEL_WORKER_EXAMPLE_IDS,
  MODEL_WORKER_MINIMAL_EXAMPLE,
  MODEL_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
} from "./model-worker-examples";

describe("workers model page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workers-model registry record", () => {
    expect(workersModelRegistry.id).toBe("documentation.workers-model");
    expect(workersModelRegistry.slug).toBe("workers-model");
    expect(workersModelRegistry.kind).toBe("documentation");
    expect(workersModelRegistry.status).toBe("published");
  });

  test("loads isolation-first MODEL_WORKER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "model",
    });

    expect(loadedPage.messages.title).toBe("Model worker");
    expect(loadedPage.messages.description).toMatch(/MODEL_WORKER/i);
    expect(loadedPage.messages.description).toMatch(
      /modelLocality|operations|MODEL_WORKSTATION/i,
    );
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
    expect(openingSummary).toMatch(/MODEL_WORKER/i);
    expect(openingSummary).toMatch(/MODEL_WORKSTATION/i);
    expect(howToUse).toMatch(/modelLocality|operations/i);
    expect(howToUse).toMatch(/MODEL_WORKSTATION/i);
    expect(howToUse).toMatch(/INFERENCE_WORKER/i);
    expect(schemaReference).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/agentTools/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production MODEL_WORKER overlay into W07 presentation", () => {
    const overlay = createProductionWorkerOverlay("MODEL_WORKER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(MODEL_WORKER_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "MODEL_WORKER",
    });
    expect(presentation.variantLabel).toBe("MODEL_WORKER");
    // Shared paths stay unannotated in W07 presentation; selected is empty
    // for this legacy projection (capability fields live in shared).
    expect(overlay.fields.selected).toEqual([]);
    expect(overlay.fields.shared).toEqual(
      expect.arrayContaining([
        "model",
        "modelProvider",
        "operations",
        "modelLocality",
      ]),
    );
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "agentTools", applicability: "excluded" },
        { path: "command", applicability: "excluded" },
        { path: "provider", applicability: "excluded" },
      ]),
    );
    expect(overlay.companions.required).toContain(
      "workstation:MODEL_WORKSTATION",
    );
    expect(overlay.companions.compatible).toEqual(
      expect.arrayContaining([
        "workstation:MODEL_WORKSTATION",
        "workstation:MODEL_INVOKE",
      ]),
    );
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      MODEL_WORKER_EXAMPLE_IDS.minimal,
      MODEL_WORKER_EXAMPLE_IDS.misuseAgentTools,
    ]);
    expect(MODEL_WORKER_MINIMAL_EXAMPLE.type).toBe("MODEL_WORKER");
    expect(MODEL_WORKER_MINIMAL_EXAMPLE).toHaveProperty("modelLocality");
    expect(MODEL_WORKER_MINIMAL_EXAMPLE).toHaveProperty("operations");
    expect(MODEL_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE).toHaveProperty(
      "agentTools",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "model",
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
          "Discriminator: type = MODEL_WORKER",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-model-worker-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      MODEL_WORKER_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("MODEL_WORKER");
    expect(screen.getByTestId("model-worker-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: MODEL_WORKER")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "model-worker-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", { name: "Model workstation (MODEL_WORKSTATION)" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/model-workstation");
    expect(
      screen
        .getByRole("link", { name: "Model invoke (MODEL_INVOKE)" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/model-invoke");
    expect(
      screen
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");
    expect(
      screen.queryByRole("link", { name: "Workers family index" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.querySelector("section#related")).toBeNull();

    expect(screen.getByText("Minimal valid MODEL_WORKER:")).toBeTruthy();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Incompatible misuse — agentTools on MODEL_WORKER (rejected):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-model-worker-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-model-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "MODEL_WORKER"');
    expect(
      examples?.querySelector('[data-model-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"modelLocality"');
    expect(
      examples?.querySelector(
        '[data-model-worker-example="misuse-agent-tools"]',
      )?.textContent,
    ).toContain('"agentTools"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<ModelWorkerVariantSchemaEmbed />);

    expect(html).toContain('data-model-worker-schema-embed=""');
    expect(html).toContain(MODEL_WORKER_OVERLAY_ID);
    expect(html).toContain("MODEL_WORKER");
    expect(html).toContain("model-worker-variant-schema");
    expect(MODEL_WORKER_PAGE_PATH).toBe("/docs/workers/model");
  });
});
