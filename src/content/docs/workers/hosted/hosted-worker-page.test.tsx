/**
 * Page-owned proofs for /docs/workers/hosted.
 * Covers HOSTED_WORKER discriminator, W07 overlay embed, minimal/misuse
 * examples, LOGICAL_MOVE + CLASSIFIER_WORKSTATION companion links, and
 * operational cautions — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersHostedRegistry from "@/content/registry/documentation/workers-hosted.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import { createProductionWorkerOverlay } from "@/lib/references/overlays/production-worker-overlays";
import { factoryVariantOverlayToSchemaVariantPresentation } from "../factory-variant-overlay-presentation";
import {
  HOSTED_WORKER_OVERLAY_ID,
  HOSTED_WORKER_PAGE_PATH,
  HostedWorkerVariantSchemaEmbed,
} from "./HostedWorkerVariantSchemaEmbed";
import {
  HOSTED_WORKER_EXAMPLE_IDS,
  HOSTED_WORKER_MINIMAL_EXAMPLE,
  HOSTED_WORKER_MISUSE_INLINE_SECRET_EXAMPLE,
} from "./hosted-worker-examples";

describe("workers hosted page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workers-hosted registry record", () => {
    expect(workersHostedRegistry.id).toBe("documentation.workers-hosted");
    expect(workersHostedRegistry.slug).toBe("workers-hosted");
    expect(workersHostedRegistry.kind).toBe("documentation");
    expect(workersHostedRegistry.status).toBe("published");
  });

  test("loads isolation-first HOSTED_WORKER teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "hosted",
    });

    expect(loadedPage.messages.title).toBe("Hosted worker");
    expect(loadedPage.messages.description).toMatch(/HOSTED_WORKER/i);
    expect(loadedPage.messages.description).toMatch(
      /auth\.secretRef|provider|LOGICAL_MOVE/i,
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
    expect(openingSummary).toMatch(/HOSTED_WORKER/i);
    expect(openingSummary).toMatch(/LOGICAL_MOVE/i);
    expect(howToUse).toMatch(/auth\.secretRef|provider/i);
    expect(howToUse).toMatch(/LOGICAL_MOVE/i);
    expect(howToUse).toMatch(/POLLER_WORKER/i);
    expect(schemaReference).toMatch(/overlay applicability/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/inline|secretRef/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("projects the production HOSTED_WORKER overlay into W07 presentation", () => {
    const overlay = createProductionWorkerOverlay("HOSTED_WORKER");
    const presentation =
      factoryVariantOverlayToSchemaVariantPresentation(overlay);

    expect(overlay.id).toBe(HOSTED_WORKER_OVERLAY_ID);
    expect(overlay.discriminator).toEqual({
      field: "type",
      value: "HOSTED_WORKER",
    });
    expect(presentation.variantLabel).toBe("HOSTED_WORKER");
    // Shared paths stay unannotated in W07 presentation; selected is empty
    // for this legacy projection (hosted fields live in shared).
    expect(overlay.fields.selected).toEqual([]);
    expect(overlay.fields.shared).toEqual(
      expect.arrayContaining(["provider", "auth", "linear"]),
    );
    expect(presentation.fields).toEqual(
      expect.arrayContaining([
        { path: "model", applicability: "excluded" },
        { path: "command", applicability: "excluded" },
        { path: "agentTools", applicability: "excluded" },
      ]),
    );
    expect(overlay.companions.required).toContain("workstation:LOGICAL_MOVE");
    expect(overlay.companions.compatible).toEqual(
      expect.arrayContaining([
        "workstation:LOGICAL_MOVE",
        "workstation:CLASSIFIER_WORKSTATION",
      ]),
    );
    expect(overlay.examples.map((entry) => entry.exampleId)).toEqual([
      HOSTED_WORKER_EXAMPLE_IDS.minimal,
      HOSTED_WORKER_EXAMPLE_IDS.misuseInlineSecret,
    ]);
    expect(HOSTED_WORKER_MINIMAL_EXAMPLE.type).toBe("HOSTED_WORKER");
    expect(HOSTED_WORKER_MINIMAL_EXAMPLE).toHaveProperty("provider");
    expect(HOSTED_WORKER_MINIMAL_EXAMPLE.auth).toHaveProperty("secretRef");
    expect(HOSTED_WORKER_MISUSE_INLINE_SECRET_EXAMPLE.auth).toHaveProperty(
      "apiKey",
    );
  });

  test("renders discriminator, overlay embed, examples, and companion links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "hosted",
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
          "Discriminator: type = HOSTED_WORKER",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-hosted-worker-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-overlay-id")).toBe(
      HOSTED_WORKER_OVERLAY_ID,
    );
    expect(embed?.getAttribute("data-discriminator")).toBe("HOSTED_WORKER");
    expect(screen.getByTestId("hosted-worker-variant-schema")).toBeTruthy();
    expect(screen.queryByText("Variant: HOSTED_WORKER")).toBeNull();
    const schemaDefinition = screen.getByTestId(
      "hosted-worker-variant-schema-definition",
    );
    expect(
      schemaDefinition.querySelector(
        ':scope > header [data-testid="schema-breadcrumb"]',
      ),
    ).toBeNull();

    expect(
      screen
        .getByRole("link", { name: "Logical move (LOGICAL_MOVE)" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/logical-move");
    expect(
      screen
        .getByRole("link", {
          name: "Classifier workstation (CLASSIFIER_WORKSTATION)",
        })
        .getAttribute("href"),
    ).toBe("/docs/workstations/classifier");
    expect(
      screen
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");
    expect(
      screen.queryByRole("link", { name: "Workers family index" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Poller worker" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Related To" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "References" })).toBeNull();
    expect(document.getElementById("related")).toBeNull();
    expect(document.getElementById("references")).toBeNull();
    expect(document.querySelector("[data-related-group]")).toBeNull();
    expect(screen.queryByTestId("curated-related-docs")).toBeNull();

    expect(screen.getByText("Minimal valid HOSTED_WORKER:")).toBeTruthy();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Incompatible misuse — inline secret on HOSTED_WORKER (rejected):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-hosted-worker-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-hosted-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"type": "HOSTED_WORKER"');
    expect(
      examples?.querySelector('[data-hosted-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"secretRef"');
    expect(
      examples?.querySelector(
        '[data-hosted-worker-example="misuse-inline-secret"]',
      )?.textContent,
    ).toContain('"apiKey"');
  });

  test("renders the variant schema embed in isolation", () => {
    const html = renderToStaticMarkup(<HostedWorkerVariantSchemaEmbed />);

    expect(html).toContain('data-hosted-worker-schema-embed=""');
    expect(html).toContain(HOSTED_WORKER_OVERLAY_ID);
    expect(html).toContain("HOSTED_WORKER");
    expect(html).toContain("hosted-worker-variant-schema");
    expect(HOSTED_WORKER_PAGE_PATH).toBe("/docs/workers/hosted");
  });
});
