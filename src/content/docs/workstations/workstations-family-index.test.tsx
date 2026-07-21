/**
 * Page-owned proofs for the `/docs/workstations` family index.
 * Covers overview copy, type and behavior selection, type-versus-behavior
 * compatibility matrix, shared-field summary, live Workstation schema embed,
 * and registry identity — not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workstationsFamilyRegistry from "@/content/registry/documentation/workstations-family.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import {
  loadWorkstationBaseSchemaEmbedModel,
  resolveFactorySchemaFsPath,
  WORKSTATION_BASE_DEFINITION_POINTER,
} from "./load-workstation-base-schema";
import {
  loadWorkstationsFamilyIndexBundle,
  resolveWorkstationsFamilyIndexMessagesLocale,
  WORKSTATIONS_FAMILY_INDEX_PATH,
  WORKSTATIONS_FAMILY_INDEX_REGISTRY_ID,
} from "./load-workstations-family-index";
import { renderWorkstationsFamilyIndexPage } from "./render-workstations-family-index";
import { WorkstationsFamilyIndexContent } from "./WorkstationsFamilyIndexContent";

describe("workstations family index", () => {
  afterEach(() => {
    cleanup();
  });

  test("loads isolation-first overview and selection copy from page-local messages", async () => {
    const bundle = await loadWorkstationsFamilyIndexBundle();

    expect(bundle.messages.title).toBe("Workstations");
    expect(bundle.messages.description).toMatch(/WorkstationType/i);
    expect(bundle.messages.description).toMatch(/behavior/i);
    expect(bundle.messages.description).not.toMatch(/Model Atlas/i);
    expect(bundle.route).toBe(WORKSTATIONS_FAMILY_INDEX_PATH);

    const openingSummary = String(bundle.messages.openingSummary ?? "");
    const howToUse = String(bundle.messages.sections?.howToUse?.body ?? "");
    const matrix = String(
      bundle.messages.sections?.typeBehaviorMatrix?.body ?? "",
    );
    const sharedFields = String(
      bundle.messages.sections?.sharedFields?.body ?? "",
    );

    expect(bundle.messages.sections?.whatItCovers).toBeUndefined();
    expect(bundle.messages.sections?.keyConcepts).toBeUndefined();
    expect(bundle.messages.sections?.operationalCautions).toBeUndefined();
    expect(bundle.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(openingSummary).toMatch(/WorkstationType|runtime type/i);
    expect(openingSummary).toMatch(/POLLER_RUN/i);
    expect(openingSummary).toMatch(/behavior POLLER/i);
    expect(howToUse).toMatch(/selection tables/i);
    expect(howToUse).toMatch(/POLLER_RUN/i);
    expect(howToUse).toMatch(/not the same discriminator/i);
    expect(matrix).toMatch(/independent/i);
    expect(sharedFields).toMatch(/apply across Workstation/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("falls back to default-locale messages for unshipped locales", () => {
    expect(resolveWorkstationsFamilyIndexMessagesLocale("en")).toBe("en");
    expect(resolveWorkstationsFamilyIndexMessagesLocale("ja")).toBe("en");
    expect(resolveWorkstationsFamilyIndexMessagesLocale("vi")).toBe("en");
    expect(resolveWorkstationsFamilyIndexMessagesLocale("zh-CN")).toBe("en");
  });

  test("registers the workstations-family registry record", () => {
    expect(workstationsFamilyRegistry.id).toBe(
      WORKSTATIONS_FAMILY_INDEX_REGISTRY_ID,
    );
    expect(workstationsFamilyRegistry.slug).toBe("workstations-family");
    expect(workstationsFamilyRegistry.kind).toBe("documentation");
    expect(workstationsFamilyRegistry.status).toBe("published");
  });

  test("loads the live Factory Workstation base definition for the W07 embed", () => {
    const model = loadWorkstationBaseSchemaEmbedModel();
    expect(model.address.pointer).toBe(WORKSTATION_BASE_DEFINITION_POINTER);
    expect(model.definition.address.pointer).toBe(
      WORKSTATION_BASE_DEFINITION_POINTER,
    );
    expect(model.publicArtifactId).toContain("schemas/factory");
    expect(resolveFactorySchemaFsPath()).toContain("factory.schema.json");
  });

  test("renders type and behavior selection links plus the compatibility matrix", async () => {
    const bundle = await loadWorkstationsFamilyIndexBundle();

    render(
      <main>
        <DocsPageProviders messages={bundle.messages} assets={bundle.assets}>
          <WorkstationsFamilyIndexContent />
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
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

    const typeSelection = document.querySelector(
      "[data-workstations-type-selection-table]",
    );
    expect(typeSelection).toBeTruthy();
    const typeTable = within(typeSelection as HTMLElement);

    expect(typeTable.getByText("INFERENCE_RUN")).toBeTruthy();
    expect(typeTable.getByText("AGENT_RUN")).toBeTruthy();
    expect(typeTable.getByText("SCRIPT_RUN")).toBeTruthy();
    expect(typeTable.getByText("POLLER_RUN")).toBeTruthy();
    expect(typeTable.getByText("MODEL_WORKSTATION")).toBeTruthy();
    expect(typeTable.getByText("MODEL_INVOKE")).toBeTruthy();
    expect(typeTable.getByText("LOGICAL_MOVE")).toBeTruthy();
    expect(typeTable.getByText("CLASSIFIER_WORKSTATION")).toBeTruthy();

    expect(
      screen.getByRole("link", { name: "Inference run" }).getAttribute("href"),
    ).toBe("/docs/workstations/inference-run");
    expect(
      screen.getByRole("link", { name: "Agent run" }).getAttribute("href"),
    ).toBe("/docs/workstations/agent-run");
    expect(
      screen.getByRole("link", { name: "Script run" }).getAttribute("href"),
    ).toBe("/docs/workstations/script-run");
    expect(
      screen.getByRole("link", { name: "Poller run" }).getAttribute("href"),
    ).toBe("/docs/workstations/poller-run");
    expect(
      screen
        .getByRole("link", { name: "Model workstation" })
        .getAttribute("href"),
    ).toBe("/docs/workstations/model-workstation");
    expect(
      screen.getByRole("link", { name: "Model invoke" }).getAttribute("href"),
    ).toBe("/docs/workstations/model-invoke");
    expect(
      screen.getByRole("link", { name: "Logical move" }).getAttribute("href"),
    ).toBe("/docs/workstations/logical-move");
    expect(
      screen.getByRole("link", { name: "Classifier" }).getAttribute("href"),
    ).toBe("/docs/workstations/classifier");

    const behaviorSelection = document.querySelector(
      "[data-workstations-behavior-selection-table]",
    );
    expect(behaviorSelection).toBeTruthy();
    const behaviorTable = within(behaviorSelection as HTMLElement);
    expect(behaviorTable.getByText("STANDARD")).toBeTruthy();
    expect(behaviorTable.getByText("REPEATER")).toBeTruthy();
    expect(behaviorTable.getByText("CRON")).toBeTruthy();
    expect(behaviorTable.getByText("POLLER")).toBeTruthy();

    expect(
      screen.getByRole("link", { name: "Standard" }).getAttribute("href"),
    ).toBe("/docs/workstations/standard");
    expect(
      screen.getByRole("link", { name: "Repeater" }).getAttribute("href"),
    ).toBe("/docs/workstations/repeater");
    expect(
      screen.getByRole("link", { name: "Cron" }).getAttribute("href"),
    ).toBe("/docs/workstations/cron");
    expect(
      screen.getByRole("link", { name: "Poller" }).getAttribute("href"),
    ).toBe("/docs/workstations/poller");

    expect(
      document.querySelector("[data-workstations-poller-axes-note]"),
    ).toBeTruthy();
    expect(screen.getByText(/Do not collapse POLLER_RUN/i)).toBeTruthy();

    const matrix = document.querySelector(
      "[data-workstations-compatibility-matrix]",
    );
    expect(matrix).toBeTruthy();
    const matrixTable = within(matrix as HTMLElement);
    expect(matrixTable.getAllByText("Compatible")).toHaveLength(32);
    expect(matrixTable.getByText("POLLER_RUN")).toBeTruthy();
    expect(matrixTable.getByText("POLLER")).toBeTruthy();

    expect(
      screen
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");

    const shared = document.querySelector(
      "[data-workstations-shared-fields-table]",
    );
    expect(shared).toBeTruthy();
    expect(within(shared as HTMLElement).getByText("name")).toBeTruthy();
    expect(within(shared as HTMLElement).getByText("type")).toBeTruthy();
    expect(within(shared as HTMLElement).getByText("behavior")).toBeTruthy();
  });

  test("renders the authored family index through the App Router entry", async () => {
    const bundle = await loadWorkstationsFamilyIndexBundle();
    const html = renderToStaticMarkup(
      await renderWorkstationsFamilyIndexPage(),
    );

    expect(html).toContain("Workstations");
    expect(html).toContain(String(bundle.messages.openingSummary ?? ""));
    expect(html).toContain("How To Use");
    expect(html).not.toContain("What It Covers");
    expect(html).not.toContain("Key Concepts");
    expect(html).not.toContain("Operational Cautions");
    expect(html).not.toContain("Limits And Assumptions");
    expect(html).not.toContain("Related To");
    expect(html).not.toContain(">References<");
    expect(html).not.toContain('id="related"');
    expect(html).not.toContain('id="references"');
    expect(html).not.toContain("data-related-group");
    expect(html).not.toContain("curated-related-docs");
    expect(html).toContain('data-workstations-family-index=""');
    expect(html).toContain('data-workstations-type-selection-table=""');
    expect(html).toContain('data-workstations-behavior-selection-table=""');
    expect(html).toContain('data-workstations-compatibility-matrix=""');
    expect(html).toContain("INFERENCE_RUN");
    expect(html).toContain("POLLER_RUN");
    expect(html).toContain("Do not collapse POLLER_RUN");
    expect(html).toContain('data-workstations-family-schema-embed=""');
    expect(html).toContain(WORKSTATION_BASE_DEFINITION_POINTER);
    expect(html).not.toContain("No workstation entries yet");
  });
});
