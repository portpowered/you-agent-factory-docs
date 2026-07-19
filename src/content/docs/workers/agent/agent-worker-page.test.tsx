/**
 * Page-owned proofs for /docs/workers/agent.
 * Covers AGENT_WORKER discriminator, W07 overlay embed, minimal/misuse
 * examples, AGENT_RUN companion link — not route
 * inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersAgentRegistry from "@/content/registry/documentation/workers-agent.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  AGENT_WORKER_OVERLAY_ID,
  AGENT_WORKER_PAGE_PATH,
  AgentWorkerVariantSchemaEmbed,
} from "./AgentWorkerVariantSchemaEmbed";
import {
  AGENT_WORKER_EXAMPLE_IDS,
  AGENT_WORKER_MINIMAL_EXAMPLE,
  AGENT_WORKER_MISUSE_OPERATIONS_EXAMPLE,
} from "./agent-worker-examples";

describe("workers agent page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workers-agent registry record", () => {
    expect(workersAgentRegistry.id).toBe("documentation.workers-agent");
    expect(workersAgentRegistry.slug).toBe("workers-agent");
    expect(workersAgentRegistry.kind).toBe("documentation");
    expect(workersAgentRegistry.status).toBe("published");
  });

  test("loads isolation-first AGENT_WORKER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "agent",
    });

    expect(loadedPage.messages.title).toBe("Agent worker");
    expect(loadedPage.messages.description).toMatch(/AGENT_WORKER/i);
    expect(loadedPage.messages.description).toMatch(/agentTools/i);
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
    expect(openingSummary).toMatch(/AGENT_WORKER/i);
    expect(openingSummary).toMatch(/AGENT_RUN/i);
    expect(howToUse).toMatch(/model and modelProvider/i);
    expect(howToUse).toMatch(/agentTools\.policy/i);
    expect(howToUse).toMatch(/not INFERENCE_WORKER/i);
    expect(schemaReference).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/operations/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production AGENT_WORKER overlay into W07 presentation", () => {
    const overlay = createProductionWorkerOverlay("AGENT_WORKER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(AGENT_WORKER_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "AGENT_WORKER",
    });
    expect(presentation.variantLabel).toBe("AGENT_WORKER");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "agentTools", applicability: "selected" },
        { path: "openCodeAgent", applicability: "selected" },
        { path: "skipPermissions", applicability: "selected" },
        { path: "operations", applicability: "excluded" },
        { path: "command", applicability: "excluded" },
      ]),
    );
    expect(overlay.companions.required).toContain("workstation:AGENT_RUN");
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      AGENT_WORKER_EXAMPLE_IDS.minimal,
      AGENT_WORKER_EXAMPLE_IDS.misuseOperations,
    ]);
    expect(AGENT_WORKER_MINIMAL_EXAMPLE.type).toBe("AGENT_WORKER");
    expect(AGENT_WORKER_MISUSE_OPERATIONS_EXAMPLE).toHaveProperty("operations");
  });

  test("renders discriminator, overlay embed, examples, and companion link", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "agent",
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
          "Discriminator: type = AGENT_WORKER",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-agent-worker-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      AGENT_WORKER_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("AGENT_WORKER");
    expect(screen.getByTestId("agent-worker-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: AGENT_WORKER")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "agent-worker-variant-schema-definition",
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
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");
    expect(
      screen
        .getByRole("link", { name: "Workers family index" })
        .getAttribute("href"),
    ).toBe("/docs/workers");

    expect(screen.getByText("Minimal valid AGENT_WORKER:")).toBeTruthy();
    expect(
      screen.getByText(
        "Incompatible misuse — operations on AGENT_WORKER (rejected):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-agent-worker-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-agent-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "AGENT_WORKER"');
    expect(
      examples?.querySelector('[data-agent-worker-example="misuse-operations"]')
        ?.textContent,
    ).toContain('"operations": [');
    expect(
      examples?.querySelector('[data-agent-worker-example="misuse-operations"]')
        ?.textContent,
    ).toContain('"CHAT"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<AgentWorkerVariantSchemaEmbed />);

    expect(html).toContain('data-agent-worker-schema-embed=""');
    expect(html).toContain(AGENT_WORKER_OVERLAY_ID);
    expect(html).toContain("AGENT_WORKER");
    expect(html).toContain("agent-worker-variant-schema");
    expect(AGENT_WORKER_PAGE_PATH).toBe("/docs/workers/agent");
  });
});
