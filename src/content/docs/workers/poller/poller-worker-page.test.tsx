/**
 * Page-owned proofs for /docs/workers/poller.
 * Covers POLLER_WORKER discriminator, W07 overlay embed, minimal/misuse
 * examples, POLLER_RUN + behavior POLLER companion links, and operational
 * cautions — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersPollerRegistry from "@/content/registry/documentation/workers-poller.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  POLLER_WORKER_OVERLAY_ID,
  POLLER_WORKER_PAGE_PATH,
  PollerWorkerVariantSchemaEmbed,
} from "./PollerWorkerVariantSchemaEmbed";
import {
  POLLER_WORKER_EXAMPLE_IDS,
  POLLER_WORKER_MINIMAL_EXAMPLE,
  POLLER_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
} from "./poller-worker-examples";

describe("workers poller page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workers-poller registry record", () => {
    expect(workersPollerRegistry.id).toBe("documentation.workers-poller");
    expect(workersPollerRegistry.slug).toBe("workers-poller");
    expect(workersPollerRegistry.kind).toBe("documentation");
    expect(workersPollerRegistry.status).toBe("published");
  });

  test("loads isolation-first POLLER_WORKER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "poller",
    });

    expect(loadedPage.messages.title).toBe("Poller worker");
    expect(loadedPage.messages.description).toMatch(/POLLER_WORKER/i);
    expect(loadedPage.messages.description).toMatch(
      /auth\.secretRef|provider/i,
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
    expect(openingSummary).toMatch(/POLLER_WORKER/i);
    expect(openingSummary).toMatch(/behavior POLLER/i);
    expect(howToUse).toMatch(/POLLER_RUN/i);
    expect(howToUse).toMatch(/behavior POLLER/i);
    expect(howToUse).toMatch(/auth\.secretRef/i);
    expect(howToUse).toMatch(/LINEAR|provider/i);
    expect(schemaReference).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/inline|secretRef/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production POLLER_WORKER overlay into W07 presentation", () => {
    const overlay = createProductionWorkerOverlay("POLLER_WORKER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(POLLER_WORKER_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "POLLER_WORKER",
    });
    expect(presentation.variantLabel).toBe("POLLER_WORKER");
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "provider", applicability: "selected" },
        { path: "auth", applicability: "selected" },
        { path: "linear", applicability: "selected" },
        { path: "model", applicability: "excluded" },
        { path: "command", applicability: "excluded" },
        { path: "agentTools", applicability: "excluded" },
      ]),
    );
    expect(overlay.companions.required).toContain("workstation:POLLER_RUN");
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      POLLER_WORKER_EXAMPLE_IDS.minimal,
      POLLER_WORKER_EXAMPLE_IDS.misuseInlineSecret,
    ]);
    expect(POLLER_WORKER_MINIMAL_EXAMPLE.type).toBe("POLLER_WORKER");
    expect(POLLER_WORKER_MINIMAL_EXAMPLE).toHaveProperty("provider");
    expect(POLLER_WORKER_MINIMAL_EXAMPLE.auth).toHaveProperty("secretRef");
    expect(POLLER_WORKER_MISUSE_INLINE_SECRET_EXAMPLE.auth).toHaveProperty(
      "apiKey",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
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

    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Discriminator: type = POLLER_WORKER",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-poller-worker-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      POLLER_WORKER_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("POLLER_WORKER");
    expect(screen.getByTestId("poller-worker-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: POLLER_WORKER")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "poller-worker-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", { name: "Poller-run workstation (POLLER_RUN type)" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/poller-run");
    expect(
      screen
        .getByRole("link", { name: "Poller workstation (behavior = POLLER)" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/poller");
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

    expect(screen.getByText("Minimal valid POLLER_WORKER:")).toBeTruthy();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Incompatible misuse — inline secret on POLLER_WORKER (rejected):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-poller-worker-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-poller-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "POLLER_WORKER"');
    expect(
      examples?.querySelector('[data-poller-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"secretRef"');
    expect(
      examples?.querySelector(
        '[data-poller-worker-example="misuse-inline-secret"]',
      )?.textContent,
    ).toContain('"apiKey"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<PollerWorkerVariantSchemaEmbed />);

    expect(html).toContain('data-poller-worker-schema-embed=""');
    expect(html).toContain(POLLER_WORKER_OVERLAY_ID);
    expect(html).toContain("POLLER_WORKER");
    expect(html).toContain("poller-worker-variant-schema");
    expect(POLLER_WORKER_PAGE_PATH).toBe("/docs/workers/poller");
  });
});
