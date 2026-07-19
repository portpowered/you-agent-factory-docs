/**
 * Page-owned proofs for /docs/workstations/agent-run.
 * Covers AGENT_RUN discriminator, W07 overlay embed, minimal/misuse
 * examples, Worker + behavior companion links, and failure cautions — not
 * route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsAgentRunRegistry from "@/content/registry/documentation/workstations-agent-run.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkstationTypeOverlay } from "@/lib/references/overlays/production-workstation-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  AGENT_RUN_TYPE_OVERLAY_ID,
  AGENT_RUN_TYPE_PAGE_PATH,
  AgentRunTypeVariantSchemaEmbed,
} from "./AgentRunTypeVariantSchemaEmbed";
import {
  AGENT_RUN_TYPE_EXAMPLE_IDS,
  AGENT_RUN_TYPE_MINIMAL_EXAMPLE,
  AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE,
} from "./agent-run-type-examples";

describe("workstations agent-run type page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workstations-agent-run registry record", () => {
    expect(workstationsAgentRunRegistry.id).toBe(
      "documentation.workstations-agent-run",
    );
    expect(workstationsAgentRunRegistry.slug).toBe("workstations-agent-run");
    expect(workstationsAgentRunRegistry.kind).toBe("documentation");
    expect(workstationsAgentRunRegistry.status).toBe("published");
  });

  test("loads isolation-first AGENT_RUN teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "agent-run",
    });

    expect(loadedPage.messages.title).toBe("Agent-run type");
    expect(loadedPage.messages.description).toMatch(/type = AGENT_RUN/i);
    expect(loadedPage.messages.description).toMatch(/AGENT_WORKER/i);
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
    expect(openingSummary).toMatch(/AGENT_RUN/i);
    expect(openingSummary).toMatch(/WorkstationType/i);
    expect(openingSummary).toMatch(/AGENT_WORKER/i);
    expect(openingSummary).toMatch(/openCodeAgent/i);
    expect(howToUse).toMatch(/type AGENT_RUN/i);
    expect(howToUse).toMatch(/AGENT_WORKER/i);
    expect(howToUse).toMatch(/Do not set operation/i);
    expect(howToUse).toMatch(/not a scheduling behavior/i);
    expect(howToUse).toMatch(/not MODEL_INVOKE/i);
    expect(schemaReference).toMatch(/selects the exclusive openCodeAgent/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/operation/i);
    expect(cautions).toMatch(/AGENT_WORKER/i);
    expect(cautions).toMatch(/Do not use operation/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(limits).toMatch(/not the INFERENCE_RUN or MODEL_INVOKE/i);
    expect(limits).not.toMatch(/planned|without authoring/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production AGENT_RUN overlay into W07 presentation", () => {
    const overlay = createProductionWorkstationTypeOverlay("AGENT_RUN");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(AGENT_RUN_TYPE_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "AGENT_RUN",
    });
    expect(presentation.variantLabel).toBe("AGENT_RUN");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "openCodeAgent", applicability: "selected" },
        { path: "operation", applicability: "excluded" },
        { path: "classificationRoutes", applicability: "excluded" },
        { path: "cron", applicability: "excluded" },
      ]),
    );
    expect(
      presentation.fields.find((field) => field.path === "openCodeAgent")
        ?.applicability,
    ).toBe("selected");
    expect(overlay.companions.compatible).toContain("worker:AGENT_WORKER");
    expect(overlay.companions.compatible).toContain("behavior:STANDARD");
    expect(overlay.companions.compatible).toContain("behavior:CRON");
    expect(overlay.companions.required).toEqual(["worker:AGENT_WORKER"]);
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      AGENT_RUN_TYPE_EXAMPLE_IDS.minimal,
      AGENT_RUN_TYPE_EXAMPLE_IDS.misuseOperation,
    ]);
    expect(AGENT_RUN_TYPE_MINIMAL_EXAMPLE.type).toBe("AGENT_RUN");
    expect(AGENT_RUN_TYPE_MINIMAL_EXAMPLE.behavior).toBe("STANDARD");
    expect(AGENT_RUN_TYPE_MINIMAL_EXAMPLE).toHaveProperty("openCodeAgent");
    expect(AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE).toHaveProperty("operation");
    expect(AGENT_RUN_TYPE_MISUSE_OPERATION_EXAMPLE.type).toBe("AGENT_RUN");
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workstations",
      slug: "agent-run",
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
          "Discriminator: type = AGENT_RUN",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-agent-run-type-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      AGENT_RUN_TYPE_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("AGENT_RUN");
    expect(screen.getByTestId("agent-run-type-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: AGENT_RUN")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "agent-run-type-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", {
          name: "Workers family index (AGENT_WORKER)",
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
      screen
        .getByRole("link", { name: "Model-invoke type" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/model-invoke");

    expect(
      screen.getByText("Minimal valid AGENT_RUN workstation:"),
    ).toBeTruthy();
    expect(
      screen.getByText("Incompatible misuse — operation on AGENT_RUN:"),
    ).toBeTruthy();
    const examples = document.querySelector("[data-agent-run-type-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-agent-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "AGENT_RUN"');
    expect(
      examples?.querySelector('[data-agent-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"behavior": "STANDARD"');
    expect(
      examples?.querySelector('[data-agent-run-type-example="minimal"]')
        ?.textContent,
    ).toContain('"openCodeAgent"');
    expect(
      examples?.querySelector(
        '[data-agent-run-type-example="misuse-operation"]',
      )?.textContent,
    ).toContain('"operation"');

    const failureTable = document.querySelector(
      "[data-agent-run-type-failure-table]",
    );
    expect(failureTable).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("worker_missing"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("worker_type_mismatch"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("operation_on_agent_run"),
    ).toBeTruthy();
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<AgentRunTypeVariantSchemaEmbed />);

    expect(html).toContain('data-agent-run-type-schema-embed=""');
    expect(html).toContain(AGENT_RUN_TYPE_OVERLAY_ID);
    expect(html).toContain("AGENT_RUN");
    expect(html).toContain("agent-run-type-variant-schema");
    expect(AGENT_RUN_TYPE_PAGE_PATH).toBe("/docs/workstations/agent-run");
  });
});
