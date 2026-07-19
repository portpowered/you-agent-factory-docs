/**
 * Page-owned proofs for the `/docs/workers` family index.
 * Covers overview copy, selection table (Factory types + separate mock row),
 * shared-field summary, live Worker schema embed, and registry identity —
 * not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersFamilyRegistry from "@/content/registry/documentation/workers-family.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import {
  loadWorkerBaseSchemaEmbedModel,
  resolveFactorySchemaFsPath,
  WORKER_BASE_DEFINITION_POINTER,
} from "./load-worker-base-schema";
import {
  loadWorkersFamilyIndexBundle,
  resolveWorkersFamilyIndexMessagesLocale,
  WORKERS_FAMILY_INDEX_PATH,
  WORKERS_FAMILY_INDEX_REGISTRY_ID,
} from "./load-workers-family-index";
import { renderWorkersFamilyIndexPage } from "./render-workers-family-index";
import { WorkersFamilyIndexContent } from "./WorkersFamilyIndexContent";

describe("workers family index", () => {
  afterEach(() => {
    cleanup();
  });

  test("loads isolation-first overview and selection copy from page-local messages", async () => {
    const bundle = await loadWorkersFamilyIndexBundle();

    expect(bundle.messages.title).toBe("Workers");
    expect(bundle.messages.description).toMatch(/WorkerType/i);
    expect(bundle.messages.description).not.toMatch(/Model Atlas/i);
    expect(bundle.route).toBe(WORKERS_FAMILY_INDEX_PATH);

    const openingSummary = String(bundle.messages.openingSummary ?? "");
    const howToUse = String(bundle.messages.sections?.howToUse?.body ?? "");
    const selection = String(bundle.messages.sections?.selection?.body ?? "");
    const sharedFields = String(
      bundle.messages.sections?.sharedFields?.body ?? "",
    );

    expect(bundle.messages.sections?.whatItCovers).toBeUndefined();
    expect(bundle.messages.sections?.keyConcepts).toBeUndefined();
    expect(bundle.messages.sections?.operationalCautions).toBeUndefined();
    expect(bundle.messages.sections?.limitsAndAssumptions).toBeUndefined();
    expect(openingSummary).toMatch(/WorkerType/i);
    expect(openingSummary).toMatch(/mock workers/i);
    expect(howToUse).toMatch(/selection table/i);
    expect(howToUse).toMatch(/Mock workers are not a Factory WorkerType/i);
    expect(selection).toMatch(/comparison/i);
    expect(sharedFields).toMatch(/apply across Factory Worker/i);
    expect(openingSummary).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("falls back to default-locale messages for unshipped locales", () => {
    expect(resolveWorkersFamilyIndexMessagesLocale("en")).toBe("en");
    expect(resolveWorkersFamilyIndexMessagesLocale("ja")).toBe("en");
    expect(resolveWorkersFamilyIndexMessagesLocale("vi")).toBe("en");
    expect(resolveWorkersFamilyIndexMessagesLocale("zh-CN")).toBe("en");
  });

  test("registers the workers-family registry record", () => {
    expect(workersFamilyRegistry.id).toBe(WORKERS_FAMILY_INDEX_REGISTRY_ID);
    expect(workersFamilyRegistry.slug).toBe("workers-family");
    expect(workersFamilyRegistry.kind).toBe("documentation");
    expect(workersFamilyRegistry.status).toBe("published");
  });

  test("loads the live Factory Worker base definition for the W07 embed", () => {
    const model = loadWorkerBaseSchemaEmbedModel();
    expect(model.address.pointer).toBe(WORKER_BASE_DEFINITION_POINTER);
    expect(model.definition.address.pointer).toBe(
      WORKER_BASE_DEFINITION_POINTER,
    );
    expect(model.publicArtifactId).toContain("schemas/factory");
    expect(resolveFactorySchemaFsPath()).toContain("factory.schema.json");
  });

  test("renders selection links for all six WorkerTypes and a separate mock row", async () => {
    const bundle = await loadWorkersFamilyIndexBundle();

    render(
      <main>
        <DocsPageProviders messages={bundle.messages} assets={bundle.assets}>
          <WorkersFamilyIndexContent />
        </DocsPageProviders>
      </main>,
    );

    expect(
      screen.queryByRole("heading", { name: "What It Covers" }),
    ).toBeNull();
    expect(screen.queryByRole("heading", { name: "Key Concepts" })).toBeNull();
    expect(screen.getByRole("heading", { name: "How To Use" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Limits And Assumptions" }),
    ).toBeNull();

    const selection = document.querySelector("[data-workers-selection-table]");
    expect(selection).toBeTruthy();
    const table = within(selection as HTMLElement);

    expect(table.getByText("INFERENCE_WORKER")).toBeTruthy();
    expect(table.getByText("AGENT_WORKER")).toBeTruthy();
    expect(table.getByText("SCRIPT_WORKER")).toBeTruthy();
    expect(table.getByText("POLLER_WORKER")).toBeTruthy();
    expect(table.getByText("MODEL_WORKER")).toBeTruthy();
    expect(table.getByText("HOSTED_WORKER")).toBeTruthy();
    expect(table.getByText("Mock worker (not a WorkerType)")).toBeTruthy();

    expect(
      screen
        .getByRole("link", { name: "Inference worker" })
        .getAttribute("href"),
    ).toBe("/docs/workers/inference");
    expect(
      screen.getByRole("link", { name: "Agent worker" }).getAttribute("href"),
    ).toBe("/docs/workers/agent");
    expect(
      screen.getByRole("link", { name: "Script worker" }).getAttribute("href"),
    ).toBe("/docs/workers/script");
    expect(
      screen.getByRole("link", { name: "Poller worker" }).getAttribute("href"),
    ).toBe("/docs/workers/poller");
    expect(
      screen.getByRole("link", { name: "Model worker" }).getAttribute("href"),
    ).toBe("/docs/workers/model");
    expect(
      screen.getByRole("link", { name: "Hosted worker" }).getAttribute("href"),
    ).toBe("/docs/workers/hosted");
    expect(
      screen.getByRole("link", { name: "Mock worker" }).getAttribute("href"),
    ).toBe("/docs/workers/mock");

    expect(
      screen
        .getByRole("link", { name: "Full Factory schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/factory-schema");

    const shared = document.querySelector("[data-workers-shared-fields-table]");
    expect(shared).toBeTruthy();
    expect(within(shared as HTMLElement).getByText("name")).toBeTruthy();
    expect(within(shared as HTMLElement).getByText("type")).toBeTruthy();
  });

  test("renders the authored family index through the App Router entry", async () => {
    const html = renderToStaticMarkup(await renderWorkersFamilyIndexPage());

    expect(html).toContain("Workers");
    expect(html).toContain('data-workers-family-index=""');
    expect(html).toContain('data-workers-selection-table=""');
    expect(html).toContain("INFERENCE_WORKER");
    expect(html).toContain("Mock worker (not a WorkerType)");
    expect(html).toContain('data-workers-family-schema-embed=""');
    expect(html).toContain(WORKER_BASE_DEFINITION_POINTER);
    expect(html).not.toContain("No worker entries yet");
  });
});
