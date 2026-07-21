/**
 * Page-owned proofs for /docs/workers/inference.
 * Covers INFERENCE_WORKER discriminator, W07 overlay embed, minimal/misuse
 * examples, INFERENCE_RUN companion link — not route
 * inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersInferenceRegistry from "@/content/registry/documentation/workers-inference.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  INFERENCE_WORKER_OVERLAY_ID,
  INFERENCE_WORKER_PAGE_PATH,
  InferenceWorkerVariantSchemaEmbed,
} from "./InferenceWorkerVariantSchemaEmbed";
import {
  INFERENCE_WORKER_EXAMPLE_IDS,
  INFERENCE_WORKER_MINIMAL_EXAMPLE,
  INFERENCE_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE,
} from "./inference-worker-examples";

describe("workers inference page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workers-inference registry record", () => {
    expect(workersInferenceRegistry.id).toBe("documentation.workers-inference");
    expect(workersInferenceRegistry.slug).toBe("workers-inference");
    expect(workersInferenceRegistry.kind).toBe("documentation");
    expect(workersInferenceRegistry.status).toBe("published");
  });

  test("loads isolation-first INFERENCE_WORKER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "inference",
    });

    expect(loadedPage.messages.title).toBe("Inference worker");
    expect(loadedPage.messages.description).toMatch(/INFERENCE_WORKER/i);
    expect(loadedPage.messages.description).toMatch(/operations/i);
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
    expect(openingSummary).toMatch(/INFERENCE_WORKER/i);
    expect(openingSummary).toMatch(/INFERENCE_RUN/i);
    expect(howToUse).toMatch(/model, modelProvider, and modelLocality/i);
    expect(howToUse).toMatch(/operations/i);
    expect(howToUse).toMatch(/not AGENT_WORKER/i);
    expect(schemaReference).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/agentTools/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production INFERENCE_WORKER overlay into W07 presentation", () => {
    const overlay = createProductionWorkerOverlay("INFERENCE_WORKER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(INFERENCE_WORKER_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "INFERENCE_WORKER",
    });
    expect(presentation.variantLabel).toBe("INFERENCE_WORKER");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "operations", applicability: "selected" },
        { path: "modelLocality", applicability: "selected" },
        { path: "agentTools", applicability: "excluded" },
        { path: "command", applicability: "excluded" },
      ]),
    );
    expect(overlay.companions.required).toContain("workstation:INFERENCE_RUN");
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      INFERENCE_WORKER_EXAMPLE_IDS.minimal,
      INFERENCE_WORKER_EXAMPLE_IDS.misuseAgentTools,
    ]);
    expect(INFERENCE_WORKER_MINIMAL_EXAMPLE.type).toBe("INFERENCE_WORKER");
    expect(INFERENCE_WORKER_MINIMAL_EXAMPLE).toHaveProperty("operations");
    expect(INFERENCE_WORKER_MISUSE_AGENT_TOOLS_EXAMPLE).toHaveProperty(
      "agentTools",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion link", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "inference",
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
          "Discriminator: type = INFERENCE_WORKER",
      ),
    ).toBeTruthy();

    const embed = document.querySelector(
      "[data-inference-worker-schema-embed]",
    );
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      INFERENCE_WORKER_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("INFERENCE_WORKER");
    expect(screen.getByTestId("inference-worker-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: INFERENCE_WORKER")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "inference-worker-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", { name: "Inference-run workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");
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
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(document.querySelector("[data-related-group]")).toBeNull();
    expect(screen.queryByTestId("curated-related-docs")).toBeNull();

    expect(screen.getByText("Minimal valid INFERENCE_WORKER:")).toBeTruthy();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Incompatible misuse — agentTools on INFERENCE_WORKER (rejected):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-inference-worker-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-inference-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "INFERENCE_WORKER"');
    expect(
      examples?.querySelector('[data-inference-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"operations"');
    expect(
      examples?.querySelector(
        '[data-inference-worker-example="misuse-agent-tools"]',
      )?.textContent,
    ).toContain('"agentTools"');
    expect(
      examples?.querySelector(
        '[data-inference-worker-example="misuse-agent-tools"]',
      )?.textContent,
    ).toContain('"ENABLED"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<InferenceWorkerVariantSchemaEmbed />);

    expect(html).toContain('data-inference-worker-schema-embed=""');
    expect(html).toContain(INFERENCE_WORKER_OVERLAY_ID);
    expect(html).toContain("INFERENCE_WORKER");
    expect(html).toContain("inference-worker-variant-schema");
    expect(INFERENCE_WORKER_PAGE_PATH).toBe("/docs/workers/inference");
  });
});
