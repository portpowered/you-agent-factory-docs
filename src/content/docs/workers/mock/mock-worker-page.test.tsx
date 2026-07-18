/**
 * Page-owned proofs for /docs/workers/mock.
 * Covers mock-workers schema identity (not Factory WorkerType), W07
 * SchemaReference embed, minimal/misuse examples, and operational cautions —
 * not route inventories or shared helper contracts.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import workersMockRegistry from "@/content/registry/documentation/workers-mock.json";
import { DocsPageProviders } from "@/features/docs/components/DocsPageProviders";
import { loadLocalDocsPage } from "@/lib/content/local-docs-page";
import {
  loadMockWorkersSchemaEmbedModel,
  MOCK_WORKER_DEFINITION_POINTER,
} from "./load-mock-workers-schema";
import {
  MOCK_WORKER_PAGE_PATH,
  MOCK_WORKERS_SCHEMA_SPECIFIER,
  MockWorkersSchemaEmbed,
} from "./MockWorkersSchemaEmbed";
import {
  MOCK_WORKER_EXAMPLE_IDS,
  MOCK_WORKER_MINIMAL_EXAMPLE,
  MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE,
} from "./mock-worker-examples";

describe("workers mock page", () => {
  afterEach(() => {
    cleanup();
  });

  test("registers the workers-mock registry record", () => {
    expect(workersMockRegistry.id).toBe("documentation.workers-mock");
    expect(workersMockRegistry.slug).toBe("workers-mock");
    expect(workersMockRegistry.kind).toBe("documentation");
    expect(workersMockRegistry.status).toBe("published");
  });

  test("loads isolation-first mock-workers teaching from page-local messages", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "mock",
    });

    expect(loadedPage.messages.title).toBe("Mock worker");
    expect(loadedPage.messages.description).toMatch(/mock-workers/i);
    expect(loadedPage.messages.description).toMatch(
      /runType|accept|reject|script/i,
    );
    expect(loadedPage.messages.description).toMatch(
      /not a Factory WorkerType/i,
    );
    expect(loadedPage.messages.description).not.toMatch(/Model Atlas/i);

    const whatItCovers = String(
      loadedPage.messages.sections?.whatItCovers?.body ?? "",
    );
    const keyConcepts = String(
      loadedPage.messages.sections?.keyConcepts?.body ?? "",
    );
    const howToUse = String(loadedPage.messages.sections?.howToUse?.body ?? "");
    const schemaFields = String(
      loadedPage.messages.sections?.schemaFields?.body ?? "",
    );
    const examples = String(loadedPage.messages.sections?.examples?.body ?? "");
    const cautions = String(
      loadedPage.messages.sections?.operationalCautions?.body ?? "",
    );
    const limits = String(
      loadedPage.messages.sections?.limitsAndAssumptions?.body ?? "",
    );

    expect(whatItCovers).toMatch(/mock-workers/i);
    expect(whatItCovers).toMatch(/not a Factory WorkerType/i);
    expect(keyConcepts).toMatch(/runType/i);
    expect(keyConcepts).toMatch(/accept|script|reject/i);
    expect(keyConcepts).not.toMatch(/seventh Factory WorkerType|type = MOCK/i);
    expect(howToUse).toMatch(/--with-mock-workers|mockWorkers/i);
    expect(schemaFields).toMatch(/mockWorker|runType/i);
    expect(examples).toMatch(/minimal valid/i);
    expect(examples).toMatch(/WorkerType|MOCK_WORKER|workerName/i);
    expect(cautions).toMatch(/WorkerType|passthrough|unknown/i);
    expect(limits).toMatch(/not a sync of packaged CLI docs/i);
    expect(whatItCovers).not.toMatch(
      /on this page|Model Atlas|reader.?shortcut/i,
    );
  });

  test("loads the mock-workers schema fragment without Factory overlays", () => {
    const model = loadMockWorkersSchemaEmbedModel();

    expect(model.publicArtifactId).toBe(MOCK_WORKERS_SCHEMA_SPECIFIER);
    expect(model.address.pointer).toBe(MOCK_WORKER_DEFINITION_POINTER);
    expect(model.definition.address.pointer).toBe(
      MOCK_WORKER_DEFINITION_POINTER,
    );
    expect(MOCK_WORKER_MINIMAL_EXAMPLE.mockWorkers[0]?.runType).toBe("accept");
    expect(MOCK_WORKER_MINIMAL_EXAMPLE.mockWorkers[0]).toHaveProperty(
      "workerName",
    );
    expect(
      MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE.mockWorkers[0],
    ).toHaveProperty("type", "MOCK_WORKER");
    expect(
      MOCK_WORKER_MISUSE_WORKER_TYPE_EXAMPLE.mockWorkers[0],
    ).toHaveProperty("name");
    expect(MOCK_WORKER_EXAMPLE_IDS.minimal).toBe("worker.mock.minimal");
    expect(MOCK_WORKER_EXAMPLE_IDS.misuseWorkerType).toBe(
      "worker.mock.misuse-worker-type",
    );
  });

  test("renders identity, schema embed, examples, and discovery links", async () => {
    const loadedPage = await loadLocalDocsPage({
      section: "workers",
      slug: "mock",
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
    expect(screen.getByRole("heading", { name: "Schema Fields" })).toBeTruthy();
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
          "Identity: runType = accept | script | reject (mock-workers schema, not WorkerType)",
      ),
    ).toBeTruthy();

    const embed = document.querySelector("[data-mock-worker-schema-embed]");
    expect(embed).toBeTruthy();
    expect(embed?.getAttribute("data-schema-specifier")).toBe(
      MOCK_WORKERS_SCHEMA_SPECIFIER,
    );
    expect(embed?.getAttribute("data-mock-worker-pointer")).toBe(
      MOCK_WORKER_DEFINITION_POINTER,
    );
    expect(screen.getByTestId("mock-worker-schema")).toBeTruthy();

    expect(
      screen
        .getByRole("link", { name: "Full mock-workers schema reference" })
        .getAttribute("href"),
    ).toBe("/docs/references/mock-workers-schema");
    expect(
      screen
        .getByRole("link", { name: "Workers family index" })
        .getAttribute("href"),
    ).toBe("/docs/workers");
    expect(
      screen
        .getByRole("link", { name: "Mock workers CLI reference" })
        .getAttribute("href"),
    ).toBe("/docs/documentation/mock-workers");
    expect(
      screen.getByRole("link", { name: "Agent worker" }).getAttribute("href"),
    ).toBe("/docs/workers/agent");

    expect(screen.getByText("Minimal valid mock-workers config:")).toBeTruthy();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.textContent?.replace(/\s+/g, " ").trim() ===
          "Incompatible misuse — Factory WorkerType shape on mock entry (rejected):",
      ),
    ).toBeTruthy();
    const examples = document.querySelector("[data-mock-worker-examples]");
    expect(examples).toBeTruthy();
    expect(
      examples?.querySelector('[data-mock-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"runType": "accept"');
    expect(
      examples?.querySelector('[data-mock-worker-example="minimal"]')
        ?.textContent,
    ).toContain('"workerName": "reviewer"');
    expect(
      examples?.querySelector('[data-mock-worker-example="misuse-worker-type"]')
        ?.textContent,
    ).toContain('"type": "MOCK_WORKER"');

    const failureTable = document.querySelector(
      "[data-mock-worker-failure-table]",
    );
    expect(failureTable).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("Not a WorkerType"),
    ).toBeTruthy();
    expect(
      within(failureTable as HTMLElement).getByText("Unknown fields"),
    ).toBeTruthy();

    // Must not present mock as a Factory WorkerType discriminator line.
    expect(document.body.textContent).not.toMatch(/type = MOCK_WORKER/);
    expect(document.body.textContent).not.toMatch(
      /Variant:\s*MOCK_WORKER|worker:MOCK_WORKER/,
    );
  });

  test("renders the mock-workers schema embed in isolation", () => {
    const html = renderToStaticMarkup(<MockWorkersSchemaEmbed />);

    expect(html).toContain('data-mock-worker-schema-embed=""');
    expect(html).toContain(MOCK_WORKERS_SCHEMA_SPECIFIER);
    expect(html).toContain(MOCK_WORKER_DEFINITION_POINTER);
    expect(html).toContain("mock-worker-schema");
    expect(MOCK_WORKER_PAGE_PATH).toBe("/docs/workers/mock");
  });
});
